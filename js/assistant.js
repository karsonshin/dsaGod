/* Offer Ready: the AI tutor.
   A chat that answers coding, data structure, algorithm, system design and CS questions from this app's own lessons (js/kb.js).
   The lessons are always the source: the exact passages are shown with every answer. When the on-device model is switched on
   (js/localai.js, runs in this browser, nothing leaves it) it also rewrites those passages as a short teacher-style explanation.
   The model is told to use only the passages, and a question the lessons do not cover is answered with "not in your lessons"
   instead of a guess. Selecting text anywhere and right-clicking (touch: tap the "Ask AI" pill) asks the tutor to explain it.
   The chat DOM is built once and moved between the side drawer and the #/assistant page. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, CHAT = 'ai:chat';
  var SUGGEST = ['How do I sort a list in Python?', 'Show me BFS code', 'Explain Kadane’s algorithm', 'How do I implement a min heap?', 'When should I use a hash map vs a set?', 'How does consistent hashing work?'];
  var msgs = [], busy = false, abort = null, root = null, drawer = null, scrim = null, ui = {};

  /* ---------- History (kept with your progress so it follows you between devices) ---------- */
  function load() { var h = OR.store.get().drafts[CHAT]; msgs = Array.isArray(h) ? h.filter(function (m) { return m && typeof m.text === 'string'; }) : []; }
  var saveSoon = OR.debounce(function () {
    var keep = msgs.slice(-30).map(function (m) { return { role: m.role, text: m.text.slice(0, 12000), model: m.model ? m.model.slice(0, 6000) : undefined, mode: m.mode, dropped: m.dropped, sources: m.sources, qa: m.qa, related: m.related, lesson: m.lesson ? m.lesson.slice(0, 9000) : undefined, ts: m.ts }; });
    OR.store.update(function (s) { s.drafts[CHAT] = keep; });
  }, 800);
  function aiOn() { return OR.localai && OR.localai.enabled() && OR.localai.supported(); }

  /* ---------- Rendering ---------- */
  var LANG = { python: 'py', py: 'py', python3: 'py', javascript: 'js', js: 'js', typescript: 'js', ts: 'js', java: 'java', cpp: 'cpp', 'c++': 'cpp', c: 'cpp' };
  function codeFigure(lang, src) {
    var k = LANG[String(lang).toLowerCase()];
    if (!k) return '<pre class="md-code"><code>' + esc(src) + '</code></pre>';
    var runnable = k === 'py' || k === 'js';
    return OR.codeBlock(src, { lang: k, title: '' }) +
      '<div class="ai-code-actions" data-lang="' + k + '" data-code="' + encodeURIComponent(src) + '">' +
      (runnable ? '<button class="btn btn-sm btn-ghost" type="button" data-ai="run">' + OR.icon('play', 'icon-sm') + 'Run it</button>' : '') +
      '<button class="btn btn-sm btn-ghost" type="button" data-ai="play">' + OR.icon('code', 'icon-sm') + 'Open in Playground</button></div><div class="ai-run-out" aria-live="polite"></div>';
  }
  function renderBody(text) {
    text = String(text || '');
    if ((text.match(/```/g) || []).length % 2) text += '\n```'; // a code block still streaming in
    var out = '', last = 0, re = /```([\w+#-]*)\n([\s\S]*?)```/g, m;
    while ((m = re.exec(text))) { out += OR.md(text.slice(last, m.index)) + codeFigure(m[1], m[2].replace(/\n$/, '')); last = m.index + m[0].length; }
    return out + OR.md(text.slice(last));
  }
  function sourcesHTML(m) {
    if (!m.sources || !m.sources.length) return '';
    return '<details class="ai-sources"><summary>Where this comes from (' + m.sources.length + ')</summary><ol>' + m.sources.map(function (s) { return '<li><a href="' + esc(s.href) + '">' + esc(s.title) + '</a></li>'; }).join('') + '</ol></details>';
  }
  function badge(m) {
    if (m.role !== 'assistant') return '';
    return m.mode === 'direct' ? '<p class="ai-badge">' + OR.icon('check', 'icon-sm') + 'Direct answer: written, and its code tested by running it</p>'
      : m.mode === 'local' ? '<p class="ai-badge">' + OR.icon('check', 'icon-sm') + 'Straight from your lessons</p>'
      : m.mode === 'none' ? '<p class="ai-badge" data-tone="warn">' + OR.icon('info', 'icon-sm') + 'Not in your lessons</p>' : '';
  }
  function chips(ids, label) {
    var list = (ids || []).map(function (id) { return OR.qaEngine.get(id); }).filter(Boolean);
    return list.length ? '<div class="ai-related"><p class="faint">' + esc(label) + '</p><div class="ai-chips">' + list.map(function (e) { return '<button class="chip" type="button" data-ai="qa" data-id="' + esc(e.id) + '">' + esc(e.title) + '</button>'; }).join('') + '</div></div>' : '';
  }
  function directHTML(m, e) {
    var see = OR.qaEngine.links(e), src = see.length ? '<details class="ai-sources" open><summary>Learn more in your lessons</summary><ol>' + see.map(function (x) { return '<li><a href="' + esc(x.href) + '">' + esc(x.title) + '</a></li>'; }).join('') + '</ol></details>' : '';
    var lesson = m.lesson ? '<details class="ai-lessons"><summary>Walk through it step by step (from your lesson)</summary><div class="prose ai-body">' + renderBody(m.lesson) + '</div></details>' : '';
    return '<div class="ai-msg ai-bot">' + badge(m) + '<div class="prose ai-body">' + renderBody(OR.qaEngine.markdown(e)) + '</div>' + src + lesson + chips(m.related, 'Related questions') + '</div>';
  }
  function msgHTML(m) {
    if (m.role === 'assistant' && m.mode === 'direct') { var qe = OR.qaEngine.get(m.qa); if (qe) return directHTML(m, qe); }
    if (m.role === 'user') return '<div class="ai-msg ai-user"><p>' + esc(m.text).replace(/\n/g, '<br>') + '</p></div>';
    var model = m.model !== undefined
      ? '<details class="ai-lessons ai-model"' + (m.writing ? ' open' : '') + '><summary>Simpler wording from the small on-device model (experimental: it can be wrong, so check it against the lesson text above)</summary><div class="prose ai-body">' +
        (m.model ? renderBody(m.model) : '<p class="faint">' + esc(m.wait || 'Writing…') + '</p>') + '</div>' + (m.dropped ? '<p class="faint">' + m.dropped + ' sentence' + (m.dropped > 1 ? 's' : '') + ' it wrote were removed because the lessons do not support them.</p>' : '') + '</details>' : '';
    return '<div class="ai-msg ai-bot">' + badge(m) + '<div class="prose ai-body">' + renderBody(m.text) + '</div>' + (m.mode === 'none' || m.related ? chips(m.related, m.mode === 'none' ? 'Questions I can answer that are close to yours' : 'Did you mean one of these?') : '') + sourcesHTML(m) + model + '</div>';
  }
  function paintMode() {
    var s = OR.localai ? OR.localai.state() : { status: 'idle' }, on = OR.localai && OR.localai.enabled();
    ui.mode.textContent = !on ? 'Lessons only' : s.status === 'ready' ? 'On-device AI ready' : s.status === 'loading' ? 'Loading AI ' + Math.round((s.pct || 0) * 100) + '%' : s.status === 'error' ? 'AI unavailable' : 'AI on';
    ui.mode.dataset.ai = on && s.status === 'ready' ? 'on' : 'off';
  }
  function paintLog(stick) {
    var near = ui.log.scrollHeight - ui.log.scrollTop - ui.log.clientHeight < 80;
    if (!msgs.length) {
      ui.log.innerHTML = '<div class="ai-empty"><h3>Ask me anything you’re learning</h3><p>Data structures, algorithms, Python, system design. Every answer comes from your own lessons, so what I say matches what you study, and I tell you when something is not in them.</p>' +
        (aiOn() ? '' : '<p class="ai-tip">Want it explained in simpler words, like a teacher? Open the gear above and switch on the on-device AI.</p>') +
        '<p class="ai-tip">Tip: select any word or sentence on a page and right-click it (or press and hold on a phone), then choose <strong>Explain</strong>.</p>' +
        '<div class="ai-chips">' + SUGGEST.map(function (s) { return '<button class="chip" type="button" data-ai="suggest">' + esc(s) + '</button>'; }).join('') + '</div></div>';
    } else ui.log.innerHTML = msgs.map(msgHTML).join('');
    if (stick || near) ui.log.scrollTop = ui.log.scrollHeight;
  }
  function paintLast() { // streaming: only the last message changes
    var els = ui.log.querySelectorAll('.ai-msg'), el = els[els.length - 1], m = msgs[msgs.length - 1];
    if (!el || !m) return paintLog(true);
    el.outerHTML = msgHTML(m); ui.log.scrollTop = ui.log.scrollHeight;
  }
  function paintBusy() { ui.send.textContent = busy ? 'Stop' : 'Ask'; ui.send.classList.toggle('btn-primary', !busy); }

  /* ---------- Questions the tutor could not answer, kept so the answer bank can grow ---------- */
  function missed() { var m = OR.store.get().drafts['ai:missed']; return Array.isArray(m) ? m : []; }
  function noteMissed(q) {
    q = String(q).trim().slice(0, 200); var list = missed();
    if (!q || list.indexOf(q) >= 0) return;
    OR.store.update(function (s) { s.drafts['ai:missed'] = missed().concat([q]).slice(-100); });
  }

  /* ---------- Asking ---------- */
  function pageContext() {
    var h = location.hash || '', m = h.match(/^#\/topic\/([a-z0-9-]+)/), topic = m && OR.topicMeta(m[1]) ? m[1] : null;
    return { topic: topic, title: topic ? OR.topicMeta(topic).title : (document.title || '').replace(/ · Offer Ready$/, '') };
  }
  var SYSTEM = 'You rewrite text for a beginner. Rewrite the PASSAGE in simple words and short sentences. Keep every fact and number. Do not add anything that is not in the PASSAGE. ' +
    'Explain any technical word using only words from the passage. Write at most 6 sentences.';
  function passages(q, page) {
    var ctx = OR.kb.context(q, { page: page, limit: 2, chars: 1500 });
    return { text: ctx.text.replace(/```[\s\S]*?```/g, '').replace(/^\[S\d+\][^\n]*\n/gm, ''), sources: ctx.sources };
  }
  // Keep only sentences whose content words mostly appear in the passage the model was given.
  function onlySupported(answer, source) {
    var have = {}; OR.kb.tokens(source).forEach(function (t) { have[t] = 1; });
    var parts = String(answer).split(/(?<=[.!?])\s+|\n+/), kept = [], dropped = 0;
    parts.forEach(function (p) {
      var toks = OR.kb.tokens(p);
      if (toks.length < 4) { kept.push(p); return; }
      var hit = toks.filter(function (t) { return have[t]; }).length;
      if (hit / toks.length >= 0.6) kept.push(p); else dropped++;
    });
    return { text: kept.join(' ').trim(), dropped: dropped };
  }

  // opts: { display, selection, quote, kind: 'explain' | 'define' | 'code' }
  async function ask(text, opts) {
    opts = opts || {}; text = String(text || '').trim(); if (!text || busy) return;
    OR.assistant.open();
    msgs.push({ role: 'user', text: opts.display || text, ts: Date.now() });
    var page = pageContext(), query = opts.selection ? opts.selection + (opts.kind === 'code' ? ' code example' : '') : text;
    var qa = OR.qaEngine.answer(opts.selection || text, { min: opts.selection ? 6 : 0 });
    if (qa.confident && !(opts.selection && opts.kind === 'define' && qa.sim < 0.6)) {
      var topicSee = (qa.entry.see || []).map(function (h) { return h.match(/^#\/topic\/([^/]+)/); }).filter(Boolean)[0];
      var tw = topicSee ? OR.kb.teach(topicSee[1], { text: text }) : null;
      msgs.push({ role: 'assistant', text: qa.entry.title, mode: 'direct', qa: qa.entry.id, related: qa.related.map(function (e) { return e.id; }), lesson: tw ? tw.md : '', ts: Date.now(), sources: [] });
      paintLog(true); saveSoon(); return;
    }
    var defs = opts.selection && opts.kind !== 'code' ? OR.kb.define(opts.selection, 4) : [];
    var local = OR.kb.answer(query, { page: page, teach: !!opts.selection && opts.kind !== 'code' });
    var bot = { role: 'assistant', text: '', mode: 'local', ts: Date.now(), sources: [] };
    msgs.push(bot); busy = true; paintLog(true); paintBusy();
    try {
      var lead = defs.length ? '### In plain words\n\n' + defs.map(function (g) { return '- **' + g.term + '**: ' + g.def; }).join('\n') + '\n\n' : '';
      if (!local.found && !defs.length) {
        noteMissed(text);
        bot.mode = 'none';
        bot.text = 'I could not find that in your lessons, so I will not guess.' + (local.hits.length ? '\n\nThe closest passages are:\n\n' + local.hits.map(function (h) { return '- [' + h.chunk.title + ': ' + h.chunk.label + '](' + h.chunk.href + ')'; }).join('\n') : '') +
          '\n\nTry other words (for example the name of the data structure or algorithm), or search with **Ctrl K**.';
        bot.related = qa.all ? qa.all.slice(0, 4).map(function (x) { return x.entry.id; }) : []; bot.suggest = true;
      } else {
        bot.text = (opts.selection && local.found && !local.teach ? lead + 'Here is what your lessons say about “' + opts.selection.slice(0, 80) + '”:\n\n' : lead) + (local.found ? local.md : '');
        bot.related = qa.all ? qa.all.slice(0, 4).map(function (x) { return x.entry.id; }) : [];
        bot.sources = (local.found ? local.sources : []).concat(defs.map(function (g) { return { title: 'Meaning of "' + g.term + '"', href: g.href }; }));
        if (aiOn() && local.found) {
          bot.model = ''; bot.writing = true; bot.wait = OR.localai.state().status === 'ready' ? 'Writing…' : 'Loading the on-device AI (first time only)…'; paintLast();
          var ps = passages(query + ' ' + (page.topic ? OR.topicMeta(page.topic).title : ''), page);
          var q = opts.selection ? (opts.kind === 'define' ? 'Define this in plain words for someone new to it: “' + opts.selection + '”.' : 'Explain this to a beginner: “' + opts.selection + '”.') : text;
          abort = new AbortController();
          try {
            var pending = false;
            await OR.localai.generate({ system: SYSTEM, user: 'PASSAGE:\n' + ps.text + '\n\nRewrite the passage so it answers: ' + q, signal: abort.signal, max: 260, onDelta: function (d) { bot.model += d; if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; paintLast(); }); } } });
            var chk = onlySupported(bot.model, ps.text + ' ' + query); bot.model = chk.text; bot.dropped = chk.dropped;
            if (!bot.model) bot.model = '*The model did not write anything the lessons support.*';
          } catch (e) {
            if (e.name !== 'AbortError') { OR.toast('The on-device AI could not run: ' + (e.message || 'unknown error'), { tone: 'error' }); delete bot.model; }
          }
          bot.writing = false;
        }
      }
    } catch (e) { bot.mode = 'none'; bot.text = '**' + (e.message || 'Something went wrong.') + '**'; }
    busy = false; abort = null; paintLog(false); paintBusy(); paintMode(); saveSoon();
  }

  /* ---------- Chat DOM, drawer, page ---------- */
  function build() {
    if (root) return;
    root = document.createElement('section'); root.className = 'ai'; root.setAttribute('aria-label', 'AI tutor');
    root.innerHTML = '<header class="ai-head"><div class="ai-title">' + OR.icon('ai') + '<strong>AI tutor</strong><span class="ai-mode" id="ai-mode"></span></div>' +
      '<div class="ai-tools"><button class="icon-btn" type="button" data-ai="settings" aria-label="Tutor settings" title="Settings">' + OR.icon('settings', 'icon-sm') + '</button>' +
      '<button class="icon-btn" type="button" data-ai="clear" aria-label="Start a new chat" title="New chat">' + OR.icon('trash', 'icon-sm') + '</button>' +
      '<button class="icon-btn ai-close" type="button" data-ai="close" aria-label="Close the tutor">' + OR.icon('x', 'icon-sm') + '</button></div></header>' +
      '<div class="ai-settings" hidden></div><div class="ai-log" role="log" aria-live="polite" aria-label="Conversation"></div>' +
      '<form class="ai-form"><textarea class="input" rows="2" placeholder="Ask a coding question…" aria-label="Your question"></textarea><button class="btn btn-primary" type="submit">Ask</button></form>';
    ui = { mode: OR.$('#ai-mode', root), log: OR.$('.ai-log', root), form: OR.$('.ai-form', root), input: OR.$('textarea', root), send: OR.$('.ai-form .btn', root), settings: OR.$('.ai-settings', root) };
    ui.form.addEventListener('submit', function (e) { e.preventDefault(); if (busy) { if (abort) abort.abort(); return; } var t = ui.input.value; ui.input.value = ''; ask(t); });
    ui.input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ui.form.requestSubmit(); } });
    root.addEventListener('click', onClick);
    OR.on('localai', function () { paintMode(); if (!ui.settings.hidden) ui.settings.innerHTML = settingsHTML(); });
    paintMode(); paintLog(true);
  }
  function settingsHTML() {
    var L = OR.localai, s = L.state(), on = L.enabled(), why = L.reason();
    var status = why ? '<p class="banner" data-tone="warn">' + OR.icon('info') + '<span>' + esc(why) + '</span></p>'
      : s.status === 'loading' ? '<p>Loading the model… <strong>' + Math.round((s.pct || 0) * 100) + '%</strong><br><span class="faint">' + esc(s.text) + '</span></p><progress max="1" value="' + (s.pct || 0) + '"></progress>'
      : s.status === 'ready' ? '<p>' + OR.icon('check', 'icon-sm') + ' The model is loaded and ready.</p>'
      : s.status === 'error' ? '<p class="banner" data-tone="warn">' + OR.icon('warning') + '<span>Could not load: ' + esc(s.text) + '</span></p>' : '';
    var mlist = missed(), missedHTML = '<h3>Questions I could not answer</h3>' + (mlist.length ? '<p class="muted">' + mlist.length + ' so far. Copy the list and send it to whoever maintains this app (or add answers to <code>data/qa/</code>), and they get answered next time.</p><div class="btn-row"><button class="btn" type="button" data-ai="copy-missed">Copy the list</button><button class="btn btn-ghost" type="button" data-ai="clear-missed">Clear it</button></div>' : '<p class="muted">Nothing yet. When I cannot answer, the question is kept here.</p>');
    return '<h3>On-device AI</h3><p class="muted">A small open model (' + esc(L.modelName) + ', about 290 MB) that runs in this browser on your graphics card. It is part of this site, so nothing you type is sent anywhere, and after the first load it works offline. It is an experiment: it rewrites a lesson passage in simpler words, and because it is small it sometimes gets facts wrong. Every answer is built from your lesson text first, and the model’s wording appears below it, labelled, only if you turn it on.</p>' +
      status + '<div class="btn-row">' +
      (!why && !on ? '<button class="btn btn-primary" type="button" data-ai="enable">Turn on and download (~290 MB, one time)</button>' : '') +
      (!why && on && s.status !== 'loading' ? '<button class="btn" type="button" data-ai="disable">Turn off</button>' : '') + '</div>' + missedHTML;
  }
  function onClick(e) {
    var b = e.target.closest('[data-ai]'); if (!b) return;
    var a = b.dataset.ai;
    if (a === 'suggest') ask(b.textContent);
    else if (a === 'qa') { var qe2 = OR.qaEngine.get(b.dataset.id); if (qe2) ask(qe2.q[0]); }
    else if (a === 'close') OR.assistant.close();
    else if (a === 'clear') { if (abort) abort.abort(); msgs = []; saveSoon(); paintLog(true); }
    else if (a === 'settings') { ui.settings.hidden = !ui.settings.hidden; if (!ui.settings.hidden) ui.settings.innerHTML = settingsHTML(); }
    else if (a === 'copy-missed') { OR.copyText(missed().join(String.fromCharCode(10))); OR.toast('Copied ' + missed().length + ' questions.', { tone: 'ok' }); }
    else if (a === 'clear-missed') { OR.store.update(function (s2) { s2.drafts['ai:missed'] = []; }); ui.settings.innerHTML = settingsHTML(); }
    else if (a === 'enable') { OR.localai.setEnabled(true); paintMode(); OR.localai.load().catch(function () { /* shown in the settings */ }); ui.settings.innerHTML = settingsHTML(); }
    else if (a === 'disable') { OR.localai.setEnabled(false); OR.localai.unload(); paintMode(); ui.settings.innerHTML = settingsHTML(); OR.toast('On-device AI turned off. Answers come from the lessons only.'); }
    else if (a === 'run') {
      var box = b.closest('.ai-code-actions'), out = box.nextElementSibling, lang = box.dataset.lang, code = decodeURIComponent(box.dataset.code);
      b.disabled = true; out.innerHTML = '<p class="faint">' + (lang === 'py' && !OR.runner.pyReady() ? 'Loading Python (the first run downloads about 10 MB)…' : 'Running…') + '</p>';
      OR.runner.run({ lang: lang, code: code, tests: null }).then(function (r) { b.disabled = false; r.lang = lang; out.innerHTML = OR.resultsHTML(r, null); });
    } else if (a === 'play') {
      var bx = b.closest('.ai-code-actions'), l = bx.dataset.lang, src = decodeURIComponent(bx.dataset.code);
      OR.store.update(function (s) { var d = Object.assign({}, s.drafts.playground || {}); d[l] = src; d.lang = l; d.at = Date.now(); s.drafts.playground = d; });
      OR.go('#/playground');
    }
  }

  function ensureDrawer() {
    if (drawer) return;
    drawer = document.createElement('aside'); drawer.className = 'ai-drawer'; drawer.id = 'ai-drawer'; drawer.hidden = true;
    scrim = document.createElement('div'); scrim.className = 'ai-scrim'; scrim.hidden = true; scrim.addEventListener('click', function () { OR.assistant.close(); });
    document.body.appendChild(scrim); document.body.appendChild(drawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden && !OR.$('dialog[open]')) OR.assistant.close(); });
  }

  OR.assistant = {
    open: function (focus) {
      build(); if (!ui.log) return;
      if (location.hash.indexOf('#/assistant') === 0) { ui.input.focus(); return; }
      ensureDrawer(); if (root.parentNode !== drawer) drawer.appendChild(root);
      drawer.hidden = false; scrim.hidden = false; document.body.classList.add('ai-open'); OR.$('#ai-btn') && OR.$('#ai-btn').setAttribute('aria-pressed', 'true');
      if (focus) ui.input.focus();
      // The model downloads only after you have switched it on once; later visits warm it up in the background.
      if (OR.localai && OR.localai.enabled() && OR.localai.supported() && OR.localai.state().status === 'idle') OR.localai.load().catch(function () { /* shown in the settings */ });
    },
    close: function () { if (!drawer) return; drawer.hidden = true; scrim.hidden = true; document.body.classList.remove('ai-open'); OR.$('#ai-btn') && OR.$('#ai-btn').setAttribute('aria-pressed', 'false'); },
    toggle: function () { build(); if (drawer && !drawer.hidden) this.close(); else this.open(true); },
    ask: ask, passages: passages, isOpen: function () { return !!drawer && !drawer.hidden; }
  };

  /* The #/assistant page: the same chat, full width (handy on a phone) */
  OR.views.assistant = {
    title: function () { return 'AI tutor'; },
    render: function (main) {
      build(); OR.assistant.close();
      main.innerHTML = '<div class="page ai-page"><div class="page-head"><div><h1 class="page-title display">AI tutor</h1><p class="page-lede">Ask about anything you are learning. Answers come from your own lessons.</p></div></div><div id="ai-host"></div></div>';
      OR.$('#ai-host', main).appendChild(root); paintLog(true);
      return function () { if (drawer) drawer.appendChild(root); };
    }
  };

  /* ---------- Ask about selected text ---------- */
  var menu = null, pill = null, pending = null;
  function selText() { var s = window.getSelection(); if (!s || s.isCollapsed) return null; var t = s.toString().replace(/\s+/g, ' ').trim(); if (t.length < 2 || t.length > 1200) return null; return { text: t, node: s.anchorNode }; }
  function surrounding(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentElement), p = el && el.closest('p, li, dd, td, blockquote, .prose, section');
    return p ? p.textContent.replace(/\s+/g, ' ').trim().slice(0, 700) : '';
  }
  function explain(kind) {
    var s = selText() || pending; if (!s) return; hideSelUi();
    var labels = { explain: 'Explain: ', define: 'Define: ', code: 'Show code for: ' };
    ask(s.text, { selection: s.text, quote: s.quote || surrounding(s.node), kind: kind, display: (labels[kind] || '') + '“' + (s.text.length > 160 ? s.text.slice(0, 160) + '…' : s.text) + '”' });
  }
  function hideSelUi() { if (menu) menu.hidden = true; if (pill) pill.hidden = true; }
  function showMenu(x, y, sel) {
    if (!menu) {
      menu = document.createElement('div'); menu.className = 'ai-menu'; menu.setAttribute('role', 'menu');
      menu.innerHTML = '<button type="button" role="menuitem" data-k="explain">' + OR.icon('ai', 'icon-sm') + 'Explain this like a teacher</button><button type="button" role="menuitem" data-k="define">' + OR.icon('bulb', 'icon-sm') + 'Define it in plain words</button><button type="button" role="menuitem" data-k="code">' + OR.icon('code', 'icon-sm') + 'Show example code</button><hr><button type="button" role="menuitem" data-k="copy">' + OR.icon('copy', 'icon-sm') + 'Copy</button>';
      menu.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      menu.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; if (b.dataset.k === 'copy') { OR.copyText(pending.text); hideSelUi(); } else explain(b.dataset.k); });
      document.body.appendChild(menu);
    }
    pending = { text: sel.text, node: sel.node, quote: surrounding(sel.node) };
    menu.hidden = false; var w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px'; menu.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + 'px';
    menu.querySelector('button').focus({ preventScroll: true });
  }
  function showPill(sel) {
    if (!pill) {
      pill = document.createElement('button'); pill.type = 'button'; pill.className = 'ai-pill'; pill.innerHTML = OR.icon('ai', 'icon-sm') + 'Ask AI';
      pill.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      pill.addEventListener('click', function () { explain('explain'); var s = window.getSelection(); if (s) s.removeAllRanges(); });
      document.body.appendChild(pill);
    }
    var r = window.getSelection().getRangeAt(0).getBoundingClientRect();
    pending = { text: sel.text, node: sel.node, quote: surrounding(sel.node) };
    pill.hidden = false; var w = pill.offsetWidth, h = pill.offsetHeight, below = r.bottom + 12 + h < innerHeight - 8;
    pill.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px'; pill.style.top = Math.max(8, below ? r.bottom + 12 : r.top - h - 12) + 'px';
  }
  function skip(target) { return target && target.closest && target.closest('input, textarea, select, .monaco-editor, .ai-form, [contenteditable="true"], .ai-menu'); }

  function bindSelection() {
    document.addEventListener('contextmenu', function (e) {
      if (skip(e.target)) return; var sel = selText(); if (!sel) return;
      e.preventDefault(); showMenu(e.clientX, e.clientY, sel);
    });
    document.addEventListener('pointerdown', function (e) { if (menu && !menu.hidden && !menu.contains(e.target)) menu.hidden = true; }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideSelUi(); });
    addEventListener('scroll', function () { if (menu) menu.hidden = true; }, { passive: true });
    var touch = matchMedia('(pointer: coarse)');
    document.addEventListener('selectionchange', OR.debounce(function () {
      if (!touch.matches) return;
      if (skip(document.activeElement)) { if (pill) pill.hidden = true; return; }
      var sel = selText(); if (sel && !skip(sel.node && (sel.node.nodeType === 1 ? sel.node : sel.node.parentElement))) showPill(sel); else if (pill) pill.hidden = true;
    }, 300));
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault(); var sel = selText();
        if (sel) { pending = { text: sel.text, node: sel.node, quote: surrounding(sel.node) }; explain('explain'); } else OR.assistant.toggle();
      }
    });
  }

  OR.actions = OR.actions || {};
  OR.actions.ai = function () { OR.assistant.toggle(); };
  OR.on('restored', function () { load(); if (ui.log) paintLog(true); });
  OR.on('lang', function () { if (ui.log) paintLog(false); });
  document.addEventListener('DOMContentLoaded', function () { load(); bindSelection(); });
})();
