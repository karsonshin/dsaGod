/* Offer Ready: Resume studio (#/resume/:tab/:id).
   Tabs: Guide, Builder (live one-page preview, print to PDF), Documents (PDFs in IndexedDB + cover letters),
   Companies (records with URL autofill that works offline). Also exposes OR.resumeUI for the Pipeline view.
   Data: store.resume, store.coverLetters, store.companies, and OR.docs (IndexedDB). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, L = OR.rlib, G = OR.resumeGuide || {};
  var TABS = [['guide', 'Guide'], ['builder', 'Builder'], ['documents', 'Documents'], ['companies', 'Companies']];
  var MAX_BYTES = 5 * 1024 * 1024;
  var KINDS = [['resume', 'Resume'], ['cover-letter', 'Cover letter'], ['other', 'Other']];
  var TIERS = [['', 'Unsorted'], ['dream', 'Dream'], ['target', 'Target'], ['safety', 'Safety']];

  /* ---------- Shared helpers (also used by pipeline.js) ---------- */
  var UI = (OR.resumeUI = {});
  function st() { return OR.store.get(); }
  UI.companies = function () { return st().companies; };
  UI.company = function (id) { var l = st().companies; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; };
  UI.companyName = function (id) { var c = UI.company(id); return c ? c.name : ''; };
  UI.addCompany = function (o) {
    var name = String(o.name || '').trim(); if (!name) return null;
    var found = st().companies.filter(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })[0];
    if (found) return found;
    var rec = { id: 'c_' + OR.uid(), name: name, website: o.website || '', careersUrl: o.careersUrl || '', notes: o.notes || '', tier: o.tier || '', tags: o.tags || [], created: Date.now(), updated: Date.now() };
    OR.store.update(function (s) { s.companies.push(rec); });
    return rec;
  };
  UI.companyOptions = function (selected, blank) {
    var list = st().companies.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    return '<option value="">' + esc(blank || 'No company') + '</option>' + list.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === selected ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
  };
  function initials(name) {
    var w = String(name || '?').replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    return ((w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2))).toUpperCase();
  }
  // Initials avatar: no network, hue picked from the name.
  UI.avatar = function (name, cls) {
    var h = 0; String(name).split('').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) % 360; });
    return '<span class="co-av ' + (cls || '') + '" style="--h:' + h + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  };
  UI.fmtSize = function (b) { return b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 102.4) / 10 + ' KB' : Math.round(b / 104857.6) / 10 + ' MB'; };
  UI.safeUrl = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };
  UI.ext = function (u, label) { u = UI.safeUrl(u); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + OR.icon('external', 'icon-sm') + '</a>' : ''; };

  // A <dialog> with a real form: Enter submits, required fields validate, Esc cancels.
  UI.form = function (o) {
    return new Promise(function (resolve) {
      var dlg = document.createElement('dialog');
      dlg.className = 'modal rz-dialog' + (o.wide ? ' is-wide' : '');
      dlg.setAttribute('aria-labelledby', 'rz-dlg-title');
      dlg.innerHTML = '<form method="dialog" class="stack-4" novalidate><h2 id="rz-dlg-title">' + esc(o.title) + '</h2>' + o.html +
        '<div class="modal-actions">' + (o.extra || '') + '<button type="button" class="btn" data-x="cancel">Cancel</button><button type="submit" class="btn btn-primary">' + esc(o.ok || 'Save') + '</button></div></form>';
      document.body.appendChild(dlg);
      var form = dlg.querySelector('form'), done = false;
      function finish(v) { if (done) return; done = true; if (dlg.open) dlg.close(); dlg.remove(); resolve(v); }
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); finish(null); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) finish(null); });
      dlg.querySelector('[data-x="cancel"]').addEventListener('click', function () { finish(null); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = form.querySelector(':invalid');
        if (bad) { bad.focus(); bad.reportValidity && bad.reportValidity(); return; }
        finish(form);
      });
      if (o.onOpen) o.onOpen(dlg, form, finish);
      dlg.showModal();
      var f = dlg.querySelector('[autofocus]') || dlg.querySelector('input,select,textarea');
      if (f) f.focus();
    });
  };

  /* ---------- URL autofill widget ---------- */
  function decodeEnt(s) { return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); }
  // Optional and best effort: nearly every site blocks cross-origin reads, so this usually fails and says so.
  UI.fetchTitle = function (url) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 7000);
    return fetch(url, { mode: 'cors', credentials: 'omit', signal: ctl.signal }).then(function (r) {
      if (!r.ok) throw new Error('The site answered with status ' + r.status + '.');
      return r.text();
    }).then(function (html) {
      clearTimeout(t);
      var site = (html.match(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i) || [])[1];
      var title = (html.match(/<title[^>]*>([^<]{1,300})<\/title>/i) || [])[1];
      if (!site && !title) throw new Error('The page loaded but has no title.');
      return { site: site ? decodeEnt(site) : '', title: title ? decodeEnt(title) : '' };
    }, function (e) { clearTimeout(t); throw e; });
  };
  // host: element to fill. o.onParsed(parsed) fills form fields; o.onTitle({site,title}) is called if the optional fetch works.
  UI.autofill = function (host, o) {
    var id = 'af-' + OR.uid();
    host.innerHTML = '<div class="rz-af"><label class="field-label" for="' + id + '">Job posting or company link</label>' +
      '<div class="rz-af-row"><input class="input" id="' + id + '" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://boards.greenhouse.io/acme/jobs/123 or acme.com"><button type="button" class="btn" data-af="parse">Autofill from link</button></div>' +
      '<div class="rz-af-status" role="status" aria-live="polite"></div>' +
      '<details class="rz-af-more"><summary>Optional: try to fetch the page title</summary><p class="field-hint">This asks the website directly from your browser. Most sites refuse requests from other origins (and a page opened from a file has no origin at all), so it usually fails. If it does, nothing is lost: type the details in.</p><button type="button" class="btn btn-sm" data-af="fetch">Try to fetch page title</button></details>' +
      '<p class="field-hint">Autofill reads only the link itself, offline. It can name the company and guess the role from the link; it can’t see the page, so check what it filled in.</p></div>';
    var input = host.querySelector('input'), status = host.querySelector('.rz-af-status');
    function say(html, tone) { status.dataset.tone = tone || ''; status.innerHTML = html; }
    function parse() {
      var p = L.parseUrl(input.value);
      if (!p.ok) { say(OR.icon('warning', 'icon-sm') + '<span>That doesn’t look like a web link. Paste a full address such as https://jobs.lever.co/acme/… or just acme.com.</span>', 'warn'); return null; }
      var got = [], miss = [];
      [['name', 'company'], ['role', 'role'], ['careersUrl', 'careers page'], ['website', 'website']].forEach(function (k) { (p[k[0]] ? got : miss).push(k[1]); });
      say(OR.icon(got.length ? 'check' : 'info', 'icon-sm') + '<span>' + (got.length ? 'Filled: ' + esc(got.join(', ')) + '.' : 'Nothing could be read from the link.') + (miss.length ? ' Not in the link: ' + esc(miss.join(', ')) + '.' : '') + ' ' + esc(p.notes.join(' ')) + '</span>', got.length ? 'ok' : 'warn');
      o.onParsed(p);
      return p;
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-af]'); if (!b) return;
      if (b.dataset.af === 'parse') { parse(); return; }
      var p = L.parseUrl(input.value);
      if (!p.ok) { parse(); return; }
      b.disabled = true; b.dataset.busy = 'true';
      say('<span>Asking the site for its title… (gives up after 7 seconds)</span>');
      UI.fetchTitle(p.url).then(function (r) {
        say(OR.icon('check', 'icon-sm') + '<span>Page title: “' + esc(r.title || r.site) + '”. ' + (o.onTitle ? 'Used where a field was empty.' : '') + '</span>', 'ok');
        if (o.onTitle) o.onTitle(r);
      }, function (err) {
        var why = err && err.name === 'AbortError' ? 'It took longer than 7 seconds.' : (err && err.message && !/Failed to fetch|NetworkError|Load failed/i.test(err.message) ? err.message : 'The site blocked the request (cross-origin), or you are offline.');
        say(OR.icon('warning', 'icon-sm') + '<span>Couldn’t read the page. ' + esc(why) + ' This is normal; type the details in by hand. The link-based autofill above still worked.</span>', 'warn');
      }).then(function () { b.disabled = false; delete b.dataset.busy; });
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); parse(); } });
    return { input: input, parse: parse };
  };

  /* ---------- Resume data ---------- */
  var BLANK = function () { return { v: 1, contact: { name: '', email: '', phone: '', location: '', links: [] }, summary: '', eduFirst: true, education: [], experience: [], projects: [], skills: [], extras: [], jd: '' }; };
  function res() { var r = Object.assign(BLANK(), st().resume || {}); r.contact = Object.assign(BLANK().contact, r.contact || {}); return r; }
  function edit(fn) { OR.store.update(function (s) { var r = s.resume; if (!r.v) Object.assign(r, Object.assign(BLANK(), r)); if (!r.contact) r.contact = BLANK().contact; fn(r); }); }
  function isEmpty(r) { return !r.contact.name && !r.education.length && !r.experience.length && !r.projects.length && !r.skills.length && !r.extras.length; }

  var SECS = {
    education: { title: 'Education', one: 'school', fields: [['school', 'School', 'State University'], ['degree', 'Degree', 'B.S. Computer Science'], ['dates', 'Dates', 'Aug 2023 to May 2027'], ['location', 'Location', 'Austin, TX'], ['gpa', 'GPA (if 3.5 or higher)', '3.8/4.0']], bullets: 'Courses or honors (one per line)', blank: {} },
    experience: { title: 'Experience', one: 'role', fields: [['role', 'Role', 'Software Engineer Intern'], ['org', 'Company or lab', 'Acme Corp'], ['dates', 'Dates', 'Jun 2026 to Aug 2026'], ['location', 'Location', 'Remote']], bullets: 'Bullets (one per line)', blank: {} },
    projects: { title: 'Projects', one: 'name', fields: [['name', 'Project', 'Study-group scheduler'], ['tech', 'Tech', 'React, Node.js, PostgreSQL'], ['link', 'Link', 'github.com/you/project'], ['dates', 'Dates', 'Spring 2026']], bullets: 'Bullets (one per line)', blank: {} },
    skills: { title: 'Skills', one: 'label', fields: [['label', 'Group', 'Languages'], ['items', 'Skills (comma separated)', 'Python, Java, TypeScript, SQL']], blank: {} },
    extras: { title: 'Extras', one: 'title', fields: [['title', 'Heading', 'Hackathons'], ['text', 'Details', 'HackTX 2025, 2nd of 63 teams']], blank: {} }
  };

  var SAMPLE = {
    v: 1, contact: { name: 'Jordan Rivera', email: 'jordan.rivera@example.com', phone: '(555) 010-2030', location: 'Austin, TX', links: [{ url: 'https://github.com/jrivera-demo' }, { url: 'https://linkedin.com/in/jrivera-demo' }] },
    summary: '', eduFirst: true,
    education: [{ id: 'e1', school: 'State University of Texas', degree: 'B.S. Computer Science', dates: 'Aug 2023 to May 2027', location: 'Austin, TX', gpa: '3.7/4.0', bullets: 'Coursework: Data Structures, Algorithms, Operating Systems, Databases, Distributed Systems\nDean’s List, 4 semesters' }],
    experience: [
      { id: 'x1', role: 'Software Engineer Intern', org: 'Northwind Logistics', dates: 'Jun 2026 to Aug 2026', location: 'Remote', bullets: 'Cut dashboard load time from 4.2 s to 1.1 s by paginating the reports API and adding indexed PostgreSQL queries.\nRaised unit-test coverage of the billing module from 38% to 81% by writing 140 pytest cases, catching 3 rounding bugs before release.\nShipped a CSV export used by 25 support agents, replacing a 2-hour weekly manual process.' },
      { id: 'x2', role: 'Teaching Assistant, Data Structures', org: 'State University of Texas', dates: 'Jan 2026 to May 2026', location: 'Austin, TX', bullets: 'Tutored 60 students across 2 sections and wrote a Python autograder that cut grading from 10 hours to 1 per assignment.\nRan 8 weekly review sessions; section exam average rose 6 points over the previous term.' }
    ],
    projects: [
      { id: 'p1', name: 'Study-group scheduler', tech: 'React, Node.js, PostgreSQL', link: 'github.com/jrivera-demo/study-sched', dates: 'Spring 2026', bullets: 'Built a scheduler used by 40 classmates, with conflict detection that removed double-booked study rooms.\nDeployed with Docker and GitHub Actions CI, running 55 tests on every push.' },
      { id: 'p2', name: 'Raft key-value store', tech: 'Go', link: 'github.com/jrivera-demo/kv-raft', dates: 'Fall 2025', bullets: 'Implemented a replicated key-value store with Raft consensus; survived 100 randomized partition tests with no lost writes.' }
    ],
    skills: [{ id: 's1', label: 'Languages', items: 'Python, Java, Go, TypeScript, SQL, C++' }, { id: 's2', label: 'Tools', items: 'React, Node.js, PostgreSQL, Docker, Git, Linux, AWS' }],
    extras: [{ id: 'z1', title: 'Hackathons', text: 'HackTX 2025, 2nd of 63 teams (campus food-waste tracker)' }, { id: 'z2', title: 'Leadership', text: 'Programming club officer; grew membership from 12 to 55' }],
    jd: ''
  };
  function nid() { return OR.uid(); }

  /* ---------- Page frame ---------- */
  var tabHost = null, cleanups = [];
  function clean() { cleanups.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); cleanups = []; document.body.classList.remove('rz-printing'); }

  OR.views.resume = {
    title: function (ctx) { var t = (ctx && ctx.params && ctx.params.tab) || 'guide'; return 'Resume studio: ' + (TABS.filter(function (x) { return x[0] === t; })[0] || TABS[0])[1]; },
    render: function (main, ctx) {
      var tab = ctx.params.tab || 'guide', id = ctx.params.id || '';
      if (!TABS.some(function (x) { return x[0] === tab; })) { OR.views.notFound.render(main, ctx); return; }
      main.innerHTML = '<div class="page rz">' + '<div class="page-head rz-noprint"><div><h1 class="page-title display">Resume studio</h1>' +
        '<p class="page-lede">Write the one-page resume, keep a PDF and a cover letter for each company, and know which companies you are talking to. Everything stays on this computer.</p></div></div>' +
        '<nav class="rz-tabs rz-noprint" aria-label="Resume studio sections">' + TABS.map(function (t) {
          return '<a href="#/resume/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
        }).join('') + '</nav><div id="rz-body"></div></div>';
      tabHost = OR.$('#rz-body');
      var fn = { guide: guideTab, builder: builderTab, documents: id ? letterTab : documentsTab, companies: id ? companyTab : companiesTab }[tab];
      OR.setPlace({ title: 'Resume studio: ' + TABS.filter(function (x) { return x[0] === tab; })[0][1] });
      fn(tabHost, ctx, id);
      return clean;
    }
  };

  /* ---------- Guide ---------- */
  function guideTab(host) {
    var f = G.formula || { parts: [] };
    var cards = (G.examples || []).map(function (e, i) {
      var b = L.bulletHints(e.before), a = L.bulletHints(e.after);
      return '<article class="rz-ex"><div class="rz-ex-ctx"><span class="bib-tag">' + (i + 1) + '</span><span>' + esc(e.ctx) + '</span></div>' +
        '<div class="rz-ba"><div class="rz-before"><span class="rz-tag">Before</span><p>' + esc(e.before) + '</p><span class="rz-score" data-good="false">' + (b.hasNumber ? '' : 'no number · ') + (b.strongVerb ? 'verb ok' : 'weak start') + '</span></div>' +
        '<div class="rz-after"><span class="rz-tag">After</span><p>' + esc(e.after) + '</p><span class="rz-score" data-good="' + a.good + '">' + (a.hasNumber ? 'number · ' : '') + (a.strongVerb ? 'strong verb' : '') + '</span></div></div>' +
        '<p class="rz-why">' + esc(e.why) + '</p></article>';
    }).join('');
    function list(items, ordered) { return '<' + (ordered ? 'ol' : 'ul') + ' class="rz-list">' + items.map(function (t) { return '<li>' + OR.inline(t) + '</li>'; }).join('') + '</' + (ordered ? 'ol' : 'ul') + '>'; }
    host.innerHTML = '<div class="rz-guide">' +
      '<section class="section-tight"><h2 class="section-title">The impact bullet</h2><p class="rz-lede">' + esc(f.lead || '') + '</p>' +
      '<p class="rz-formula">' + esc(f.pattern || '') + '</p>' +
      '<dl class="rz-parts">' + f.parts.map(function (p) { return '<div><dt><span class="bib-tag">' + esc(p[0]) + '</span> ' + esc(p[1]) + '</dt><dd>' + esc(p[2]) + '</dd></div>'; }).join('') + '</dl>' +
      '<p class="muted">' + OR.inline(f.note || '') + '</p><p class="muted">' + OR.inline(f.noNumbers || '') + '</p></section>' +
      '<section class="section-tight"><h2 class="section-title">Before and after</h2><p class="rz-lede">Ten original examples from the kinds of experience a student or new grad really has. Rewrite yours the same way.</p><div class="rz-examples">' + cards + '</div></section>' +
      '<div class="rz-two"><section><h2 class="section-title">ATS rules</h2><p class="rz-lede">An applicant tracking system parses your file into fields before a person sees it.</p>' + list(G.ats || []) + '</section>' +
      '<section><h2 class="section-title">One-page template rules</h2><p class="rz-lede">The Builder’s preview follows these exactly.</p>' + list(G.onePage || []) + '</section></div>' +
      '<section class="section-tight"><h2 class="section-title">New-grad specifics</h2><div class="rz-newgrad">' + (G.newGrad || []).map(function (n) { return '<div><h3>' + esc(n.h) + '</h3><p>' + OR.inline(n.p) + '</p></div>'; }).join('') + '</div></section>' +
      '<section class="section-tight"><h2 class="section-title">Before you send it</h2><ul class="rz-check" id="rz-check">' + (G.checklist || []).map(function (t, i) {
        return '<li><label><input type="checkbox" data-i="' + i + '"' + (checked(i) ? ' checked' : '') + '><span>' + esc(t) + '</span></label></li>';
      }).join('') + '</ul><p class="field-hint">Your ticks are kept on this computer.</p></section>' +
      '<div class="btn-row"><a class="btn btn-primary" href="#/resume/builder">Open the builder</a><a class="btn" href="#/resume/documents">Store a PDF or cover letter</a></div></div>';
    host.addEventListener('change', function (e) {
      var c = e.target.closest('input[data-i]'); if (!c) return;
      edit(function (r) { var o = r.checks || (r.checks = {}); if (c.checked) o[c.dataset.i] = 1; else delete o[c.dataset.i]; });
    });
  }
  function checked(i) { var c = st().resume && st().resume.checks; return !!(c && c[i]); }

  /* ---------- Builder ---------- */
  function sheetHTML(r) {
    var c = r.contact, cl = L.contactLine(c);
    function row(a, b) { return (a || b) ? '<div class="rz-s-row"><span>' + a + '</span><span>' + b + '</span></div>' : ''; }
    function ul(t) { var b = L.bulletLines(t); return b.length ? '<ul>' + b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
    var h = '<header class="rz-s-head"><h2>' + (c.name ? esc(c.name) : '<span class="rz-ph">Your Name</span>') + '</h2>' +
      '<p>' + (cl.length ? cl.map(esc).join(' <span aria-hidden="true">|</span> ') : '<span class="rz-ph">email | phone | city | links</span>') + '</p></header>';
    if (r.summary) h += '<section><h3>Summary</h3><p>' + esc(r.summary) + '</p></section>';
    L.order(r).forEach(function (k) {
      var items = r[k] || []; if (!items.length) return;
      h += '<section><h3>' + (k === 'extras' ? 'Additional' : SECS[k].title) + '</h3>';
      items.forEach(function (e) {
        if (k === 'education') h += '<div class="rz-s-entry">' + row('<b>' + esc(e.school) + '</b>', esc(e.dates)) + row('<i>' + esc(e.degree) + '</i>', esc([e.location, e.gpa && 'GPA ' + e.gpa].filter(Boolean).join(' | '))) + ul(e.bullets) + '</div>';
        else if (k === 'experience') h += '<div class="rz-s-entry">' + row('<b>' + esc(e.role) + '</b>', esc(e.dates)) + row('<i>' + esc(e.org) + '</i>', esc(e.location)) + ul(e.bullets) + '</div>';
        else if (k === 'projects') h += '<div class="rz-s-entry">' + row('<b>' + esc(e.name) + '</b>' + (e.tech ? ' <span class="rz-tech">| ' + esc(e.tech) + '</span>' : ''), esc([e.link, e.dates].filter(Boolean).join(' | '))) + ul(e.bullets) + '</div>';
        else if (k === 'skills') h += '<p class="rz-s-line">' + (e.label ? '<b>' + esc(e.label) + ':</b> ' : '') + esc(e.items) + '</p>';
        else h += '<p class="rz-s-line">' + (e.title ? '<b>' + esc(e.title) + ':</b> ' : '') + esc(e.text) + '</p>';
      });
      h += '</section>';
    });
    return h;
  }
  function hintHTML(text) {
    var lines = L.bulletLines(text); if (!lines.length) return '';
    return '<ol class="rz-hints" aria-label="Bullet checks">' + lines.map(function (l, i) {
      var h = L.bulletHints(l);
      return '<li data-tone="' + (h.good ? 'ok' : 'warn') + '">' + OR.icon(h.good ? 'check' : 'warning', 'icon-sm') + '<span><b>' + (i + 1) + '.</b> ' + esc(h.hints.map(function (x) { return x.text; }).join(' ')) + '</span></li>';
    }).join('') + '</ol>';
  }
  function fld(id, label, val, o) {
    o = o || {};
    return '<div class="field' + (o.wide ? ' is-wide' : '') + '"><label class="field-label" for="' + id + '">' + esc(label) + '</label>' +
      (o.area ? '<textarea class="textarea" rows="' + (o.rows || 4) + '" id="' + id + '"' : '<input class="input" type="text" id="' + id + '"') +
      o.attrs + ' placeholder="' + esc(o.ph || '') + '"' + (o.area ? '>' + esc(val) + '</textarea>' : ' value="' + esc(val) + '">') + '</div>';
  }

  function builderTab(host) {
    host.innerHTML = '<div class="rz-builder"><div class="rz-form rz-noprint" id="rz-form"></div><div class="rz-side">' +
      '<div class="rz-bar rz-noprint"><button class="btn btn-primary" data-rs="print">' + OR.icon('download', 'icon-sm') + 'Print / Save as PDF</button>' +
      '<button class="btn" data-rs="copy">' + OR.icon('copy', 'icon-sm') + 'Copy text</button><button class="btn" data-rs="txt">Download .txt</button></div>' +
      '<div class="rz-fit rz-noprint" id="rz-fit" role="status"></div>' +
      '<div class="rz-paper-scroll"><div class="rz-paper" id="rz-paper"><div class="rz-sheet" id="rz-sheet"></div></div></div>' +
      '<p class="field-hint rz-noprint">US Letter, one column, real text. In the print dialog choose “Save as PDF” and turn off “Headers and footers”.</p></div></div>';
    var form = OR.$('#rz-form'), sheet = OR.$('#rz-sheet'), paper = OR.$('#rz-paper'), over = false;

    function fit() {
      var need = paper.offsetWidth * 11 / 8.5, h = sheet.offsetHeight;
      over = h > need + 1;
      var fitEl = OR.$('#rz-fit'); if (!fitEl) return;
      var lines = Math.ceil((h - need) / (paper.offsetWidth * 0.0245));
      fitEl.dataset.tone = over ? 'warn' : 'ok';
      fitEl.innerHTML = over ? OR.icon('warning', 'icon-sm') + '<span>Runs past one page by about ' + OR.plural(lines, 'line') + '. Cut the weakest bullet before you shrink anything.</span>'
        : OR.icon('check', 'icon-sm') + '<span>Fits on one page (' + Math.max(0, Math.round(100 * h / need)) + '% of the page used).</span>';
    }
    function draw() { sheet.innerHTML = sheetHTML(res()); fit(); }
    function kw() {
      var r = res(), box = OR.$('#rz-kw-out'); if (!box) return;
      if (!r.jd.trim()) { box.innerHTML = '<p class="muted">Paste a job description to see which of its skills your resume doesn’t mention yet.</p>'; return; }
      var m = L.keywordMatch(r.jd, L.resumeToText(r));
      if (!m.total) { box.innerHTML = '<p class="muted">No skill terms from the built-in list were found in that text. The list covers about 100 common tech skills, so a role about something else won’t match.</p>'; return; }
      var chip = function (x, tone) { return '<li><span class="chip rz-chip" data-tone="' + tone + '">' + esc(x.term) + (x.count > 1 ? ' <span class="faint">×' + x.count + '</span>' : '') + '</span></li>'; };
      box.innerHTML = '<p class="rz-kw-pct"><span class="bib">' + m.pct + '%</span> of the ' + m.total + ' skill terms in this posting appear on your resume.</p>' +
        (m.missing.length ? '<h4>Missing</h4><ul class="rz-chips">' + m.missing.map(function (x) { return chip(x, 'miss'); }).join('') + '</ul><p class="field-hint">Add one only where it is true: in Skills, or in a bullet that shows you used it.</p>' : '<p class="muted">Nothing missing from the terms we can detect.</p>') +
        (m.found.length ? '<h4>Already there</h4><ul class="rz-chips">' + m.found.map(function (x) { return chip(x, 'ok'); }).join('') + '</ul>' : '');
    }
    var kwSoon = OR.debounce(kw, 200);

    function drawForm() {
      var r = res(), c = r.contact, h = '';
      h += '<section class="rz-sec"><h2>Contact</h2><div class="rz-grid">' +
        fld('f-c-name', 'Full name', c.name, { attrs: ' data-sec="contact" data-f="name" autocomplete="name"', ph: 'Jordan Rivera' }) +
        fld('f-c-email', 'Email', c.email, { attrs: ' data-sec="contact" data-f="email" autocomplete="email"', ph: 'you@example.com' }) +
        fld('f-c-phone', 'Phone', c.phone, { attrs: ' data-sec="contact" data-f="phone" autocomplete="tel"', ph: '(555) 010-2030' }) +
        fld('f-c-loc', 'City, State', c.location, { attrs: ' data-sec="contact" data-f="location"', ph: 'Austin, TX' }) +
        fld('f-c-links', 'Links, one per line (GitHub, LinkedIn, portfolio)', (c.links || []).map(function (l) { return l.url; }).join('\n'), { area: 1, rows: 3, wide: 1, attrs: ' data-sec="contact" data-f="links"', ph: 'github.com/you' }) + '</div>' +
        '<label class="rz-check-one"><input type="checkbox" data-sec="root" data-f="eduFirst"' + (r.eduFirst !== false ? ' checked' : '') + '> Education first (right for students and new grads)</label></section>';
      L.order(r).forEach(function (k) {
        var S = SECS[k], items = r[k];
        h += '<section class="rz-sec" aria-labelledby="h-' + k + '"><div class="row-between"><h2 id="h-' + k + '">' + S.title + '</h2><button class="btn btn-sm" data-rs="add" data-sec="' + k + '">' + OR.icon('plus', 'icon-sm') + 'Add</button></div>';
        if (!items.length) h += '<p class="muted">Nothing here yet.</p>';
        items.forEach(function (e, i) {
          var pre = 'f-' + k + '-' + i + '-';
          h += '<fieldset class="rz-entry"><legend class="sr-only">' + esc(S.title) + ' entry ' + (i + 1) + '</legend><div class="rz-entry-bar"><span class="rz-entry-title">' + esc(e[S.one] || S.title + ' ' + (i + 1)) + '</span><span class="rz-entry-btns">' +
            '<button class="icon-btn" type="button" data-rs="mv" data-sec="' + k + '" data-i="' + i + '" data-dir="-1" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '><svg class="icon icon-sm" aria-hidden="true" style="transform:rotate(-90deg)"><use href="#i-chevron-right"/></svg></button>' +
            '<button class="icon-btn" type="button" data-rs="mv" data-sec="' + k + '" data-i="' + i + '" data-dir="1" aria-label="Move down"' + (i === items.length - 1 ? ' disabled' : '') + '><svg class="icon icon-sm" aria-hidden="true" style="transform:rotate(90deg)"><use href="#i-chevron-right"/></svg></button>' +
            '<button class="icon-btn" type="button" data-rs="del" data-sec="' + k + '" data-i="' + i + '" aria-label="Remove entry">' + OR.icon('trash', 'icon-sm') + '</button></span></div><div class="rz-grid">';
          S.fields.forEach(function (f) { h += fld(pre + f[0], f[1], e[f[0]] || '', { attrs: ' data-sec="' + k + '" data-i="' + i + '" data-f="' + f[0] + '"', ph: f[2], wide: f[0] === 'items' || f[0] === 'text' }); });
          if (S.bullets) h += fld(pre + 'bullets', S.bullets, e.bullets || '', { area: 1, rows: 5, wide: 1, attrs: ' data-sec="' + k + '" data-i="' + i + '" data-f="bullets"' + (k === 'education' ? '' : ' aria-describedby="' + pre + 'hints"'), ph: k === 'education' ? 'Coursework: Data Structures, Algorithms' : 'Built … as measured by … by …' }) +
            (k === 'education' ? '' : '<div id="' + pre + 'hints" class="is-wide">' + hintHTML(e.bullets) + '</div>');
          h += '</div></fieldset>';
        });
        h += '</section>';
      });
      h += '<section class="rz-sec"><h2 id="h-kw">Keyword matcher</h2><p class="muted">Paste a job description. We check it against about 100 common tech skills and show which ones your resume doesn’t mention.</p>' +
        fld('rz-jd', 'Job description', r.jd, { area: 1, rows: 6, attrs: ' data-sec="root" data-f="jd"', ph: 'Paste the posting here' }) + '<div id="rz-kw-out" class="rz-kw-out" aria-live="polite"></div></section>' +
        '<section class="rz-sec"><div class="btn-row"><button class="btn" data-rs="sample">Fill with a sample</button><button class="btn btn-danger" data-rs="clear">Clear resume</button></div></section>';
      form.innerHTML = h; kw();
    }

    function setField(el) {
      var sec = el.dataset.sec, f = el.dataset.f, v = el.type === 'checkbox' ? el.checked : el.value;
      edit(function (r) {
        if (sec === 'contact') { if (f === 'links') r.contact.links = String(v).split('\n').map(function (x) { return x.trim(); }).filter(Boolean).map(function (u) { return { url: u }; }); else r.contact[f] = v; }
        else if (sec === 'root') r[f] = v;
        else { var e = r[sec][+el.dataset.i]; if (e) e[f] = v; }
      });
    }
    form.addEventListener('input', function (e) {
      var el = e.target; if (!el.dataset.f) return;
      setField(el);
      if (el.dataset.f === 'bullets' && el.dataset.sec !== 'education') { var hx = OR.$('#' + el.id.replace(/bullets$/, 'hints')); if (hx) hx.innerHTML = hintHTML(el.value); }
      if (el.dataset.f !== 'jd') draw();
      kwSoon();
      var tt = el.closest('.rz-entry') && el.closest('.rz-entry').querySelector('.rz-entry-title');
      if (tt && SECS[el.dataset.sec] && el.dataset.f === SECS[el.dataset.sec].one) tt.textContent = el.value || SECS[el.dataset.sec].title;
    });
    form.addEventListener('change', function (e) { if (e.target.type === 'checkbox' && e.target.dataset.f === 'eduFirst') { setField(e.target); drawForm(); draw(); } });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rs]'); if (!b) return;
      var act = b.dataset.rs, k = b.dataset.sec, i = +b.dataset.i;
      if (act === 'add') {
        var n = (res()[k] || []).length;
        edit(function (r) { r[k].push(Object.assign({ id: nid() }, SECS[k].blank)); });
        drawForm(); draw();
        var first = OR.$('#f-' + k + '-' + n + '-' + SECS[k].fields[0][0]); if (first) first.focus();
      } else if (act === 'del') {
        var gone = res()[k][i];
        edit(function (r) { r[k].splice(i, 1); });
        drawForm(); draw();
        OR.toast('Entry removed.', { action: { label: 'Undo', run: function () { edit(function (r) { r[k].splice(i, 0, gone); }); drawForm(); draw(); } } });
      } else if (act === 'mv') {
        var d = +b.dataset.dir;
        edit(function (r) { var a = r[k], t = a[i]; a[i] = a[i + d]; a[i + d] = t; });
        drawForm(); draw();
        var nb = OR.$('[data-rs="mv"][data-sec="' + k + '"][data-i="' + (i + d) + '"][data-dir="' + d + '"]') || OR.$('[data-rs="mv"][data-sec="' + k + '"][data-i="' + (i + d) + '"]');
        if (nb) nb.focus();
        OR.announce('Moved ' + (d < 0 ? 'up' : 'down'));
      } else if (act === 'print') doPrint();
      else if (act === 'copy') {
        var text = L.resumeToText(res());
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { OR.toast('Copied as plain text.', { tone: 'ok' }); }, function () { OR.toast('Copy was blocked. Use Download .txt instead.', { tone: 'error' }); });
      } else if (act === 'txt') OR.download(L.resumeToText(res()), ((res().contact.name || 'resume').replace(/\s+/g, '-') + '-Resume.txt'), 'text/plain');
      else if (act === 'sample') {
        (isEmpty(res()) ? Promise.resolve(true) : OR.confirm({ title: 'Replace your resume with the sample?', body: 'Your current entries will be overwritten. Undo is not available.', ok: 'Replace' })).then(function (ok) {
          if (!ok) return;
          edit(function (r) { var s = JSON.parse(JSON.stringify(SAMPLE)); Object.keys(s).forEach(function (x) { r[x] = s[x]; }); });
          drawForm(); draw();
        });
      } else if (act === 'clear') {
        OR.confirm({ title: 'Clear the whole resume?', body: 'This removes every entry. Export a backup first if you might want it.', ok: 'Clear', danger: true }).then(function (ok) {
          if (!ok) return; edit(function (r) { var s = BLANK(); Object.keys(s).forEach(function (x) { r[x] = s[x]; }); r.checks = r.checks; }); drawForm(); draw();
        });
      }
    });
    function doPrint() {
      function go() {
        var prev = document.title, r = res();
        document.title = (r.contact.name || 'Resume').replace(/\s+/g, '-') + '-Resume';
        document.body.classList.add('rz-printing');
        var back = function () { document.title = prev; document.body.classList.remove('rz-printing'); removeEventListener('afterprint', back); };
        addEventListener('afterprint', back);
        window.print();
      }
      if (!over) { go(); return; }
      OR.confirm({ title: 'This runs past one page', body: 'The printout is cut off at one page, so the last lines will be lost. Trim the resume first, or print anyway.', ok: 'Print anyway' }).then(function (ok) { if (ok) go(); });
    }
    drawForm(); draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) { ro.observe(paper); cleanups.push(function () { ro.disconnect(); }); }
  }

  /* ---------- Documents: PDFs per company (IndexedDB) and cover letters (store) ---------- */
  var KIND_LABEL = { resume: 'Resume', 'cover-letter': 'Cover letter', other: 'Other' };
  function kindOptions(sel) { return KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === sel ? ' selected' : '') + '>' + k[1] + '</option>'; }).join(''); }
  UI.listDocs = function () { return OR.docs.list().then(function (l) { return { ok: true, list: l.map(function (d) { return d; }) }; }, function (e) { return { ok: false, err: (e && e.message) || 'unknown error', list: [] }; }); };
  function wordCount(t) { var m = String(t || '').trim().match(/\S+/g); return m ? m.length : 0; }

  function documentsTab(host) {
    var docs = [], avail = true, err = '';
    host.innerHTML = '<div class="rz-docs"><div id="rz-d-banner"></div><div id="rz-d-body"><p class="muted">Loading stored documents…</p></div></div>';
    function reload() {
      return UI.listDocs().then(function (r) { docs = r.list; avail = r.ok; err = r.err; draw(); });
    }
    function draw() {
      var body = OR.$('#rz-d-body'); if (!body) return;
      var total = docs.reduce(function (t, d) { return t + (d.size || 0); }, 0);
      var letters = st().coverLetters.slice().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
      OR.$('#rz-d-banner').innerHTML = avail ? '' : '<div class="banner" data-tone="warn">' + OR.icon('warning') + '<div><strong>PDF storage isn’t available in this browser window.</strong> ' + esc(err) + ' This usually means private or incognito mode, or storage blocked in the browser’s settings. Cover letters below still work, because they are saved with your other progress. To keep PDFs, open Offer Ready in a normal window.</div></div>';
      var groups = {}, order = [];
      docs.forEach(function (d) { var k = UI.company(d.companyId) ? d.companyId : ''; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(d); });
      order.sort(function (a, b) { return !a ? 1 : !b ? -1 : UI.companyName(a).localeCompare(UI.companyName(b)); });
      var files = order.map(function (k) {
        return '<section class="rz-group"><h3>' + (k ? UI.avatar(UI.companyName(k), 'is-sm') + '<a href="#/resume/companies/' + esc(k) + '">' + esc(UI.companyName(k)) + '</a>' : 'Not linked to a company') + '</h3><ul class="rz-docs-list">' +
          groups[k].sort(function (a, b) { return b.addedAt - a.addedAt; }).map(function (d) {
            return '<li class="rz-doc">' + OR.icon('file') + '<div class="rz-doc-main"><strong>' + esc(d.name) + '</strong><div class="rz-doc-meta"><span class="chip">' + esc(KIND_LABEL[d.kind] || 'Other') + '</span><span class="num">' + UI.fmtSize(d.size || 0) + '</span><span>' + esc(OR.fmtDate(OR.dateStr(new Date(d.addedAt)))) + '</span></div>' + (d.note ? '<p class="rz-doc-note">' + esc(d.note) + '</p>' : '') + '</div>' +
              '<div class="rz-doc-btns"><button class="btn btn-sm" data-d="dl" data-id="' + esc(d.id) + '">' + OR.icon('download', 'icon-sm') + 'Download</button><button class="btn btn-sm" data-d="edit" data-id="' + esc(d.id) + '">' + OR.icon('edit', 'icon-sm') + 'Edit</button><button class="btn btn-sm btn-danger" data-d="del" data-id="' + esc(d.id) + '">' + OR.icon('trash', 'icon-sm') + 'Delete</button></div></li>';
          }).join('') + '</ul></section>';
      }).join('');
      var lg = {}, lo = [];
      letters.forEach(function (l) { var k = UI.company(l.companyId) ? l.companyId : ''; if (!lg[k]) { lg[k] = []; lo.push(k); } lg[k].push(l); });
      lo.sort(function (a, b) { return !a ? 1 : !b ? -1 : UI.companyName(a).localeCompare(UI.companyName(b)); });
      body.innerHTML =
        '<section class="rz-sec"><h2 class="section-title">Reminder</h2><div class="banner" data-tone="' + (st().settings.lastExport ? '' : 'warn') + '">' + OR.icon('info') + '<div>Stored files live only in this browser on this computer. Clearing site data deletes them. <strong>Export a backup</strong> and it includes every document (' + OR.plural(docs.length, 'file') + ', ' + UI.fmtSize(total) + '). ' +
        (st().settings.lastExport ? 'Last export: ' + esc(new Date(st().settings.lastExport).toLocaleDateString()) + '.' : 'You haven’t exported yet.') + '</div><button class="btn btn-sm" data-act="export">Export backup</button></div></section>' +
        '<section class="rz-sec"><h2 class="section-title">Upload a PDF</h2><form id="rz-up" class="rz-up" novalidate' + (avail ? '' : ' aria-disabled="true"') + '>' +
        '<div class="field"><label class="field-label" for="up-file">PDF file (up to 5 MB each)</label><input class="input" type="file" id="up-file" accept="application/pdf,.pdf" multiple' + (avail ? '' : ' disabled') + '></div>' +
        '<div class="field"><label class="field-label" for="up-co">Company</label><select class="select" id="up-co"' + (avail ? '' : ' disabled') + '>' + UI.companyOptions(OR.$('#up-co') ? OR.$('#up-co').value : '', 'No company yet') + '</select></div>' +
        '<div class="field"><label class="field-label" for="up-kind">Kind</label><select class="select" id="up-kind"' + (avail ? '' : ' disabled') + '>' + kindOptions('resume') + '</select></div>' +
        '<div class="field is-wide"><label class="field-label" for="up-note">Note (optional)</label><input class="input" id="up-note" type="text" placeholder="Tailored for the backend role"' + (avail ? '' : ' disabled') + '></div>' +
        '<div class="btn-row is-wide"><button class="btn btn-primary" type="submit"' + (avail ? '' : ' disabled') + '>' + OR.icon('upload', 'icon-sm') + 'Add to storage</button><a class="btn btn-ghost" href="#/resume/companies">Add a company first</a></div></form>' +
        '<p class="field-hint" id="rz-storage">' + OR.plural(docs.length, 'file') + ' stored, ' + UI.fmtSize(total) + ' of PDFs.</p></section>' +
        '<section class="rz-sec"><h2 class="section-title">Stored files</h2>' + (files || '<p class="muted">' + (avail ? 'No files yet. Upload your resume PDF, then one per company when you tailor it.' : 'Nothing can be listed while storage is unavailable.') + '</p>') + '</section>' +
        '<section class="rz-sec"><div class="row-between"><h2 class="section-title">Cover letters</h2><button class="btn btn-primary" data-d="newletter">' + OR.icon('plus', 'icon-sm') + 'New cover letter</button></div>' +
        (lo.map(function (k) {
          return '<section class="rz-group"><h3>' + (k ? UI.avatar(UI.companyName(k), 'is-sm') + esc(UI.companyName(k)) : 'Not linked to a company') + '</h3><ul class="rz-docs-list">' + lg[k].map(function (l) {
            return '<li class="rz-doc">' + OR.icon('edit') + '<div class="rz-doc-main"><a href="#/resume/documents/' + esc(l.id) + '"><strong>' + esc(l.title || 'Untitled letter') + '</strong></a><div class="rz-doc-meta">' + (l.role ? '<span>' + esc(l.role) + '</span>' : '') + '<span class="num">' + OR.plural(wordCount(l.body), 'word') + '</span><span>edited ' + esc(OR.ago(l.updated)) + '</span></div></div><div class="rz-doc-btns"><a class="btn btn-sm" href="#/resume/documents/' + esc(l.id) + '">Open</a></div></li>';
          }).join('') + '</ul></section>';
        }).join('') || '<p class="muted">None yet. Pick a template and fill in the brackets.</p>') + '</section>';
      if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(function (e) {
        var el = OR.$('#rz-storage'); if (el && e && e.quota) el.textContent += ' The browser reports ' + UI.fmtSize(e.usage || 0) + ' used of about ' + UI.fmtSize(e.quota) + ' available to this site (all data, not only PDFs).';
      }, function () {});
    }
    function problem(f) {
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') return 'is not a PDF. Only PDF files can be stored.';
      if (!f.size) return 'is empty.';
      if (f.size > MAX_BYTES) return 'is ' + UI.fmtSize(f.size) + ', over the 5 MB limit. Compress it or export a smaller PDF.';
      return '';
    }
    host.addEventListener('submit', function (e) {
      if (e.target.id !== 'rz-up') return;
      e.preventDefault();
      var inp = OR.$('#up-file'), files = Array.prototype.slice.call(inp.files || []);
      if (!files.length) { OR.toast('Choose a PDF first.', { tone: 'error' }); inp.focus(); return; }
      var co = OR.$('#up-co').value, kind = OR.$('#up-kind').value, note = OR.$('#up-note').value.trim();
      (async function () {
        var added = 0;
        for (var i = 0; i < files.length; i++) {
          var f = files[i], bad = problem(f);
          if (!bad) { try { if ((await f.slice(0, 5).text()) !== '%PDF-') bad = 'doesn’t look like a real PDF (the file header is missing).'; } catch (x) { bad = 'could not be read.'; } }
          if (bad) { OR.toast('“' + f.name + '” ' + bad, { tone: 'error', timeout: 6000 }); continue; }
          try { await OR.docs.put({ id: 'd_' + OR.uid(), companyId: co, kind: kind, name: f.name, size: f.size, type: 'application/pdf', addedAt: Date.now(), note: note, blob: f }); added++; }
          catch (x) { OR.toast('Couldn’t store “' + f.name + '”: ' + ((x && x.message) || 'storage error') + (/quota|full/i.test((x && (x.name + x.message)) || '') ? ' The browser’s storage is full.' : ''), { tone: 'error', timeout: 7000 }); }
        }
        if (added) OR.toast(OR.plural(added, 'file') + ' stored.', { tone: 'ok' });
        await reload();
      })();
    });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      var d = docs.filter(function (x) { return x.id === b.dataset.id; })[0], a = b.dataset.d;
      if (a === 'dl' && d) { OR.download(d.blob, /\.pdf$/i.test(d.name) ? d.name : d.name + '.pdf'); }
      else if (a === 'del' && d) OR.confirm({ title: 'Delete “' + d.name + '”?', body: 'The file is removed from this browser. A backup you exported earlier still has it.', ok: 'Delete', danger: true }).then(function (ok) {
        if (ok) OR.docs.remove(d.id).then(function () { OR.toast('Deleted.', { tone: 'ok' }); return reload(); }, function (x) { OR.toast('Couldn’t delete: ' + x.message, { tone: 'error' }); });
      });
      else if (a === 'edit' && d) UI.form({ title: 'Edit document', html: '<div class="field"><label class="field-label" for="ed-name">Name</label><input class="input" id="ed-name" name="name" required autofocus value="' + esc(d.name) + '"></div>' +
        '<div class="field"><label class="field-label" for="ed-co">Company</label><select class="select" id="ed-co" name="co">' + UI.companyOptions(d.companyId, 'No company') + '</select></div>' +
        '<div class="field"><label class="field-label" for="ed-kind">Kind</label><select class="select" id="ed-kind" name="kind">' + kindOptions(d.kind) + '</select></div>' +
        '<div class="field"><label class="field-label" for="ed-note">Note</label><input class="input" id="ed-note" name="note" value="' + esc(d.note || '') + '"></div>' }).then(function (f) {
        if (!f) return;
        var rec = Object.assign({}, d, { name: f.elements.name.value.trim() || d.name, companyId: f.elements.co.value, kind: f.elements.kind.value, note: f.elements.note.value.trim() });
        OR.docs.put(rec).then(reload, function (x) { OR.toast('Couldn’t save: ' + x.message, { tone: 'error' }); });
      });
      else if (a === 'newletter') newLetter();
    });
    reload();
  }

  /* ---------- Cover letters ---------- */
  function fillTokens(body, l) {
    var r = res(), c = r.contact, ed = r.education[0] || {}, co = UI.company(l.companyId);
    var map = { Company: co && co.name, Role: l.role, 'Your name': c.name, Email: c.email, Phone: c.phone, School: ed.school, Degree: ed.degree, Graduation: ed.dates && ed.dates.split(/\s+to\s+/i).pop(), Links: (c.links || []).map(function (x) { return x.url; }).join(' | ') };
    return body.replace(/\[([^\]\n]{2,40})\]/g, function (m, k) { return map[k] ? map[k] : m; });
  }
  function newLetter() {
    var T = OR.coverTemplates || [];
    UI.form({ title: 'New cover letter', ok: 'Create', html: '<div class="field"><label class="field-label" for="nl-co">Company</label><select class="select" id="nl-co" name="co" autofocus>' + UI.companyOptions('', 'No company yet') + '</select></div>' +
      '<div class="field"><label class="field-label" for="nl-role">Role</label><input class="input" id="nl-role" name="role" placeholder="Software Engineer, New Grad"></div>' +
      '<div class="field"><label class="field-label" for="nl-t">Start from</label><select class="select" id="nl-t" name="t"><option value="">Blank page</option>' + T.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select></div>' }).then(function (f) {
      if (!f) return;
      var l = { id: 'l_' + OR.uid(), companyId: f.elements.co.value, role: f.elements.role.value.trim(), title: '', body: '', created: Date.now(), updated: Date.now() };
      var t = T.filter(function (x) { return x.id === f.elements.t.value; })[0];
      l.title = (UI.companyName(l.companyId) || 'Cover letter') + (l.role ? ': ' + l.role : '');
      if (t) l.body = fillTokens(t.body, l);
      OR.store.update(function (s) { s.coverLetters.push(l); });
      OR.go('#/resume/documents/' + l.id);
    });
  }
  function letterTab(host, ctx, id) {
    var l = st().coverLetters.filter(function (x) { return x.id === id; })[0];
    if (!l) { host.innerHTML = '<div class="empty"><h2 class="empty-title">That cover letter isn’t here</h2><p>It may have been deleted.</p><a class="btn" href="#/resume/documents">Back to documents</a></div>'; return; }
    var T = OR.coverTemplates || [];
    host.innerHTML = '<div class="rz-letter"><p><a href="#/resume/documents">' + OR.icon('chevron-left', 'icon-sm') + 'All documents</a></p>' +
      '<div class="rz-grid"><div class="field"><label class="field-label" for="lt-title">Title</label><input class="input" id="lt-title" data-f="title" value="' + esc(l.title) + '"></div>' +
      '<div class="field"><label class="field-label" for="lt-co">Company</label><select class="select" id="lt-co" data-f="companyId">' + UI.companyOptions(l.companyId, 'No company') + '</select></div>' +
      '<div class="field"><label class="field-label" for="lt-role">Role</label><input class="input" id="lt-role" data-f="role" value="' + esc(l.role || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="lt-t">Template</label><div class="rz-inline"><select class="select" id="lt-t"><option value="">Choose a template</option>' + T.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select><button class="btn" data-l="apply">Use</button></div></div></div>' +
      '<div class="field"><label class="field-label" for="lt-body">Letter</label><textarea class="textarea rz-letter-body" id="lt-body" data-f="body" rows="18" spellcheck="true">' + esc(l.body) + '</textarea>' +
      '<div class="rz-letter-meta" id="lt-meta" role="status"></div></div>' +
      '<p class="field-hint">Words in [brackets] are placeholders. Company, role and your details fill in automatically from your records when you pick a template; replace the rest.</p>' +
      '<div class="btn-row"><button class="btn" data-l="copy">' + OR.icon('copy', 'icon-sm') + 'Copy</button><button class="btn" data-l="txt">Download .txt</button><button class="btn btn-danger" data-l="del">' + OR.icon('trash', 'icon-sm') + 'Delete letter</button></div></div>';
    function meta() {
      var b = OR.$('#lt-body').value, open = (b.match(/\[[^\]\n]{2,60}\]/g) || []).length;
      OR.$('#lt-meta').innerHTML = '<span class="num">' + OR.plural(wordCount(b), 'word') + '</span> <span class="faint">(aim for 250 to 350)</span> · ' + (open ? '<span class="rz-open">' + OR.plural(open, 'placeholder') + ' still to fill</span>' : '<span class="rz-done">no placeholders left</span>');
    }
    meta();
    host.addEventListener('input', function (e) {
      var f = e.target.dataset && e.target.dataset.f; if (!f) return;
      OR.store.update(function (s) { var x = s.coverLetters.filter(function (q) { return q.id === id; })[0]; if (x) { x[f] = e.target.value; x.updated = Date.now(); } });
      if (f === 'body') meta();
    });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-l]'); if (!b) return;
      var cur = st().coverLetters.filter(function (q) { return q.id === id; })[0], body = OR.$('#lt-body'), a = b.dataset.l;
      if (a === 'apply') {
        var t = T.filter(function (x) { return x.id === OR.$('#lt-t').value; })[0];
        if (!t) { OR.toast('Choose a template first.', { tone: 'error' }); return; }
        var go = function () { body.value = fillTokens(t.body, cur); body.dispatchEvent(new Event('input', { bubbles: true })); body.focus(); };
        if (body.value.trim()) OR.confirm({ title: 'Replace the letter with this template?', body: 'What you’ve written in the box will be overwritten.', ok: 'Replace' }).then(function (ok) { if (ok) go(); }); else go();
      } else if (a === 'copy') (navigator.clipboard ? navigator.clipboard.writeText(body.value) : Promise.reject()).then(function () { OR.toast('Copied.', { tone: 'ok' }); }, function () { OR.toast('Copy was blocked. Use Download .txt.', { tone: 'error' }); });
      else if (a === 'txt') OR.download(body.value, (cur.title || 'cover-letter').replace(/[^\w.-]+/g, '-') + '.txt', 'text/plain');
      else if (a === 'del') OR.confirm({ title: 'Delete this cover letter?', body: 'It can’t be undone. Copy the text first if you want to keep it.', ok: 'Delete', danger: true }).then(function (ok) {
        if (!ok) return; OR.store.update(function (s) { s.coverLetters = s.coverLetters.filter(function (q) { return q.id !== id; }); }); OR.go('#/resume/documents');
      });
    });
  }

  /* ---------- Companies ---------- */
  function tierOptions(sel) { return TIERS.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === (sel || '') ? ' selected' : '') + '>' + t[1] + '</option>'; }).join(''); }
  function companyFields(c, p) {
    c = c || {};
    return '<div class="rz-grid">' +
      '<div class="field"><label class="field-label" for="' + p + 'name">Company name</label><input class="input" id="' + p + 'name" name="name" required value="' + esc(c.name || '') + '" autocomplete="off"></div>' +
      '<div class="field"><label class="field-label" for="' + p + 'tier">Tier</label><select class="select" id="' + p + 'tier" name="tier">' + tierOptions(c.tier) + '</select></div>' +
      '<div class="field"><label class="field-label" for="' + p + 'web">Website</label><input class="input" id="' + p + 'web" name="website" inputmode="url" placeholder="https://acme.com" value="' + esc(c.website || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="' + p + 'car">Careers or job-board link</label><input class="input" id="' + p + 'car" name="careersUrl" inputmode="url" placeholder="https://boards.greenhouse.io/acme" value="' + esc(c.careersUrl || '') + '"></div>' +
      '<div class="field is-wide"><label class="field-label" for="' + p + 'tags">Tags (comma separated)</label><input class="input" id="' + p + 'tags" name="tags" placeholder="fintech, remote, referral-possible" value="' + esc((c.tags || []).join(', ')) + '"></div>' +
      '<div class="field is-wide"><label class="field-label" for="' + p + 'notes">Notes</label><textarea class="textarea" id="' + p + 'notes" name="notes" rows="3" placeholder="Why this company, who you know, what they build">' + esc(c.notes || '') + '</textarea></div></div>';
  }
  function readCompany(f) {
    var g = function (k) { return f.elements[k].value.trim(); };
    return { name: g('name'), tier: g('tier'), website: UI.safeUrl(g('website')) || (g('website') ? 'https://' + g('website').replace(/^\/+/, '') : ''), careersUrl: UI.safeUrl(g('careersUrl')) || (g('careersUrl') ? 'https://' + g('careersUrl').replace(/^\/+/, '') : ''), notes: g('notes'),
      tags: g('tags').split(',').map(function (t) { return t.trim(); }).filter(Boolean).filter(function (t, i, a) { return a.indexOf(t) === i; }) };
  }
  function bindAutofill(afHost, form) {
    function set(k, v) { var el = form.elements[k]; if (el && v) el.value = v; }
    UI.autofill(afHost, {
      onParsed: function (p) { set('name', p.name); set('website', p.website); set('careersUrl', p.careersUrl); },
      onTitle: function (r) { if (!form.elements.name.value) form.elements.name.value = (r.site || r.title.split(/[|\-–—:]/).pop() || r.title).trim(); }
    });
  }
  var coFilter = { q: '', tier: '' };
  function companiesTab(host) {
    host.innerHTML = '<div class="rz-cos"><section class="rz-sec"><h2 class="section-title">Add a company</h2><div id="rz-af"></div>' +
      '<form id="rz-co-form" class="stack-4" novalidate>' + companyFields(null, 'nc-') + '<div class="btn-row"><button class="btn btn-primary" type="submit">' + OR.icon('plus', 'icon-sm') + 'Add company</button></div></form></section>' +
      '<section class="rz-sec"><div class="row-between"><h2 class="section-title">Your companies</h2><div class="rz-filter"><label class="sr-only" for="co-q">Search companies</label><input class="input" id="co-q" type="search" placeholder="Search name or tag" value="' + esc(coFilter.q) + '"><label class="sr-only" for="co-tier">Tier</label><select class="select select-sm" id="co-tier"><option value="">All tiers</option>' + TIERS.slice(1).map(function (t) { return '<option value="' + t[0] + '"' + (coFilter.tier === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></div></div><div id="rz-co-list"></div></section></div>';
    var form = OR.$('#rz-co-form');
    bindAutofill(OR.$('#rz-af'), form);
    function list() {
      var q = coFilter.q.toLowerCase(), apps = st().pipeline;
      var items = st().companies.filter(function (c) { return (!coFilter.tier || c.tier === coFilter.tier) && (!q || (c.name + ' ' + (c.tags || []).join(' ')).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      OR.$('#rz-co-list').innerHTML = items.length ? '<ul class="rz-co-list">' + items.map(function (c) {
        var n = apps.filter(function (a) { return a.companyId === c.id; }).length;
        return '<li class="rz-co">' + UI.avatar(c.name) + '<div class="rz-co-main"><a href="#/resume/companies/' + esc(c.id) + '"><strong>' + esc(c.name) + '</strong></a><div class="rz-doc-meta">' + (c.tier ? '<span class="chip rz-tier" data-tier="' + c.tier + '">' + esc(TIERS.filter(function (t) { return t[0] === c.tier; })[0][1]) + '</span>' : '') +
          (n ? '<a href="#/pipeline">' + OR.plural(n, 'application') + '</a>' : '') + (c.tags || []).map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div></div><div class="rz-co-links">' + UI.ext(c.website, 'Site') + UI.ext(c.careersUrl, 'Careers') + '</div></li>';
      }).join('') + '</ul>' : '<p class="muted">' + (st().companies.length ? 'No company matches that filter.' : 'No companies yet. Paste a job link above, or fill in the form by hand.') + '</p>';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.elements.name.value.trim()) { form.elements.name.focus(); OR.toast('Give the company a name.', { tone: 'error' }); return; }
      var o = readCompany(form), dup = st().companies.filter(function (c) { return c.name.toLowerCase() === o.name.toLowerCase(); })[0];
      if (dup) { OR.toast(o.name + ' is already in your list.', { tone: 'error', action: { label: 'Open', run: function () { OR.go('#/resume/companies/' + dup.id); } } }); return; }
      var rec = UI.addCompany(o);
      OR.toast(rec.name + ' added.', { tone: 'ok' });
      form.reset(); OR.$('#rz-af input').value = ''; OR.$('#rz-af .rz-af-status').innerHTML = '';
      list();
    });
    OR.$('#co-q').addEventListener('input', function (e) { coFilter.q = e.target.value; list(); });
    OR.$('#co-tier').addEventListener('change', function (e) { coFilter.tier = e.target.value; list(); });
    list();
  }

  function companyTab(host, ctx, id) {
    var c = UI.company(id);
    if (!c) { host.innerHTML = '<div class="empty"><h2 class="empty-title">That company isn’t in your list</h2><a class="btn" href="#/resume/companies">Back to companies</a></div>'; return; }
    var apps = st().pipeline.filter(function (a) { return a.companyId === id; }), ls = st().coverLetters.filter(function (l) { return l.companyId === id; });
    host.innerHTML = '<div class="rz-co-detail"><p><a href="#/resume/companies">' + OR.icon('chevron-left', 'icon-sm') + 'All companies</a></p>' +
      '<div class="rz-co-head">' + UI.avatar(c.name, 'is-lg') + '<div><h2 class="section-title">' + esc(c.name) + '</h2><div class="rz-co-links">' + UI.ext(c.website, 'Website') + UI.ext(c.careersUrl, 'Careers') + '</div></div></div>' +
      '<form id="rz-co-edit" class="stack-4" novalidate>' + companyFields(c, 'ce-') + '<div class="btn-row"><button class="btn btn-primary" type="submit">Save changes</button><button class="btn btn-danger" type="button" data-co="del">' + OR.icon('trash', 'icon-sm') + 'Delete company</button></div></form>' +
      '<section class="rz-sec"><h3 class="sub-title">Applications</h3>' + (apps.length ? '<ul class="plain-list">' + apps.map(function (a) { return '<li><a href="#/pipeline?open=' + esc(a.id) + '">' + esc(a.role || 'Role not set') + '</a><span class="chip">' + esc(stageName(a.stage)) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">None yet. <a href="#/pipeline?new=1&company=' + esc(id) + '">Track an application</a>.</p>') + '</section>' +
      '<section class="rz-sec"><h3 class="sub-title">Cover letters</h3>' + (ls.length ? '<ul class="plain-list">' + ls.map(function (l) { return '<li><a href="#/resume/documents/' + esc(l.id) + '">' + esc(l.title || 'Untitled letter') + '</a></li>'; }).join('') + '</ul>' : '<p class="muted">None for this company.</p>') + '</section>' +
      '<section class="rz-sec"><h3 class="sub-title">Stored files</h3><div id="rz-co-docs"><p class="muted">Loading…</p></div></section></div>';
    UI.listDocs().then(function (r) {
      var el = OR.$('#rz-co-docs'); if (!el) return;
      var mine = r.list.filter(function (d) { return d.companyId === id; });
      el.innerHTML = !r.ok ? '<p class="muted">Stored files aren’t available in this browser window (' + esc(r.err) + ').</p>' : mine.length ? '<ul class="plain-list">' + mine.map(function (d) { return '<li>' + OR.icon('file', 'icon-sm') + '<span>' + esc(d.name) + '</span><span class="faint num">' + UI.fmtSize(d.size) + '</span></li>'; }).join('') + '</ul><p class="field-hint"><a href="#/resume/documents">Manage files</a></p>' : '<p class="muted">No files for this company. <a href="#/resume/documents">Upload one</a>.</p>';
    });
    host.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, o = readCompany(f);
      if (!o.name) { f.elements.name.focus(); OR.toast('A company needs a name.', { tone: 'error' }); return; }
      OR.store.update(function (s) { var x = s.companies.filter(function (q) { return q.id === id; })[0]; if (x) { Object.assign(x, o); x.updated = Date.now(); } });
      OR.toast('Saved.', { tone: 'ok' }); OR.rerender();
    });
    host.addEventListener('click', function (e) {
      if (!e.target.closest('[data-co="del"]')) return;
      OR.confirm({ title: 'Delete ' + c.name + '?', body: 'Applications, files and letters for it are kept, but they stop being linked to a company.', ok: 'Delete company', danger: true }).then(function (ok) {
        if (!ok) return;
        OR.store.update(function (s) { s.pipeline.forEach(function (a) { if (a.companyId === id) { a.companyName = a.companyName || c.name; } }); s.companies = s.companies.filter(function (q) { return q.id !== id; }); });
        OR.go('#/resume/companies');
      });
    });
  }
  var STAGES = ['Wishlist', 'Applied', 'Recruiter screen', 'Phone / OA', 'Onsite', 'Offer', 'Rejected'];
  var STAGE_IDS = ['wishlist', 'applied', 'recruiter', 'phone', 'onsite', 'offer', 'rejected'];
  function stageName(id) { var i = STAGE_IDS.indexOf(id); return i < 0 ? id : STAGES[i]; }
  UI.STAGES = STAGES; UI.STAGE_IDS = STAGE_IDS; UI.stageName = stageName;

  OR.addSearch(function () {
    return st().companies.map(function (c) { return { group: 'Companies', title: c.name, sub: c.tier ? TIERS.filter(function (t) { return t[0] === c.tier; })[0][1] : 'Company', icon: 'building', href: '#/resume/companies/' + c.id }; });
  });
})();
