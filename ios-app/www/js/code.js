/* Offer Ready: code display and editing.
   An offline highlighter (tok-* classes), the four-language code block that follows the global
   language toggle, a textarea editor (line gutter, tab indent, auto-indent), and the code panel
   that pairs the editor with the runner and its test results.

   Authoring notes for templates: a trailing comment that starts with ">" becomes a hover note on
   that line, and one that starts with "@name" names the line for visualizer sync:
     right += 1  #@expand > grow the window by one
   Python uses "#", the other languages "//". Both markers are stripped from the displayed code. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var KEYS = ['py', 'js', 'java', 'cpp'];

  /* ---------- Highlighter ---------- */
  function words(s) { var o = Object.create(null); s.split(' ').forEach(function (w) { o[w] = 1; }); return o; }
  var NUM = '(\\b(?:0[xXbBoO][\\da-fA-F_]+|\\d[\\d_]*\\.?\\d*(?:[eE][+-]?\\d+)?[jnlLfFdD]?)\\b)';
  var IDENT = '([A-Za-z_$][\\w$]*)';
  var C_COMMENT = '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)';
  var C_STRING = '"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'';
  var LANG = {
    py: {
      re: new RegExp('(#[^\\n]*)|([rbfuRBFU]{0,2}(?:\'\'\'[\\s\\S]*?\'\'\'|"""[\\s\\S]*?"""|\'(?:\\\\.|[^\'\\\\\\n])*\'|"(?:\\\\.|[^"\\\\\\n])*"))|(@[\\w.]+)|' + NUM + '|' + IDENT, 'g'),
      kw: words('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'),
      lit: words('True False None'),
      bi: words('len range print enumerate zip sorted reversed min max sum abs list dict set tuple int str float bool map filter any all iter next isinstance ord chr divmod pow round hash type super object self heapq deque defaultdict Counter OrderedDict bisect bisect_left bisect_right math functools itertools collections cache lru_cache inf heappush heappop heapify heappushpop nlargest nsmallest')
    },
    js: {
      re: new RegExp(C_COMMENT + '|(' + C_STRING + '|`(?:\\\\[\\s\\S]|[^`\\\\])*`)|(@\\w+)|' + NUM + '|' + IDENT, 'g'),
      kw: words('break case catch class const continue default delete do else export extends finally for function if in instanceof let new of return static super switch this throw try typeof var void while yield async await'),
      lit: words('true false null undefined NaN Infinity'),
      bi: words('Math Array Map Set Object Number String JSON console parseInt parseFloat BigInt Symbol Int32Array')
    },
    java: {
      re: new RegExp(C_COMMENT + '|(' + C_STRING + ')|(@\\w+)|' + NUM + '|' + IDENT, 'g'),
      kw: words('abstract boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public return short static super switch this throw throws try void volatile while var record'),
      lit: words('true false null'),
      bi: words('String Integer Long Double Character Boolean Math List ArrayList Map HashMap Set HashSet Deque ArrayDeque Queue PriorityQueue LinkedList TreeMap TreeSet Arrays Collections StringBuilder System Object Iterator')
    },
    cpp: {
      re: new RegExp(C_COMMENT + '|(' + C_STRING + ')|(#\\s*\\w+)|' + NUM + '|' + IDENT, 'g'),
      kw: words('auto bool break case catch char class const constexpr continue default delete do double else enum explicit for friend if inline int long namespace new operator private protected public return short signed sizeof static struct switch template this throw try typedef typename unsigned using virtual void while'),
      lit: words('true false nullptr NULL'),
      bi: words('std vector string map unordered_map set unordered_set multiset queue deque stack priority_queue pair make_pair sort reverse min max swap abs size_t greater less cout cin endl INT_MAX INT_MIN LLONG_MAX accumulate')
    }
  };

  function tokens(src, lang) {
    var L = LANG[lang] || LANG.py, re = new RegExp(L.re.source, 'g'), out = [], last = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > last) out.push(['', src.slice(last, m.index)]);
      var cls = '';
      if (m[1]) cls = 'comment';
      else if (m[2]) cls = 'string';
      else if (m[3]) cls = 'decorator';
      else if (m[4]) cls = 'number';
      else {
        var w = m[5];
        cls = L.kw[w] ? 'keyword' : L.lit[w] ? 'boolean' : L.bi[w] ? 'builtin'
          : /^\s*\(/.test(src.slice(re.lastIndex, re.lastIndex + 6)) ? 'function' : /^[A-Z][a-z]/.test(w) ? 'class-name' : '';
      }
      out.push([cls, m[0]]);
      last = re.lastIndex;
    }
    if (last < src.length) out.push(['', src.slice(last)]);
    return out;
  }
  // Highlighted HTML per line. Tokens that span lines (block comments, docstrings) are split at each newline.
  function hlLines(src, lang) {
    var lines = [''];
    tokens(src, lang).forEach(function (t) {
      t[1].split('\n').forEach(function (part, i) {
        if (i) lines.push('');
        if (part) lines[lines.length - 1] += t[0] ? '<span class="tok-' + t[0] + '">' + esc(part) + '</span>' : esc(part);
      });
    });
    return lines;
  }
  OR.highlight = function (src, lang) { return hlLines(String(src || ''), lang).join('\n'); };

  /* ---------- Code block ---------- */
  function splitNotes(src, lang) {
    var re = lang === 'py' ? /\s*#(?=\s*[@>])\s*(@[\w-]+)?\s*(?:>\s?(.*))?$/ : /\s*\/\/(?=\s*[@>])\s*(@[\w-]+)?\s*(?:>\s?(.*))?$/;
    var notes = [], marks = [];
    var lines = String(src).replace(/\r\n?/g, '\n').replace(/\s+$/, '').split('\n').map(function (line, i) {
      var m = line.match(re);
      if (!m) return line;
      if (m[1]) marks[i] = m[1].slice(1);
      if (m[2]) notes[i] = m[2].trim();
      return line.slice(0, m.index);
    });
    return { lines: lines, notes: notes, marks: marks };
  }
  OR.stripNotes = function (src, lang) { return splitNotes(src, lang).lines.join('\n'); };

  // code: { py, js, java, cpp } (any subset) or a string with opts.lang. opts: { title }
  OR.codeBlock = function (code, opts) {
    opts = opts || {};
    var single = typeof code === 'string'; // one fixed language (quiz snippets): always shown, no fallback note
    if (single) { var one = {}; one[opts.lang || 'py'] = code; code = one; }
    var langs = KEYS.filter(function (k) { return code && code[k]; });
    if (!langs.length) return '';
    var missing = single ? [] : KEYS.filter(function (k) { return langs.indexOf(k) < 0; }), anyNote = false, cur = OR.lang();
    var panes = langs.map(function (k, pi) {
      var p = splitNotes(code[k], k), hl = hlLines(p.lines.join('\n'), k);
      return '<div class="code-pane' + (pi === 0 ? ' pane-fb' : '') + '" data-l="' + k + '"><pre><code>' + hl.map(function (h, i) {
        if (p.notes[i]) anyNote = true;
        return '<span class="ln"' + (p.notes[i] ? ' data-note="' + esc(p.notes[i]) + '" tabindex="0"' : '') + (p.marks[i] ? ' data-mark="' + esc(p.marks[i]) + '"' : '') + '>' + (h || ' ') + '</span>';
      }).join('') + '</code></pre></div>';
    }).join('');
    var tabs = langs.length > 1 ? '<div class="seg code-langs" role="radiogroup" aria-label="Code language">' + langs.map(function (k) {
      var on = k === cur;
      return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on || (langs.indexOf(cur) < 0 && k === langs[0]) ? 0 : -1) + '" data-act="lang" data-lang="' + k + '">' + OR.LANGS[KEYS.indexOf(k)][1] + '</button>';
    }).join('') + '</div>' : '<span class="code-lang">' + OR.langName(langs[0]) + '</span>';
    return '<figure class="code' + (single ? ' code-single' : '') + missing.map(function (k) { return ' fb-' + k; }).join('') + '">' +
      '<figcaption class="code-bar"><span class="code-title">' + esc(opts.title || '') + '</span>' + tabs +
      '<button class="icon-btn" type="button" data-act="copy-code" aria-label="Copy code">' + OR.icon('copy', 'icon-sm') + '</button></figcaption>' +
      missing.map(function (k) { return '<p class="code-fb" data-l="' + k + '">No ' + OR.langName(k) + ' version here, so this shows ' + OR.langName(langs[0]) + '.</p>'; }).join('') +
      '<div class="code-body">' + panes + '</div>' +
      (anyNote ? '<p class="code-note" aria-live="polite">Hover, tap or tab to a marked line to see why it’s there.</p>' : '') + '</figure>';
  };

  // Light up the line(s) named "@name" in every language pane under root (visualizer sync).
  OR.markLine = function (root, name) {
    OR.$$('.ln.cur', root).forEach(function (l) { l.classList.remove('cur'); });
    if (name) OR.$$('.ln[data-mark="' + name + '"]', root).forEach(function (l) { l.classList.add('cur'); });
  };

  function visiblePane(fig) { return OR.$$('.code-pane', fig).filter(function (p) { return p.offsetParent !== null; })[0]; }
  OR.copyText = function (text) {
    function legacy() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); return ok ? Promise.resolve() : Promise.reject(new Error('copy blocked'));
    }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(legacy);
    return legacy();
  };
  OR.actions['copy-code'] = function (el) {
    var pane = visiblePane(el.closest('.code')); if (!pane) return;
    var text = OR.$$('.ln', pane).map(function (l) { return l.textContent.replace(/\s+$/, ''); }).join('\n');
    OR.copyText(text).then(function () { OR.toast('Code copied.', { tone: 'ok' }); }, function () { OR.toast('Copy was blocked by the browser. Select the code and copy it by hand.', { tone: 'error' }); });
  };
  function showNote(ln) {
    var fig = ln.closest('.code'), bar = fig && OR.$('.code-note', fig); if (!bar) return;
    var n = OR.$$('.ln', ln.parentNode).indexOf(ln) + 1;
    bar.innerHTML = '<b>Line ' + n + '</b><span>' + OR.inline(ln.dataset.note) + '</span>';
  }
  document.addEventListener('mouseover', function (e) { var ln = e.target.closest && e.target.closest('.ln[data-note]'); if (ln) showNote(ln); });
  document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('.ln[data-note]')) showNote(e.target); });
  document.addEventListener('click', function (e) { var ln = e.target.closest && e.target.closest('.ln[data-note]'); if (ln) showNote(ln); });
  OR.on('lang', function (k) {
    OR.$$('.code-langs').forEach(function (g) {
      var btns = OR.$$('[data-lang]', g), has = btns.some(function (b) { return b.dataset.lang === k; });
      btns.forEach(function (b, i) { var on = b.dataset.lang === k; b.setAttribute('aria-checked', String(on)); b.tabIndex = on || (!has && i === 0) ? 0 : -1; });
    });
  });

  /* ---------- Editor ---------- */
  var IND = '    ';
  OR.editor = function (ta, opts) {
    opts = opts || {};
    var wrap = document.createElement('div'), gut = document.createElement('div');
    wrap.className = 'editor'; gut.className = 'editor-gutter'; gut.setAttribute('aria-hidden', 'true');
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(gut); wrap.appendChild(ta);
    ta.classList.add('editor-text');
    ta.spellcheck = false; ta.setAttribute('wrap', 'off'); ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocomplete', 'off');
    var shown = 0, leaving = false;
    function gutter() {
      var n = ta.value.split('\n').length; if (n === shown) return;
      shown = n; var s = ''; for (var i = 1; i <= n; i++) s += i + '\n'; gut.textContent = s;
    }
    function insert(text) { ta.focus(); if (!document.execCommand('insertText', false, text)) ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); }
    function lineStart(pos) { return ta.value.lastIndexOf('\n', pos - 1) + 1; }
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { leaving = true; return; }
      if (e.key === 'Tab' && !leaving && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        if (s === en && !e.shiftKey) { insert(IND); return; }
        var a = lineStart(s); if (en > a && v.charAt(en - 1) === '\n') en--;
        var block = v.slice(a, en), out = e.shiftKey ? block.replace(/^( {1,4}|\t)/gm, '') : block.replace(/^/gm, IND);
        ta.setSelectionRange(a, en); insert(out); ta.setSelectionRange(a, a + out.length);
        return;
      }
      if (e.key !== 'Shift') leaving = false;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (opts.onRun) opts.onRun(); return; }
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        var line = ta.value.slice(lineStart(ta.selectionStart), ta.selectionStart), ind = line.match(/^[ \t]*/)[0];
        insert('\n' + ind + (/[:{[(]\s*$/.test(line) ? IND : ''));
      }
    });
    ta.addEventListener('blur', function () { leaving = false; });
    ta.addEventListener('input', function () { gutter(); if (opts.onChange) opts.onChange(ta.value); });
    ta.addEventListener('scroll', function () { gut.scrollTop = ta.scrollTop; });
    gutter();
    return { el: ta, get value() { return ta.value; }, set value(v) { ta.value = v; gutter(); gut.scrollTop = ta.scrollTop; } };
  };

  /* ---------- Code panel: editor + runner + results ---------- */
  var RUN_LANGS = [['py', 'Python'], ['js', 'JavaScript']];
  function show(v) { try { var s = JSON.stringify(v); return s === undefined ? String(v) : s; } catch (e) { return String(v); } }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  OR.resultsHTML = function (r, tests) {
    if (r.unavailable) return '<div class="banner" data-tone="warn">' + OR.icon('warning') + '<div>' + esc(r.unavailable) + '</div></div>';
    var h = '';
    if (r.timedOut) h += '<div class="banner" data-tone="danger">' + OR.icon('warning') + '<div>' + esc(r.timedOut) + '</div></div>';
    if (r.error) h += '<pre class="out-err">' + esc(r.error) + '</pre>';
    if (r.cases && r.cases.length) {
      var pass = r.cases.filter(function (c) { return c.pass; }).length, all = pass === r.cases.length;
      h += '<p class="out-sum" data-state="' + (all ? 'pass' : 'fail') + '">' + OR.icon(all ? 'check' : 'x', 'icon-sm') + '<strong>' + pass + ' of ' + r.cases.length + ' passed</strong>' +
        (r.ms != null ? '<span class="faint num">' + Math.round(r.ms) + ' ms</span>' : '') + '</p>' +
        '<div class="table-wrap"><table class="table out-cases"><thead><tr><th>#</th><th>Input</th><th>Expected</th><th>Got</th><th><span class="sr-only">Result</span></th></tr></thead><tbody>' +
        r.cases.map(function (c, i) {
          var tc = tests.cases[i] || {}, input = tests.design ? tc.ops.map(function (op, k) { return op + '(' + show(tc.args[k]).slice(1, -1) + ')'; }).join(', ') : (tc.args || []).map(show).join(', ');
          return '<tr data-state="' + (c.pass ? 'pass' : 'fail') + '"><td class="num">' + (i + 1) + '</td><td><code>' + esc(clip(input, 90)) + '</code></td><td><code>' + esc(clip(show(tc.out), 60)) + '</code></td>' +
            '<td>' + (c.error ? '<span class="out-case-err">' + esc(clip(c.error, 120)) + '</span>' : '<code>' + esc(clip(show(c.got), 60)) + '</code>') + '</td>' +
            '<td class="out-mark">' + OR.icon(c.pass ? 'check' : 'x', 'icon-sm') + '<span>' + (c.pass ? 'Pass' : 'Fail') + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    var text = (r.logs || []).map(function (l) { return l.text; }).join('\n').replace(/\s+$/, '');
    if (text) h += '<div class="out-logs"><p class="out-label">Output</p><pre>' + esc(text) + '</pre>' + (r.truncated ? '<p class="faint">Output was cut off after 20,000 characters.</p>' : '') + '</div>';
    if (!h) h = '<p class="faint">Ran with no output. Use ' + (r.lang === 'py' ? '<code>print()</code>' : '<code>console.log()</code>') + ' to see values.</p>';
    return h;
  };

  // o: { key, starter: { py, js }, tests, label }
  OR.codePanel = function (host, o) {
    var draft = Object.assign({}, OR.store.get().drafts[o.key] || {});
    var lang = draft.lang || (OR.lang() === 'js' ? 'js' : 'py');
    function code(l) { return draft[l] != null ? draft[l] : (o.starter && o.starter[l]) || ''; }
    host.innerHTML = '<div class="cpanel">' +
      '<div class="cpanel-bar"><div class="seg" role="radiogroup" aria-label="Language to run">' + RUN_LANGS.map(function (l) {
        return '<button type="button" role="radio" data-run-lang="' + l[0] + '" aria-checked="' + (l[0] === lang) + '" tabindex="' + (l[0] === lang ? 0 : -1) + '">' + l[1] + '</button>';
      }).join('') + '</div><span class="cpanel-hint">Ctrl+Space suggests. F2 renames every occurrence. Ctrl+D adds the next match. Ctrl+Enter runs. Ctrl+M then Tab leaves the editor.</span>' +
      '<button class="btn btn-sm btn-ghost" type="button" data-c="reset">' + OR.icon('reset', 'icon-sm') + (o.starter ? 'Reset to starter' : 'Clear') + '</button>' +
      '<button class="btn btn-sm btn-primary" type="button" data-c="run">' + OR.icon('play', 'icon-sm') + (o.tests ? 'Run tests' : 'Run') + '</button></div>' +
      '<textarea rows="14"></textarea><div class="cpanel-out" aria-live="polite"></div></div>';
    var ta = OR.$('textarea', host), out = OR.$('.cpanel-out', host), runBtn = OR.$('[data-c="run"]', host), busy = false;
    var save = OR.debounce(function () { OR.store.update(function (s) { s.drafts[o.key] = Object.assign({}, draft, { at: Date.now() }); }); }, 500);
    var ed = OR.editor(ta, { onRun: run, onChange: function (v) { draft[lang] = v; draft.lang = lang; save(); } }), ide = null;
    function text() { return ide ? ide.getValue() : ed.value; }
    function setLang(l) {
      lang = l;
      if (ide) ide.setModel(l, code(l)); else ed.value = code(l);
      ta.setAttribute('aria-label', 'Code editor, ' + OR.langName(l));
      OR.$$('[data-run-lang]', host).forEach(function (b) { var on = b.dataset.runLang === l; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    }
    function run() {
      if (busy) return;
      busy = true; runBtn.dataset.busy = 'true';
      out.innerHTML = '<p class="faint">' + (lang === 'py' && !OR.runner.pyReady() ? 'Loading Python (the first run downloads about 10 MB)…' : 'Running…') + '</p>';
      OR.runner.run({ lang: lang, code: text(), tests: o.tests || null }).then(function (r) {
        busy = false; delete runBtn.dataset.busy;
        r.lang = lang;
        out.innerHTML = OR.resultsHTML(r, o.tests);
        if (o.onResult) o.onResult(r);
      });
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-run-lang],[data-c]'); if (!b) return;
      if (b.dataset.runLang) { draft.lang = b.dataset.runLang; save(); setLang(b.dataset.runLang); }
      else if (b.dataset.c === 'run') run();
      else if (b.dataset.c === 'reset') {
        OR.confirm({ title: o.starter ? 'Reset to the starter code?' : 'Clear the editor?', body: 'Your ' + OR.langName(lang) + ' code here will be replaced. This can’t be undone.', ok: o.starter ? 'Reset' : 'Clear', danger: true }).then(function (ok) {
          if (!ok) return;
          delete draft[lang]; save(); setLang(lang);
        });
      }
    });
    setLang(lang);
    /* Upgrade to the IDE editor (Monaco) once it loads; the textarea above is the fallback and the first paint. */
    if (OR.ide) OR.ide.load().then(function () {
      if (!host.isConnected) return;
      var wrap = ta.parentNode, box = document.createElement('div'), pending = ta.value;
      box.className = 'ide-box'; wrap.parentNode.insertBefore(box, wrap); wrap.hidden = true;
      ide = OR.ide.create(box, { label: 'Code editor', onRun: run, onChange: function (l, v) { draft[l] = v; draft.lang = l; save(); } });
      draft[lang] = pending; ide.setModel(lang, pending);
    }, function () { /* Monaco missing: keep the textarea */ });
    return { run: run, get lang() { return lang; }, get value() { return text(); } };
  };
})();
