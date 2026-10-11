/* Offer Ready: the knowledge base behind the AI tutor.
   Everything the tutor knows comes from this app's own content: lessons (including extras), cheat sheets, the problem bank,
   system design, CS fundamentals and flashcards. This file turns that content into small passages ("chunks"), ranks them
   against a question (BM25 plus topic-name boosts and synonyms), and can compose an answer straight from the top passages
   without any AI model. The same passages are what a connected model is given as its only source of truth.
   OR.kb.search(q, opts) -> [{ chunk, score }]      OR.kb.answer(q, opts) -> { md, sources, found }      OR.kb.context(q, opts) -> prompt text */
(function () {
  'use strict';
  var OR = window.OR;
  var chunks = null, df = null, avgLen = 1, byTopic = {}, topicTokens = {};

  /* ---------- Text helpers ---------- */
  function plain(md) {
    return String(md == null ? '' : md)
      .replace(/```[\w+#-]*\n[\s\S]*?```/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*|__/g, '').replace(/[`>#]/g, ' ')
      .replace(/\|/g, ' | ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }
  var STOP = {};
  'a an the of to in on for and or is are was be it its this that these those with as at by from into how do does did i you my me we can could would should what whats which when where why who about so if then than not no vs via use using used between versus explain show tell describe teach simple simply please help understand mean meaning work works like five give example examples code write build make implement implementation create find'.split(' ').forEach(function (w) { STOP[w] = 1; });
  function stem(w) {
    if (w.length > 5 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /(ing|ed)$/.test(w)) return w.replace(/(ing|ed)$/, '');
    if (w.length > 4 && /(ss|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokens(s) {
    var t = String(s || '').toLowerCase().replace(/c\+\+/g, ' cpp ').replace(/(^|[^a-z])(?:a\*|a-star|astar)(?![a-z])/g, '$1 a star ').replace(/(^|[^a-z])k-?means(?![a-z])/g, '$1 k means ').replace(/[’']s/g, '').replace(/o\([^)]*\)/g, ' bigo ');
    var m = t.match(/[a-z0-9_]+/g);
    return m ? m.filter(function (w) { return !STOP[w]; }).map(stem) : [];
  }
  // Common ways to ask for a topic that the lesson titles do not use.
  var ALIAS = {
    bfs: 'breadth level queue', dfs: 'depth recursion', kadane: 'maximum subarray', dp: 'dynamic programming', dsu: 'union find disjoint',
    heap: 'priority heapq', pq: 'priority queue heap', bst: 'binary search tree', lru: 'lru cache', topological: 'topo sort', dijkstra: 'shortest paths',
    mst: 'minimum spanning kruskal prim', kmp: 'prefix failure', trie: 'prefix', bigo: 'complexity time space', complexity: 'bigo time space',
    sorted: 'sort', hashmap: 'hash dict', dict: 'hash map', memo: 'memoization cache', memoization: 'dynamic programming cache',
    backtrack: 'backtracking', bitmask: 'bits dp', gcd: 'math', sharding: 'shard partition', shard: 'sharding partition', loadbalancer: 'load balancer'
  };
  // The other direction: the words "dynamic programming" also mean the abbreviation "dp".
  function expandBack(toks) {
    var out = [];
    Object.keys(ALIAS).forEach(function (k) {
      var L = tokens(ALIAS[k]); if (L.length >= 2 && toks.indexOf(k) < 0 && L.every(function (x) { return toks.indexOf(x) >= 0; })) out.push(k);
    });
    return out;
  }
  // Names that point straight at one lesson.
  var HINT = { bfs: 'graphs', dfs: 'graphs', lru: 'design-ds', dsu: 'union-find', dijkstra: 'shortest-paths', kruskal: 'mst', prim: 'mst', heapq: 'heaps', bisect: 'binary-search', deque: 'queues', memoization: 'dp-1d', memo: 'dp-1d', topological: 'topo-sort', kadane: 'kadane', bitmask: 'bitmask-dp', trie: 'tries', fenwick: 'fenwick', kmp: 'string-algos' };
  function expand(toks) { // synonyms count for half as much as the words that were typed
    var ext = [];
    toks.forEach(function (t) { if (ALIAS[t]) tokens(ALIAS[t]).forEach(function (x) { if (toks.indexOf(x) < 0 && ext.indexOf(x) < 0) ext.push(x); }); });
    return ext;
  }

  /* ---------- Chunk building ---------- */
  var list;
  function add(c) {
    c.text = String(c.text || '').trim(); if (!c.text && !c.code) return;
    c.head = tokens(c.title + ' ' + (c.label || '')).join(' '); c.id = list.length; c.tok = tokens(c.title + ' ' + (c.label || '') + ' ' + c.text + ' ' + codeText(c.code)); list.push(c);
  }
  function codeText(code) { return code ? Object.keys(code).map(function (k) { return code[k]; }).join(' ').slice(0, 1500) : ''; }
  function pieces(text, max) { // split long text on paragraph boundaries
    var out = [], cur = '';
    String(text).split(/\n{2,}/).forEach(function (p) { if (cur && (cur + p).length > max) { out.push(cur); cur = ''; } cur += (cur ? '\n\n' : '') + p; });
    if (cur) out.push(cur); return out;
  }
  function addTopics() {
    OR.topics.forEach(function (t) {
      var meta = OR.topicMeta(t.id); if (!meta) return;
      var T = meta.title, base = '#/topic/' + t.id, g = t.id;
      function a(label, sec, text, extra) { add(Object.assign({ src: 'lesson', group: g, title: T, label: label, href: base + (sec ? '/' + sec : ''), text: text }, extra || {})); }
      var p = t.primer;
      if (p) a('At a glance', '', [p.what, p.does, p.impl, p.possibilities].filter(Boolean).map(plain).join('\n\n'), { boost: 1.8, kind: 'primer' });
      if (t.hook) a('Why it matters', '', plain(t.hook), { boost: 1.0 });
      if ((t.cues || []).length) a('Recognition cues', 'cues', t.cues.map(plain).join('\n'), { boost: 0.9 });
      if (t.intuition) a('Intuition', 'intuition', plain(t.intuition), { boost: 1.4, kind: 'intuition' });
      (t.breakdown || []).forEach(function (b, i) { a('Break it down, step ' + (i + 1) + ': ' + plain(b.title), 'breakdown', plain(b.body), { code: b.code, boost: 1.3, kind: 'breakdown' }); });
      (t.think || []).forEach(function (x) { a('Build the intuition', 'think', plain(x.q) + '\n' + plain(x.a), { boost: 1.0 }); });
      if (t.template) a('Template: ' + (t.template.title || ''), 'template', plain(t.template.note || ''), { code: t.template.code, boost: 1.5, kind: 'template' });
      if (t.complexity) a('Complexity', 'complexity', 'Time ' + t.complexity.time + '. Space ' + t.complexity.space + '. ' + plain(t.complexity.why || '') + (t.complexity.trap ? ' The trap: ' + plain(t.complexity.trap) : ''), { boost: 1.3, kind: 'complexity' });
      (t.variations || []).forEach(function (v) { a('Variation: ' + v.name, 'variations', plain(v.body), { code: v.code, boost: 1.0 }); });
      (t.worked || []).forEach(function (w) {
        var pr = w.lc && OR.problem && OR.problem(w.lc);
        a('Worked problem: ' + (w.title || (pr && pr.title) || ''), 'worked', [w.restate, w.brute, w.insight, w.complexity, w.say].filter(Boolean).map(plain).join('\n\n'), { code: w.code, boost: 1.1, kind: 'worked' });
      });
      (t.practice || []).forEach(function (q) {
        var pr = OR.problem && OR.problem(q.lc), st = OR.statements && OR.statements[q.lc];
        if (!q.how && !(q.solution && q.solution.explain)) return;
        add({ src: 'lesson', group: g, title: T, label: 'Practice: ' + (pr ? pr.title : q.lc) + ' (LeetCode ' + q.lc + ')', href: '#/problem/' + q.lc, text: [st && st.q, q.how, q.solution && q.solution.explain].filter(Boolean).map(plain).join('\n\n'), code: q.solution && q.solution.code, boost: 0.9 });
      });
      (t.drills || []).forEach(function (d) { a('Drill: ' + d.title, 'drills', plain(d.q) + '\n\n' + plain(d.how) + (d.explain ? '\n\n' + plain(d.explain) : ''), { code: d.code, boost: 1.0 }); });
      if ((t.mistakes || []).length) a('Common mistakes', 'mistakes', t.mistakes.map(plain).join('\n'), { boost: 1.0 });
      (t.flashcards || []).forEach(function (c) { a('Flashcard', 'cards', plain(c.front) + ' ' + plain(c.back), { boost: 1.2 }); });
      (t.quiz || []).forEach(function (q) { var right = [].concat(q.answer).map(function (i) { return q.choices[i]; }).join('; '); a('Quiz fact', 'quiz', plain(q.q) + ' Answer: ' + plain(right) + '. ' + plain(q.explain), { boost: 0.8 }); });
    });
  }
  function addSheets() {
    if (!OR.cheatsheets || !OR.csh) return;
    OR.cheatsheets.forEach(function (s) {
      var html = ''; try { html = s.render(OR.csh); } catch (e) { return; }
      var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
      doc.querySelectorAll('.cs-sec').forEach(function (sec) {
        var h = sec.querySelector('h3'), title = h ? h.textContent : s.title, code = [];
        sec.querySelectorAll('pre.cs-code').forEach(function (pre) { code.push(pre.textContent); pre.remove(); });
        sec.querySelectorAll('tr').forEach(function (tr) { tr.appendChild(doc.createTextNode('\n')); Array.prototype.forEach.call(tr.children, function (c) { c.appendChild(doc.createTextNode(' | ')); }); });
        var text = sec.textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
        pieces(text, 1400).forEach(function (txt, i) {
          add({ src: 'sheet', group: 'sheet:' + s.id, title: s.title, label: title + (i ? ' (cont.)' : ''), href: '#/cheatsheets/' + s.id, text: txt, code: i === 0 && code.length ? { py: code.join('\n\n') } : null, boost: 1.1 });
        });
      });
    });
  }
  function strings(o, out) { // every string inside a content object, in order
    if (typeof o === 'string') out.push(o); else if (Array.isArray(o)) o.forEach(function (x) { strings(x, out); });
    else if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { if (k !== 'id' && k !== 'diagram' && k !== 'scenarios') strings(o[k], out); });
    return out;
  }
  function addSystemDesign() {
    var SD = OR.sd || {};
    [['fundamentals', 'System design fundamentals: ', function (x) { return '#/system-design/fundamentals/' + x.id; }], ['cases', 'System design case study: ', function (x) { return '#/system-design/' + x.id; }],
     ['lld', 'Low-level design: ', function (x) { return '#/system-design/' + x.id; }]].forEach(function (row) {
      (SD[row[0]] || []).forEach(function (x) {
        pieces(plain(strings(x, []).join('\n\n')), 1300).forEach(function (txt, i) {
          add({ src: 'system', group: 'sd:' + x.id, title: row[1] + (x.title || x.id), label: i ? 'part ' + (i + 1) : 'overview', href: row[2](x), text: txt, boost: 1.1 });
        });
      });
    });
  }
  function addCS() {
    (OR.cs || []).forEach(function (t) {
      (t.sections || []).forEach(function (sec) {
        pieces(plain(sec.body), 1300).forEach(function (txt, i) {
          add({ src: 'cs', group: 'cs:' + t.id, title: 'CS fundamentals: ' + t.title, label: sec.title + (i ? ' (cont.)' : ''), href: '#/cs/' + t.id, text: txt, boost: 1.0 });
        });
      });
    });
    (OR.flashcards || []).forEach(function (c) { add({ src: 'cs', group: 'deck:' + (c.deck || 'general'), title: 'Flashcard', label: c.deck || 'general', href: '#/flashcards/' + encodeURIComponent(c.deck || ''), text: plain(c.front) + ' ' + plain(c.back), boost: 0.9 }); });
  }
  function addProblems() {
    (OR.problems || []).forEach(function (p) {
      var st = OR.statements && OR.statements[p.lc];
      add({ src: 'problem', group: 'prob:' + p.lc, title: p.title, label: 'LeetCode ' + p.lc + ' (' + p.difficulty + ')', href: '#/problem/' + p.lc, boost: 0.8,
        text: 'Pattern: ' + p.pattern + '. Topic: ' + ((OR.topicMeta(p.topic) || {}).title || p.topic) + '. ' + (st ? plain(st.q) + ' ' + plain(st.a) : '') });
    });
  }

  function build() {
    if (chunks) return;
    list = [];
    [addTopics, addSheets, addSystemDesign, addCS, addProblems].forEach(function (f) { try { f(); } catch (e) { console.error('kb', e); } });
    chunks = list; df = {}; var total = 0; byTopic = {};
    chunks.forEach(function (c) {
      total += c.tok.length; var seen = {};
      c.tok.forEach(function (t) { if (!seen[t]) { seen[t] = 1; df[t] = (df[t] || 0) + 1; } });
      (byTopic[c.group] = byTopic[c.group] || []).push(c);
      c.tf = {}; c.tok.forEach(function (t) { c.tf[t] = (c.tf[t] || 0) + 1; });
    });
    avgLen = total / Math.max(1, chunks.length);
    OR.topics.forEach(function (t) { var m = OR.topicMeta(t.id); if (m) topicTokens[t.id] = tokens(m.title + ' ' + t.id.replace(/-/g, ' ')); });
  }

  /* ---------- Search ---------- */
  function search(q, opts) {
    build(); opts = opts || {};
    var orig = tokens(q); if (!orig.length) return [];
    var ext = expand(orig), core = orig.join(' ');
    var N = chunks.length, k1 = 1.4, b = 0.72, topicBoost = {};
    Object.keys(topicTokens).forEach(function (id) {
      var hit = 0; topicTokens[id].forEach(function (t) { if (orig.indexOf(t) >= 0 || ext.indexOf(t) >= 0) hit++; });
      if (hit) topicBoost[id] = hit / topicTokens[id].length; // share of the lesson title that the question names
    });
    orig.forEach(function (t) { if (HINT[t]) topicBoost[HINT[t]] = (topicBoost[HINT[t]] || 0) + 1.5; });
    if (opts.page && opts.page.topic) topicBoost[opts.page.topic] = (topicBoost[opts.page.topic] || 0) + 0.3;
    function idf(t) { var d = df[t] || 0; return Math.log(1 + (N - d + 0.5) / (d + 0.5)); }
    var res = [];
    chunks.forEach(function (c) {
      var s = 0, matched = 0;
      function term(t, w) { var f = c.tf[t]; if (!f) return false; s += w * idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * c.tok.length / avgLen)); return true; }
      orig.forEach(function (t) { if (term(t, 1)) matched++; });
      ext.forEach(function (t) { term(t, 0.5); });
      if (!s) return;
      var coverage = matched / orig.length;
      s *= 0.3 + 0.7 * coverage * coverage;
      if (c.head.indexOf(core) >= 0) s += (orig.length > 1 ? 30 : 6) * Math.pow(Math.min(1, 3.5 * core.length / c.head.length), 2); else if (matched && orig.every(function (t) { return c.head.indexOf(t) >= 0; })) s += 6;
      s *= (c.boost || 1);
      if (topicBoost[c.group]) s *= 1 + 1.5 * topicBoost[c.group];
      res.push({ chunk: c, score: s, matched: matched, need: Math.ceil(orig.length * 0.6), exact: orig.length > 1 && c.head.indexOf(core) >= 0 });
    });
    res.sort(function (a, b2) { return b2.score - a.score; });
    return res.slice(0, opts.limit || 12);
  }

  /* ---------- Answers without a model ---------- */
  function langKey() { var l = OR.lang && OR.lang(); return { py: 'py', js: 'js', java: 'java', cpp: 'cpp' }[l] || 'py'; }
  function codeFor(code) { if (!code) return null; var k = langKey(), use = code[k] ? k : code.py ? 'py' : Object.keys(code)[0]; return use ? { lang: use, src: OR.stripNotes ? OR.stripNotes(code[use], use) : code[use] } : null; }
  function clip(s, n) { s = String(s); if (s.length <= n) return s; var cut = s.slice(0, n), i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n')); return (i > n * 0.5 ? cut.slice(0, i + 1) : cut) + ' …'; }

  // The best lesson/sheet/case for a question: its top passages add up, so a page that is relevant throughout beats one lucky passage.
  function bestGroup(hits) {
    var g = {};
    hits.forEach(function (h) { var k = h.chunk.group, e = g[k] = g[k] || { k: k, n: 0, sum: 0 }; if (e.n < 3) { e.sum += h.score * [1, 0.6, 0.35][e.n] + (h.exact ? 25 : 0); e.n++; } });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.sum - a.sum; })[0];
  }
  function answer(q, opts) {
    opts = opts || {};
    var all = search(q, { limit: 40, page: opts.page }); build();
    // A passage must name enough of what was asked (60% of the meaningful words), so a single rare word cannot pull in an unrelated page.
    var hits = all.filter(function (h) { return h.matched >= h.need; });
    if (!hits.length || hits[0].score < 2.2) return { found: false, md: '', sources: [], hits: hits.slice(0, 5) };   // only passages that really name the question's words
    var wantCode = /\b(code|implement|write|syntax|snippet|how (do|to|can|would) i|build|example|template|show me)\b/i.test(q);
    var wantExplain = /\b(explain|what is|what are|what's|why|intuition|understand|teach|simple|eli5|meaning|define)\b/i.test(q);
    var wantCx = /\b(complexity|complexities|big.?o|runtime|time|space|cost|fast|slow)\b/i.test(q);
    var grp = bestGroup(hits), mine = byTopic[grp.k] || [], inGroup = hits.filter(function (h) { return h.chunk.group === grp.k; });
    var top = inGroup[0].chunk, topic = top.src === 'lesson' ? grp.k : null;
    if (topic && ((wantExplain && !wantCx) || opts.teach)) {
      var tw = teach(topic, { text: q });
      if (tw) return { found: true, md: tw.md, sources: tw.sources, hits: hits.slice(0, 6), teach: true };
    }
    var picked = [], seen = {};
    function take(c, max) { if (!c || seen[c.id] || picked.length >= (max || 4)) return; seen[c.id] = 1; picked.push(c); }
    if (topic) {
      var find = function (kind) { return mine.filter(function (c) { return c.kind === kind; })[0]; };
      var order = wantCode ? ['template', 'primer', 'complexity'] : wantCx ? ['complexity', 'primer', 'template'] : wantExplain ? ['primer', 'intuition', 'breakdown', 'template'] : ['primer', 'template', 'complexity'];
      if (wantCode || wantExplain || wantCx) take(top, 4);
      order.forEach(function (k) { take(find(k), 4); });
    }
    inGroup.forEach(function (h) { if (h.score > inGroup[0].score * 0.5) take(h.chunk, 4); });
    var md = '', srcs = [];
    picked.forEach(function (c) {
      md += '### ' + c.label + (c.title && c.src !== 'problem' ? '\n*' + c.title + '*' : '') + '\n\n' + clip(c.text, wantExplain ? 900 : 700) + '\n\n';
      var cd = codeFor(c.code); if (cd) md += '```' + cd.lang + '\n' + cd.src + '\n```\n\n';
      srcs.push({ title: c.title + ': ' + c.label, href: c.href });
    });
    return { found: true, md: md.trim(), sources: srcs, hits: hits.slice(0, 6) };
  }

  /* ---------- Plain definitions of the terms the lessons use ---------- */
  var glossary = null;
  function firstSentences(t, n, max) { var m = String(t).replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+(\s|$)/g) || [String(t)]; return m.slice(0, n).join('').trim().slice(0, max || 320); }
  function buildGlossary() {
    if (glossary) return; build(); glossary = [];
    function put(term, def, href) {
      var tk = tokens(term); if (!tk.length || tk.length > 5 || !def || def.length < 25) return;
      glossary.push({ term: term, tok: tk, def: def, href: href });
    }
    OR.topics.forEach(function (t) {
      var m = OR.topicMeta(t.id); if (!m) return;
      var d = t.primer && t.primer.what ? plain(t.primer.what) : t.hook ? plain(t.hook) : '';
      // "Heaps and priority queues" defines both "heaps" and "priority queues"; "Union-Find (DSU)" defines both names.
      var def2 = firstSentences(d, 2, 330);
      m.title.replace(/\((.*?)\)/g, ' $1 ').split(/ and |, /).forEach(function (part) { put(part.trim(), def2, '#/topic/' + t.id); });
      put(m.title.replace(/\(.*\)/, '').trim(), def2, '#/topic/' + t.id);
      (t.flashcards || []).forEach(function (c) {
        var front = plain(c.front).replace(/\?$/, '').replace(/^(what('| i)?s|what is|what are|define|explain)\s+/i, '').replace(/^(an?|the)\s+/i, '').trim();
        if (front.split(/\s+/).length <= 5) put(front, firstSentences(plain(c.back), 2, 300), '#/topic/' + t.id + '/cards');
      });
    });
    (OR.flashcards || []).forEach(function (c) {
      var front = plain(c.front).replace(/\?$/, '').replace(/^(what('| i)?s|what is|what are|define|explain)\s+/i, '').replace(/^(an?|the)\s+/i, '').trim();
      if (front.split(/\s+/).length <= 5) put(front, firstSentences(plain(c.back), 2, 300), '#/flashcards/' + encodeURIComponent(c.deck || ''));
    });
  }
  // Definitions for the terms that appear in a piece of text, longest phrases first, at most `max`.
  function define(text, max) {
    buildGlossary(); var have = {}; tokens(text).forEach(function (t) { have[t] = 1; });
    var hits = glossary.filter(function (g) { return g.tok.every(function (t) { return have[t]; }); }).sort(function (a, b) { return b.tok.length - a.tok.length || a.term.length - b.term.length; });
    var out = [], seen = {}, covered = {};
    hits.forEach(function (g) {
      var k = g.tok.join(' ');
      if (seen[k] || out.length >= (max || 4)) return;
      if (g.tok.every(function (t) { return covered[t]; })) return; // a longer phrase already explains these words
      seen[k] = 1; g.tok.forEach(function (t) { covered[t] = 1; }); out.push(g);
    });
    return out;
  }

  /* ---------- A teacher-style walkthrough of one lesson, built only from its own text ---------- */
  function teach(topic, opts) {
    build(); opts = opts || {};
    var mine = byTopic[topic] || [], meta = OR.topicMeta(topic), t = OR.topics.filter(function (x) { return x.id === topic; })[0]; if (!meta || !t) return null;
    var md = '## ' + meta.title + ' in simple terms\n\n', srcs = [];
    function src(label, sec) { srcs.push({ title: meta.title + ': ' + label, href: '#/topic/' + topic + (sec ? '/' + sec : '') }); }
    var p = t.primer;
    if (p) { md += '**What it is.** ' + plain(p.what) + '\n\n**What it does.** ' + plain(p.does) + '\n\n'; src('At a glance', ''); }
    if (t.intuition) { md += '### Think of it like this\n\n' + clip(plain(t.intuition).split(/\n{2,}/).slice(0, 2).join('\n\n'), 700) + '\n\n'; src('Intuition', 'intuition'); }
    if ((t.breakdown || []).length) {
      md += '### Step by step\n\n' + t.breakdown.slice(0, 6).map(function (b, i) { return (i + 1) + '. **' + plain(b.title).replace(/^\d+\.\s*/, '').replace(/^Step \d+:\s*/, '') + '.** ' + firstSentences(plain(b.body), 2, 260); }).join('\n') + '\n\n'; src('Break it down', 'breakdown');
    }
    var terms = define((p ? [p.what, p.does, p.impl].join(' ') : '') + ' ' + (opts.text || ''), 5).filter(function (g) { return g.href !== '#/topic/' + topic; });
    if (terms.length) md += '### Words to know\n\n' + terms.map(function (g) { return '- **' + g.term + '**: ' + g.def; }).join('\n') + '\n\n';
    var tpl = mine.filter(function (c) { return c.kind === 'template'; })[0], cd = tpl && codeFor(tpl.code);
    if (cd) { md += '### The code\n\n' + (tpl.text ? clip(tpl.text, 300) + '\n\n' : '') + '```' + cd.lang + '\n' + cd.src + '\n```\n\n'; src('Template', 'template'); }
    if (t.complexity) { md += '### How fast is it?\n\nTime **' + t.complexity.time + '**, space **' + t.complexity.space + '**. ' + clip(plain(t.complexity.why || ''), 380) + '\n\n'; src('Complexity', 'complexity'); }
    if ((t.mistakes || []).length) { md += '### Watch out for\n\n' + t.mistakes.slice(0, 2).map(function (m2) { return '- ' + clip(plain(m2), 260); }).join('\n') + '\n\n'; src('Common mistakes', 'mistakes'); }
    return { md: md.trim(), sources: srcs };
  }

  /* ---------- Passages for a connected model ---------- */
  function context(q, opts) {
    opts = opts || {};
    var hits = search(q, { limit: opts.limit || 9, page: opts.page }), out = [], total = 0, srcs = [];
    hits.forEach(function (h) {
      if (total > (opts.chars || 9000)) return;
      var c = h.chunk, cd = codeFor(c.code), body = clip(c.text, 1100) + (cd ? '\n```' + cd.lang + '\n' + clip(cd.src, 900) + '\n```' : '');
      srcs.push({ n: srcs.length + 1, title: c.title + ': ' + c.label, href: c.href });
      out.push('[S' + srcs.length + '] ' + c.title + ' — ' + c.label + '\n' + body); total += body.length;
    });
    return { text: out.join('\n\n'), sources: srcs, top: hits.length ? hits[0].score : 0 };
  }

  OR.kb = { build: build, search: search, answer: answer, teach: teach, define: define, expand: expand, expandBack: expandBack, context: context, size: function () { build(); return chunks.length; }, tokens: tokens };
})();
