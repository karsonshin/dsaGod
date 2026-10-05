/* Offer Ready: Pipeline (#/pipeline). A kanban of every application, stored in state.pipeline.
   Drag and drop, with keyboard-accessible move buttons. Cards link to companies (state.companies),
   stored PDFs (OR.docs) and cover letters (state.coverLetters). Uses OR.resumeUI from resume.js. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, L = OR.rlib, UI = OR.resumeUI;
  var SOURCES = [['', 'Not set'], ['referral', 'Referral'], ['cold', 'Cold email or message'], ['job-board', 'Job board'], ['linkedin', 'LinkedIn'], ['career-fair', 'Career fair or event'], ['recruiter', 'Recruiter reached out'], ['school', 'School or club'], ['other', 'Other']];
  var F = { q: '', source: '', hideRejected: false, overdue: false };
  var dragId = null;

  function st() { return OR.store.get(); }
  function card(id) { var l = st().pipeline; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function cname(a) { return UI.companyName(a.companyId) || a.companyName || 'Company not set'; }
  function srcLabel(v) { var s = SOURCES.filter(function (x) { return x[0] === v; })[0]; return s ? s[1] : v; }
  function sourceFromParsed(p) { return p.source === 'linkedin' ? 'linkedin' : p.source ? 'job-board' : ''; }
  function isOverdue(a) { return a.next && a.next.due && a.stage !== 'rejected' && a.next.due < OR.today(); }
  function dueText(d) {
    var n = OR.daysBetween(OR.today(), d);
    return n < 0 ? OR.plural(-n, 'day') + ' overdue' : n === 0 ? 'due today' : n === 1 ? 'due tomorrow' : 'due ' + OR.fmtDate(d, { month: 'short', day: 'numeric' });
  }

  /* ---------- Moving cards ---------- */
  function move(id, stage, beforeId) {
    OR.store.update(function (s) {
      var l = s.pipeline, i = l.findIndex(function (a) { return a.id === id; }); if (i < 0) return;
      var a = l.splice(i, 1)[0];
      if (a.stage !== stage) { a.stage = stage; a.stageAt = OR.today(); if (stage === 'applied' && !a.applied) a.applied = OR.today(); }
      a.updated = Date.now();
      var at = beforeId ? l.findIndex(function (x) { return x.id === beforeId; }) : -1;
      if (at < 0) { for (var k = l.length - 1; k >= 0; k--) if (l[k].stage === stage) { at = k + 1; break; } }
      if (at < 0) at = l.length;
      l.splice(at, 0, a);
    });
  }

  /* ---------- Edit / new dialog ---------- */
  function contactsText(a) { return (a.contacts || []).map(function (c) { return [c.name, c.role, c.contact].join(' | ').replace(/( \| )+$/, ''); }).join('\n'); }
  function parseContacts(t) {
    return String(t || '').split('\n').map(function (l) { return l.split('|').map(function (x) { return x.trim(); }); }).filter(function (p) { return p[0]; }).map(function (p) { return { name: p[0], role: p[1] || '', contact: p[2] || '' }; });
  }
  function opts(list, sel) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === sel ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function stageOptions(sel) { return UI.STAGE_IDS.map(function (id, i) { return [id, UI.STAGES[i]]; }); }

  function openCard(a, seed) {
    var isNew = !a; a = a || { stage: 'wishlist', contacts: [], docIds: [], letterIds: [] };
    seed = seed || {};
    var letters = st().coverLetters, lastParsed = null;
    var html = (isNew ? '<div id="pl-af"></div>' : '') +
      '<div class="rz-grid">' +
      '<div class="field"><label class="field-label" for="pc-co">Company</label><input class="input" id="pc-co" name="company" list="pc-cos" required autocomplete="off" value="' + esc(seed.company || (a.id ? cname(a) : '')) + '"><datalist id="pc-cos">' + UI.companies().map(function (c) { return '<option value="' + esc(c.name) + '"></option>'; }).join('') + '</datalist></div>' +
      '<div class="field"><label class="field-label" for="pc-role">Role</label><input class="input" id="pc-role" name="role" placeholder="Software Engineer, New Grad" value="' + esc(seed.role || a.role || '') + '"></div>' +
      '<div class="field is-wide"><label class="field-label" for="pc-link">Posting link</label><input class="input" id="pc-link" name="link" inputmode="url" value="' + esc(seed.link || a.link || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="pc-stage">Stage</label><select class="select" id="pc-stage" name="stage">' + opts(stageOptions(), seed.stage || a.stage) + '</select></div>' +
      '<div class="field"><label class="field-label" for="pc-src">Source</label><select class="select" id="pc-src" name="source">' + opts(SOURCES, seed.source || a.source || '') + '</select></div>' +
      '<div class="field"><label class="field-label" for="pc-app">Date applied</label><input class="input" type="date" id="pc-app" name="applied" value="' + esc(a.applied || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="pc-step">Next step on (interview, OA)</label><input class="input" type="date" id="pc-step" name="nextStep" value="' + esc(a.nextStep || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="pc-next">Next action</label><input class="input" id="pc-next" name="nextText" placeholder="Follow up with recruiter" value="' + esc((a.next && a.next.text) || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="pc-due">Action due</label><input class="input" type="date" id="pc-due" name="nextDue" value="' + esc((a.next && a.next.due) || '') + '"></div>' +
      '<div class="field is-wide"><label class="field-label" for="pc-con">Contacts, one per line: name | role | email or LinkedIn</label><textarea class="textarea" id="pc-con" name="contacts" rows="3" placeholder="Priya Shah | Recruiter | priya@acme.com">' + esc(contactsText(a)) + '</textarea></div>' +
      '<div class="field is-wide"><label class="field-label" for="pc-notes">Notes</label><textarea class="textarea" id="pc-notes" name="notes" rows="3">' + esc(a.notes || '') + '</textarea></div>' +
      '<fieldset class="field is-wide pl-links"><legend class="field-label">Attached files and letters</legend><div id="pc-docs" class="pl-checks"><span class="muted">Loading…</span></div>' +
      (letters.length ? '<div class="pl-checks">' + letters.map(function (l) { return '<label><input type="checkbox" name="letter" value="' + esc(l.id) + '"' + ((a.letterIds || []).indexOf(l.id) >= 0 ? ' checked' : '') + '><span>' + esc(l.title || 'Untitled letter') + ' <span class="faint">(cover letter' + (UI.companyName(l.companyId) ? ', ' + esc(UI.companyName(l.companyId)) : '') + ')</span></span></label>'; }).join('') + '</div>' : '') + '</fieldset></div>';
    return UI.form({
      title: isNew ? 'New application' : 'Application: ' + cname(a), html: html, wide: true, ok: isNew ? 'Add to pipeline' : 'Save',
      extra: isNew ? '' : '<button type="button" class="btn btn-danger pl-del" data-x="del">Delete</button>',
      onOpen: function (dlg, form, finish) {
        var del = dlg.querySelector('[data-x="del"]');
        if (del) del.addEventListener('click', function () { OR.confirm({ title: 'Delete this application?', body: cname(a) + ' will be removed from the pipeline. Stored files stay in Documents.', ok: 'Delete', danger: true }).then(function (ok) { if (ok) finish('delete'); }); });
        if (isNew) UI.autofill(dlg.querySelector('#pl-af'), {
          onParsed: function (p) {
            lastParsed = p;
            function set(k, v) { if (v) form.elements[k].value = v; }
            set('company', p.name); set('role', p.role); set('link', p.jobUrl || (p.kind === 'job' ? p.url : ''));
            if (sourceFromParsed(p)) form.elements.source.value = sourceFromParsed(p);
          },
          onTitle: function (r) { if (!form.elements.company.value) form.elements.company.value = (r.site || r.title.split(/[|\-–—:]/).pop() || r.title).trim(); }
        });
        UI.listDocs().then(function (r) {
          var box = dlg.querySelector('#pc-docs'); if (!box) return;
          if (!r.ok) { box.innerHTML = '<span class="muted">Stored PDFs aren’t available in this browser window (' + esc(r.err) + ').</span>'; return; }
          var co = UI.companies().filter(function (c) { return c.name.toLowerCase() === (form.elements.company.value || '').trim().toLowerCase(); })[0];
          var docs = r.list.slice().sort(function (x, y) { return (y.companyId === (co && co.id)) - (x.companyId === (co && co.id)) || y.addedAt - x.addedAt; });
          box.innerHTML = docs.length ? docs.map(function (d) { return '<label><input type="checkbox" name="doc" value="' + esc(d.id) + '"' + ((a.docIds || []).indexOf(d.id) >= 0 ? ' checked' : '') + '><span>' + esc(d.name) + ' <span class="faint">(' + esc(UI.companyName(d.companyId) || 'no company') + ')</span></span></label>'; }).join('') : '<span class="muted">No PDFs stored yet. Add them in Resume studio, Documents.</span>';
        });
      }
    }).then(function (f) {
      if (!f) return;
      if (f === 'delete') { OR.store.update(function (s) { s.pipeline = s.pipeline.filter(function (x) { return x.id !== a.id; }); }); OR.toast('Application deleted.', { tone: 'ok' }); return; }
      var g = function (k) { return f.elements[k].value.trim(); };
      var name = g('company');
      var co = UI.addCompany({ name: name, website: lastParsed && lastParsed.website, careersUrl: lastParsed && lastParsed.careersUrl });
      var rec = {
        id: a.id || 'a_' + OR.uid(), companyId: co.id, companyName: co.name, role: g('role'), link: UI.safeUrl(g('link')) || (g('link') ? 'https://' + g('link') : ''), stage: g('stage'), source: g('source'),
        applied: g('applied'), nextStep: g('nextStep'), next: g('nextText') || g('nextDue') ? { text: g('nextText'), due: g('nextDue') } : null,
        contacts: parseContacts(f.elements.contacts.value), notes: g('notes'),
        docIds: Array.prototype.map.call(f.querySelectorAll('input[name="doc"]:checked'), function (x) { return x.value; }),
        letterIds: Array.prototype.map.call(f.querySelectorAll('input[name="letter"]:checked'), function (x) { return x.value; }),
        created: a.created || Date.now(), updated: Date.now(), stageAt: a.stageAt || OR.today()
      };
      if (isNew && rec.stage === 'applied' && !rec.applied) rec.applied = OR.today();
      if (!isNew && a.stage !== rec.stage) rec.stageAt = OR.today();
      // Docs hidden because storage was unavailable must not be lost on save.
      if (!f.querySelector('input[name="doc"]') && a.docIds) rec.docIds = a.docIds;
      OR.store.update(function (s) {
        var i = s.pipeline.findIndex(function (x) { return x.id === rec.id; });
        if (i < 0) s.pipeline.push(rec); else s.pipeline[i] = Object.assign({}, s.pipeline[i], rec);
      });
      OR.toast(isNew ? 'Added to ' + UI.stageName(rec.stage) + '.' : 'Saved.', { tone: 'ok' });
    });
  }

  /* ---------- Board ---------- */
  function visible(a) {
    var q = F.q.toLowerCase();
    if (F.hideRejected && a.stage === 'rejected') return false;
    if (F.source && a.source !== F.source) return false;
    if (F.overdue && !isOverdue(a)) return false;
    if (q && (cname(a) + ' ' + (a.role || '') + ' ' + (a.notes || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }
  function cardHTML(a) {
    var i = UI.STAGE_IDS.indexOf(a.stage), n = (a.docIds || []).length + (a.letterIds || []).length, od = isOverdue(a);
    var prev = UI.STAGES[i - 1], next = UI.STAGES[i + 1], name = cname(a);
    return '<li class="pl-card" draggable="true" data-id="' + esc(a.id) + '" data-od="' + !!od + '">' +
      '<div class="pl-card-top">' + UI.avatar(name, 'is-sm') + '<div class="pl-card-title"><button type="button" class="pl-open" data-pl="open" data-id="' + esc(a.id) + '"><strong>' + esc(name) + '</strong><span>' + esc(a.role || 'Role not set') + '</span></button></div></div>' +
      '<div class="pl-chips">' +
      (a.applied ? '<span class="chip">Applied ' + esc(OR.fmtDate(a.applied, { month: 'short', day: 'numeric' })) + '</span>' : '') +
      (a.nextStep ? '<span class="chip chip-accent">' + OR.icon('clock', 'icon-sm') + esc(OR.fmtDate(a.nextStep, { month: 'short', day: 'numeric' })) + '</span>' : '') +
      (a.source ? '<span class="chip">' + esc(srcLabel(a.source)) + '</span>' : '') +
      (n ? '<span class="chip">' + OR.icon('file', 'icon-sm') + n + '</span>' : '') + '</div>' +
      (a.next && (a.next.text || a.next.due) ? '<p class="pl-next' + (od ? ' is-od' : '') + '">' + (od ? OR.icon('warning', 'icon-sm') : OR.icon('arrow-right', 'icon-sm')) + '<span>' + esc(a.next.text || 'Next action') + (a.next.due ? ' <span class="pl-due">' + esc(dueText(a.next.due)) + '</span>' : '') + '</span></p>' : '') +
      '<div class="pl-move"><button type="button" class="icon-btn" data-pl="back" data-id="' + esc(a.id) + '" aria-label="Move ' + esc(name) + ' back to ' + esc(prev || '') + '"' + (prev ? '' : ' disabled') + '><svg class="icon icon-sm" aria-hidden="true" style="transform:scaleX(-1)"><use href="#i-arrow-right"/></svg></button>' +
      '<span class="pl-stage-name">' + esc(UI.STAGES[i] || a.stage) + '</span>' +
      '<button type="button" class="icon-btn" data-pl="fwd" data-id="' + esc(a.id) + '" aria-label="Move ' + esc(name) + ' forward to ' + esc(next || '') + '"' + (next ? '' : ' disabled') + '>' + OR.icon('arrow-right', 'icon-sm') + '</button></div></li>';
  }
  function boardHTML() {
    var all = st().pipeline;
    return UI.STAGE_IDS.map(function (sid, i) {
      var items = all.filter(function (a) { return a.stage === sid && visible(a); }), total = all.filter(function (a) { return a.stage === sid; }).length;
      return '<section class="pl-col" data-stage="' + sid + '" aria-labelledby="pl-h-' + sid + '"><h3 class="pl-col-h" id="pl-h-' + sid + '"><span>' + UI.STAGES[i] + '</span><span class="pl-count num" aria-label="' + OR.plural(total, 'application') + (items.length !== total ? ', ' + items.length + ' shown' : '') + '">' + (items.length !== total ? items.length + '/' : '') + total + '</span></h3>' +
        '<ul class="pl-list" data-stage="' + sid + '">' + items.map(cardHTML).join('') + '</ul>' + (items.length ? '' : '<p class="pl-empty">' + (sid === 'wishlist' ? 'Companies you want to apply to.' : 'Drop a card here.') + '</p>') + '</section>';
    }).join('');
  }
  function dueHTML() {
    var t = OR.today(), soon = OR.addDays(t, 7);
    var rows = st().pipeline.filter(function (a) { return a.next && a.next.due && a.stage !== 'rejected' && a.next.due <= soon; }).sort(function (a, b) { return a.next.due < b.next.due ? -1 : 1; });
    if (!rows.length) return '<p class="muted">No next actions are overdue or due this week.</p>';
    return '<ul class="plain-list pl-due-list">' + rows.map(function (a) {
      var od = a.next.due < t;
      return '<li data-od="' + od + '">' + (od ? OR.icon('warning', 'icon-sm') : OR.icon('clock', 'icon-sm')) + '<span class="pl-due-main"><strong>' + esc(cname(a)) + '</strong> ' + esc(a.next.text || 'Next action') + ' <span class="pl-due">' + esc(dueText(a.next.due)) + '</span></span>' +
        '<button class="btn btn-sm" data-pl="done" data-id="' + esc(a.id) + '">' + OR.icon('check', 'icon-sm') + 'Done</button><button class="btn btn-sm btn-ghost" data-pl="open" data-id="' + esc(a.id) + '">Open</button></li>';
    }).join('') + '</ul>';
  }

  OR.views.pipeline = {
    title: function () { return 'Pipeline'; },
    render: function (main, ctx) {
      var n = st().pipeline.length, open = ctx.query.open, newq = ctx.query.new, coq = ctx.query.company;
      main.innerHTML = '<div class="page pl"><div class="page-head"><div><h1 class="page-title display">Pipeline</h1><p class="page-lede">Every application, from wishlist to offer. Drag a card, or use its arrow buttons.</p></div>' +
        '<div class="btn-row"><button class="btn btn-primary" data-pl="new">' + OR.icon('plus', 'icon-sm') + 'New application</button><a class="btn" href="#/resume/companies">Companies</a></div></div>' +
        '<section class="pl-due-panel" aria-labelledby="pl-due-h"><h2 class="sub-title" id="pl-due-h">Next actions</h2><div id="pl-due"></div></section>' +
        '<div class="pl-filters" role="search"><label class="sr-only" for="pl-q">Search applications</label><input class="input" id="pl-q" type="search" placeholder="Search company, role, notes" value="' + esc(F.q) + '">' +
        '<label class="sr-only" for="pl-src">Source</label><select class="select select-sm" id="pl-src">' + opts(SOURCES.map(function (s, i) { return i ? s : ['', 'Any source']; }), F.source) + '</select>' +
        '<label class="pl-tog"><input type="checkbox" id="pl-rej"' + (F.hideRejected ? ' checked' : '') + '> Hide rejected</label><label class="pl-tog"><input type="checkbox" id="pl-od"' + (F.overdue ? ' checked' : '') + '> Overdue only</label></div>' +
        (n ? '' : '<div class="banner">' + OR.icon('info') + '<div>Nothing tracked yet. Add the roles you plan to apply to, so the wishlist drives your week. Use a job link to fill in the company and role automatically.</div></div>') +
        '<div class="pl-board" id="pl-board" role="group" aria-label="Application stages"></div></div>';
      var board = OR.$('#pl-board');
      function draw(focusSel) { OR.$('#pl-due').innerHTML = dueHTML(); board.innerHTML = boardHTML(); if (focusSel) { var f = OR.$(focusSel); if (f) f.focus(); } }
      draw();
      OR.setPlace({ title: 'Pipeline' });
      OR.$('#pl-q').addEventListener('input', function (e) { F.q = e.target.value; draw(); });
      OR.$('#pl-src').addEventListener('change', function (e) { F.source = e.target.value; draw(); });
      OR.$('#pl-rej').addEventListener('change', function (e) { F.hideRejected = e.target.checked; draw(); });
      OR.$('#pl-od').addEventListener('change', function (e) { F.overdue = e.target.checked; draw(); });
      OR.$('.pl').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pl]'); if (!b) return;
        var id = b.dataset.id, a = id && card(id), act = b.dataset.pl;
        if (act === 'new') openCard(null).then(function () { draw(); });
        else if (act === 'open' && a) openCard(a).then(function () { draw('.pl-open[data-id="' + id + '"]'); });
        else if (act === 'back' || act === 'fwd') {
          var i = UI.STAGE_IDS.indexOf(a.stage) + (act === 'fwd' ? 1 : -1);
          if (i < 0 || i >= UI.STAGE_IDS.length) return;
          move(id, UI.STAGE_IDS[i]);
          draw('[data-id="' + id + '"][data-pl="' + act + '"]:not([disabled])' ) ;
          if (!document.activeElement || document.activeElement === document.body) draw('[data-id="' + id + '"] .icon-btn:not([disabled])');
          OR.announce(cname(a) + ' moved to ' + UI.STAGES[i]);
        } else if (act === 'done' && a) {
          OR.store.update(function (s) { var x = s.pipeline.filter(function (q) { return q.id === id; })[0]; if (x) { x.next = null; x.updated = Date.now(); } });
          draw(); OR.toast('Marked done. Set a new next action when you know it.', { tone: 'ok' });
        }
      });
      /* Drag and drop (the arrow buttons are the keyboard path). */
      board.addEventListener('dragstart', function (e) {
        var c = e.target.closest && e.target.closest('.pl-card'); if (!c) return;
        dragId = c.dataset.id; c.classList.add('is-drag');
        e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId);
      });
      board.addEventListener('dragend', function () { dragId = null; OR.$$('.is-drag,.is-over', board).forEach(function (x) { x.classList.remove('is-drag', 'is-over'); }); });
      board.addEventListener('dragover', function (e) {
        var col = e.target.closest('.pl-col'); if (!col || !dragId) return;
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        OR.$$('.is-over', board).forEach(function (x) { if (x !== col) x.classList.remove('is-over'); });
        col.classList.add('is-over');
      });
      board.addEventListener('drop', function (e) {
        var col = e.target.closest('.pl-col'); if (!col || !dragId) return;
        e.preventDefault();
        var id = dragId, over = e.target.closest('.pl-card'), before = over && over.dataset.id !== id ? over.dataset.id : '';
        if (over && before) { var r = over.getBoundingClientRect(); if (e.clientY > r.top + r.height / 2) before = (over.nextElementSibling && over.nextElementSibling.dataset.id) || ''; }
        dragId = null;
        var a = card(id); move(id, col.dataset.stage, before);
        draw(); OR.announce(cname(a) + ' moved to ' + UI.stageName(col.dataset.stage));
      });
      if (open && card(open)) setTimeout(function () { OR.setQuery({}); openCard(card(open)).then(function () { draw(); }); }, 0);
      else if (newq) setTimeout(function () {
        OR.setQuery({});
        var co = coq && UI.company(coq), seed = co ? { company: co.name } : {};
        openCard(null, seed).then(function () { draw(); });
        if (newq !== '1') { var inp = OR.$('#pl-af input'); if (inp) { inp.value = newq; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } }
      }, 0);
    }
  };
})();
