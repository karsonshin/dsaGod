/* Offer Ready: the answer bank engine.
   data/qa/*.js hold hand-written, code-verified answers (OR.qa). A question is matched to the closest entries by comparing it with
   each entry's phrasings, title and tags (word overlap plus BM25 over those fields), and the best entry is shown as the direct answer
   with its code. No model is involved: an answer is exactly what was written and tested.
   OR.qaEngine.match(q) -> [{ entry, score, sim }] ranked;  OR.qaEngine.answer(q, opts) -> { entry, related: [entries], confident };
   OR.qaEngine.markdown(entry) -> the answer as markdown, with code in the learner's current language. */
(function () {
  'use strict';
  var OR = window.OR, ready = false, entries = [], df = {}, avg = 1, byId = {};

  var SOFT = { time: 1, complexity: 1, space: 1, cost: 1, runtime: 1, fast: 1, slow: 1, speed: 1, memory: 1, bigo: 1 };   // asked about the cost of X: X matters more than these words
  function plain(s) { return String(s || '').replace(/```[\s\S]*?```/g, ' ').replace(/[`*_#>|]/g, ' '); }
  function build() {
    if (ready) return; ready = true; entries = (OR.qa || []).slice();
    var total = 0;
    entries.forEach(function (e) {
      byId[e.id] = e;
      e.tt = OR.kb.tokens(e.title); e.buildy = /implement|from scratch|build|create|write my own/i.test(e.title + ' ' + (e.q || []).join(' '));
      e.pq = (e.q || []).map(function (p) { return OR.kb.tokens(p); });                     // each phrasing as tokens
      e.head = OR.kb.tokens((e.q || []).join(' ') + ' ' + e.title + ' ' + (e.tags || ''));      // searchable words, high weight
      e.body = OR.kb.tokens(plain(e.a) + ' ' + plain(e.more) + ' ' + (e.cx || ''));                                  // answer text, low weight
      e.tf = {}; e.head.forEach(function (t) { e.tf[t] = (e.tf[t] || 0) + 1; }); e.btf = {}; e.body.forEach(function (t) { e.btf[t] = (e.btf[t] || 0) + 1; });
      var seen = {}; e.head.concat(e.body).forEach(function (t) { if (!seen[t]) { seen[t] = 1; df[t] = (df[t] || 0) + 1; } });
      total += e.head.length;
    });
    avg = total / Math.max(1, entries.length);
  }
  function jaccard(a, b) {
    var A = {}, n = 0, u = 0; a.forEach(function (t) { A[t] = 1; });
    var B = {}; b.forEach(function (t) { B[t] = 1; });
    Object.keys(A).forEach(function (t) { if (B[t]) n++; });
    u = Object.keys(A).length + Object.keys(B).length - n;
    return u ? n / u : 0;
  }

  function match(q, opts) {
    build(); opts = opts || {};
    var orig = OR.kb.tokens(q); if (!orig.length || !entries.length) return [];
    var ext = OR.kb.expand(orig), back = OR.kb.expandBack(orig), N = entries.length, res = [];
    function idf(t) { var d = df[t] || 0; return Math.log(1 + (N - d + 0.5) / (d + 0.5)); }
    var wantsCode = /(code|implement|build|write|syntax|snippet|show me|from scratch|how (do|to|can|would) i)/i.test(q);
    var wantsBuild = /(implement|from scratch|build|create|write (my|a|an|the)|code (a|an|the))/i.test(q);
    var rare = orig.slice().sort(function (a, b) { return idf(b) - idf(a); })[0];   // the most telling word in the question
    entries.forEach(function (e) {
      var s = 0, hit = 0, best = 0, wAll = 0;
      orig.forEach(function (t) {
        var f = e.tf[t], g = e.btf[t], w = idf(t) * (SOFT[t] && orig.length > 2 ? 0.35 : 1); wAll += w;
        if (f) { hit += w; s += w * (f * 2.4) / (f + 1.4 * (0.3 + 0.7 * e.head.length / avg)); }
        else if (g) { hit += 0.5 * w; s += 0.35 * w; }
      });
      ext.forEach(function (t) { if (e.tf[t]) s += 0.25 * idf(t); });
      back.forEach(function (t) { if (e.tf[t]) { s += 0.9 * idf(t); hit += 0.5 * wAll / Math.max(1, orig.length); } });
      if (!s) return;
      e.pq.forEach(function (p) { var j = jaccard(orig, p); if (j > best) best = j; });
      var coverage = hit / wAll;   // share of the question's meaning (rare words count more) that this entry covers
      var inTitle = orig.every(function (t) { return e.tt.indexOf(t) >= 0; });
      var score = s * (0.35 + 0.65 * coverage * coverage) + 14 * best * best + (coverage >= 0.99 ? 3 : 0) + (inTitle ? (orig.length > 1 ? 12 : 5) * Math.sqrt(orig.length / Math.max(1, e.tt.length)) : 0) + (wantsBuild && e.buildy ? 6 : 0) + (wantsCode ? (e.code && e.code.py ? 3 : -3) : 0) + (e.tt.indexOf(rare) >= 0 ? 5 : e.pq.some(function (p) { return p.indexOf(rare) >= 0; }) ? 2 : 0);
      res.push({ entry: e, score: score, sim: best, coverage: coverage, rareHit: !!e.tf[rare] });
    });
    res.sort(function (a, b) { return b.score - a.score; });
    return res.slice(0, opts.limit || 6);
  }

  // A direct answer only when the best entry is clearly about what was asked.
  function answer(q, opts) {
    var m = match(q, { limit: 6 }); if (!m.length) return { entry: null, related: [], confident: false };
    var top = m[0], second = m[1], strong = (top.sim >= 0.5) || (top.coverage >= 0.99 && top.score >= 7) || (top.coverage >= 0.66 && top.sim >= 0.34 && top.score >= 9);
    var min = (opts && opts.min) || 0;
    var confident = strong && top.score >= min && top.rareHit;   // never answer without the question's most distinctive word
    return { entry: top.entry, score: top.score, sim: top.sim, confident: confident, related: m.slice(1, 5).filter(function (x) { return x.score > top.score * 0.35; }).map(function (x) { return x.entry; }), all: m };
  }

  var LANGS = { py: 'Python', js: 'JavaScript', java: 'Java', cpp: 'C++' };
  function langKey(e) { var l = OR.lang && OR.lang(), c = e.code || {}; return c[l] ? l : c.py ? 'py' : Object.keys(c)[0]; }
  function seeTitle(href) {
    var m = href.match(/^#\/topic\/([^/]+)/); if (m) { var t = OR.topicMeta(m[1]); return t ? 'Lesson: ' + t.title : href; }
    m = href.match(/^#\/cheatsheets\/([^/]+)/); if (m) { var s = (OR.cheatsheets || []).filter(function (x) { return x.id === m[1]; })[0]; return s ? 'Cheat sheet: ' + s.title : 'Cheat sheets'; }
    m = href.match(/^#\/problem\/(\d+)/); if (m) { var p = OR.problem && OR.problem(+m[1]); return p ? 'Practice: ' + p.title : href; }
    if (/^#\/system-design/.test(href)) return 'System design'; if (/^#\/cs/.test(href)) return 'CS fundamentals';
    return href;
  }
  function markdown(e) {
    var md = '## ' + e.title + '\n\n' + e.a + '\n\n', k = langKey(e);
    if (k) {
      md += '```' + k + '\n' + e.code[k] + '\n```\n\n';
      var others = Object.keys(e.code).filter(function (x) { return x !== k; }).map(function (x) { return LANGS[x]; });
      if (OR.lang && OR.lang() !== k) md += '*Shown in ' + LANGS[k] + ' (no ' + LANGS[OR.lang()] + ' version of this one).*\n\n';
      else if (others.length) md += '*Also in: ' + others.join(', ') + '. Change the language in the top bar to switch.*\n\n';
    }
    if (e.more) md += e.more + '\n\n';
    if (e.cx) md += '**Cost:** ' + e.cx + '\n\n';
    return md.trim();
  }
  function links(e) { return (e.see || []).map(function (h) { return { title: seeTitle(h), href: h }; }); }

  OR.qaEngine = { match: match, answer: answer, markdown: markdown, links: links, get: function (id) { build(); return byId[id]; }, size: function () { build(); return entries.length; } };
})();
