/* Offer Ready: pure helpers for the resume studio and pipeline (no DOM, no network).
   URL parser (company/role guesses from a pasted link), bullet hints, keyword matcher, plain-text export.
   Works in the browser (window.OR.rlib) and in node (module.exports) so tools/test_autofill.js can assert it. */
(function () {
  'use strict';
  var lib = {};

  /* ---------- URL autofill ---------- */
  var SECOND_LEVEL = /^(co|com|org|net|ac|gov|edu)\.[a-z]{2}$/;
  var BOARDS = {
    'greenhouse.io': 'Greenhouse', 'lever.co': 'Lever', 'ashbyhq.com': 'Ashby', 'myworkdayjobs.com': 'Workday', 'workable.com': 'Workable',
    'smartrecruiters.com': 'SmartRecruiters', 'bamboohr.com': 'BambooHR', 'recruitee.com': 'Recruitee', 'linkedin.com': 'LinkedIn',
    'indeed.com': 'Indeed', 'glassdoor.com': 'Glassdoor', 'icims.com': 'iCIMS', 'jobvite.com': 'Jobvite', 'breezy.hr': 'Breezy', 'wellfound.com': 'Wellfound'
  };
  var GENERIC_SUB = /^(www\d?|careers?|jobs?|apply|boards|job-boards|hire|talent|work|join|recruiting|en|us|m)$/;
  var SMALL = /^(a|an|and|at|for|in|of|on|or|the|to|with)$/;

  function title(s) {
    return s.split(/\s+/).filter(Boolean).map(function (w, i) {
      if (/[a-z][A-Z]|^[A-Z]{2,}$/.test(w)) return w; // OpenAI, IBM: keep
      if (i && SMALL.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }
  function nameFromSlug(s) {
    s = decodeURIComponent(s).replace(/[-_+.]+/g, ' ').trim();
    if (!s || /^\d+$/.test(s)) return '';
    return s.length <= 3 && !/\s/.test(s) ? s.toUpperCase() : title(s);
  }
  // Registrable label: careers.google.com -> google, www.example.co.uk -> example, amazon.jobs -> amazon.
  function registrable(host) {
    var p = host.split('.');
    if (p.length < 2) return { label: host, domain: host };
    var n = SECOND_LEVEL.test(p.slice(-2).join('.')) ? 3 : 2;
    var d = p.slice(-n);
    return { label: d[0], domain: d.join('.'), sub: p.slice(0, -n) };
  }
  function nameFromLabel(label) {
    label = label.replace(/^(.{2,})(careers|jobs)$/, '$1');
    return nameFromSlug(label);
  }
  var ID_ONLY = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{20,}|[0-9a-f]{20,}|[A-Za-z]*\d{5,}[A-Za-z0-9]*)$/i;
  function roleFromSlug(seg) {
    if (!seg) return '';
    var s;
    try { s = decodeURIComponent(seg); } catch (e) { s = seg; }
    s = s.replace(/\.(html?|php|aspx?)$/i, '').replace(/_(R|JR|REQ)?-?\d+$/i, '').replace(/[-_]\d{5,}$/, '').replace(/^\d+[-_](?=[a-z])/i, '');
    s = s.replace(/-at-.+$/i, '');
    if (!s || ID_ONLY.test(s)) return '';
    var words = s.replace(/[-_+]+/g, ' ').trim().split(/\s+/);
    if (words.length < 2 && !/engineer|developer|intern|analyst|designer|scientist|manager/i.test(s)) return '';
    if (!/[a-z]{3}/i.test(s)) return '';
    return title(words.join(' '));
  }
  function jobish(path) { return /careers?|jobs?|openings?|positions?|apply|hiring|join/i.test(path); }

  lib.parseUrl = function (input) {
    var raw = String(input == null ? '' : input).trim();
    var out = { ok: false, input: raw, url: '', host: '', name: '', slug: '', source: '', kind: 'unknown', role: '', website: '', careersUrl: '', jobUrl: '', notes: [] };
    if (!raw || /\s/.test(raw) || raw.length > 2000) return out;
    var u;
    try { u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return out; }
    if (!/^https?:$/.test(u.protocol)) return out;
    var host = u.hostname.toLowerCase().replace(/\.$/, '');
    if (host.indexOf('.') < 0 || /^[\d.]+$/.test(host) || host.length > 253) return out;
    out.ok = true; out.host = host;
    // Drop tracking noise from the stored link.
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'trk', 'trackingId', 'refId', 'lipi', 'eBP', 'originalSubdomain', 'src', 'ref'].forEach(function (k) { u.searchParams.delete(k); });
    out.url = u.origin + (u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')) + u.search;
    var segs = u.pathname.split('/').filter(Boolean);
    var reg = registrable(host), board = BOARDS[reg.domain];

    if (board) {
      out.source = board.toLowerCase(); out.kind = 'job';
      var d = reg.domain, sub = reg.sub || [];
      if (d === 'greenhouse.io') {
        var slug = segs[0] === 'embed' ? (u.searchParams.get('for') || '') : (segs[0] || '');
        if (slug && !/^(embed|jobs)$/.test(slug)) { out.slug = slug; out.careersUrl = 'https://boards.greenhouse.io/' + slug; }
      } else if (d === 'lever.co') {
        if (segs[0]) { out.slug = segs[0]; out.careersUrl = 'https://jobs.lever.co/' + segs[0]; }
        out.role = roleFromSlug(segs[1]);
      } else if (d === 'ashbyhq.com') {
        if (segs[0]) { out.slug = segs[0]; out.careersUrl = 'https://jobs.ashbyhq.com/' + segs[0]; }
      } else if (d === 'myworkdayjobs.com') {
        var tenant = sub.filter(function (x) { return !/^(wd\d+|www)$/.test(x); })[0] || '';
        out.slug = tenant;
        var ji = segs.indexOf('job');
        if (ji >= 0) out.role = roleFromSlug(segs[segs.length - 1]);
        var site = segs.filter(function (x) { return !/^[a-z]{2}-[A-Z]{2}$/.test(x); })[0];
        out.careersUrl = tenant && site && site !== 'job' ? 'https://' + host + '/' + site : (tenant ? 'https://' + host : '');
      } else if (d === 'workable.com') {
        if (segs[0] && segs[0] !== 'j') { out.slug = segs[0]; out.careersUrl = 'https://apply.workable.com/' + segs[0]; }
      } else if (d === 'smartrecruiters.com') {
        if (segs[0]) { out.slug = segs[0]; out.careersUrl = 'https://careers.smartrecruiters.com/' + segs[0]; }
        out.role = roleFromSlug(segs[1]);
      } else if (d === 'bamboohr.com' || d === 'recruitee.com' || d === 'breezy.hr' || d === 'jobvite.com' || d === 'icims.com') {
        var t = sub.filter(function (x) { return !GENERIC_SUB.test(x); })[0] || '';
        out.slug = t; out.careersUrl = t ? 'https://' + host : '';
        if (d === 'recruitee.com' && segs[0] === 'o') out.role = roleFromSlug(segs[1]);
      } else if (d === 'linkedin.com') {
        var li = segs[0];
        if (li === 'company' && segs[1]) { out.kind = 'company'; out.slug = segs[1]; out.name = nameFromSlug(segs[1]); }
        else if (li === 'jobs' && segs[1] === 'view' && segs[2]) {
          var m = segs[2].match(/^(.*?)-at-(.+?)-\d{6,}$/i) || segs[2].match(/^(.*?)-at-(.+)$/i);
          if (m) { out.role = roleFromSlug(m[1] + '-x').replace(/ X$/, ''); out.name = nameFromSlug(m[2].replace(/-\d{6,}$/, '')); }
          else out.notes.push('This LinkedIn job link has no company or title in it. Type them in.');
        } else out.notes.push('A LinkedIn link names the company only on /company/ pages and some /jobs/view/ links.');
      } else if (d === 'indeed.com' || d === 'glassdoor.com' || d === 'wellfound.com') {
        if (d === 'wellfound.com' && segs[0] === 'company' && segs[1]) { out.slug = segs[1]; out.name = nameFromSlug(segs[1]); out.kind = 'company'; }
        else out.notes.push(board + ' links usually hide the company name until the page loads. Type it in.');
      }
      if (!out.name && out.slug) out.name = nameFromSlug(out.slug);
      if (out.role || (segs.length >= 2 && d !== 'linkedin.com' && !/^(company|embed)$/.test(segs[0])) || segs.indexOf('job') >= 0 || /\/jobs\/view\//.test(u.pathname)) out.jobUrl = out.url;
      if (!out.name && !out.notes.length) out.notes.push('The company name isn’t in this ' + board + ' link. Type it in.');
      if (!out.role && /\/(jobs?|j|o|details|view)\//.test(u.pathname) && !out.role) out.notes.push('The job title isn’t in this link (it ends in an ID).');
      return out;
    }

    // A company's own domain.
    var label = reg.label;
    out.name = nameFromLabel(label);
    out.slug = label;
    var stripped = nameFromLabel(label) !== nameFromSlug(label);
    out.website = stripped ? '' : 'https://' + reg.domain;
    var subCareers = (reg.sub || []).some(function (x) { return /^(careers?|jobs?|apply|talent|hire|join|recruiting)$/.test(x); });
    var pathCareers = jobish(u.pathname) || /gh_jid|lever-source|ashby_jid/.test(u.search);
    if (/(careers|jobs)$/.test(label) && label !== 'careers' && label !== 'jobs') out.careersUrl = u.origin;
    if (reg.domain.split('.').pop() === 'jobs') out.careersUrl = u.origin;
    if (subCareers) out.careersUrl = u.origin;
    else if (pathCareers && !out.careersUrl) {
      var ci = segs.findIndex(function (s) { return /^(careers?|jobs?)$/i.test(s); });
      out.careersUrl = ci >= 0 ? u.origin + '/' + segs.slice(0, ci + 1).join('/') : u.origin + '/careers';
    }
    if (pathCareers || subCareers) out.kind = 'company';
    // Role: the last readable path segment on a jobs-ish path.
    if (pathCareers || subCareers || segs.length > 1) {
      for (var i = segs.length - 1; i >= 0 && !out.role; i--) { if (!/^(careers?|jobs?|results|search|en|en-us|details|apply|view|positions?|openings?|about|company|applications)$/i.test(segs[i])) out.role = roleFromSlug(segs[i]); if (i < segs.length - 3) break; }
      if (out.role) { out.kind = 'job'; out.jobUrl = out.url; }
    }
    if (!out.role && out.kind === 'job') out.jobUrl = out.url;
    if (/^(jobs|careers)$/.test(label) || !out.name) { out.name = ''; out.notes.push('The company name isn’t in this link. Type it in.'); }
    if (out.kind === 'unknown') out.kind = 'company';
    return out;
  };

  /* ---------- Bullet hints ---------- */
  lib.STRONG_VERBS = ('accelerated achieved architected authored automated built cached chose collaborated compressed configured consolidated containerized contributed created cut debugged decreased deployed designed detected developed diagnosed doubled drove eliminated enabled engineered enhanced established evaluated expanded extended fixed generated hardened identified implemented improved increased instrumented integrated introduced investigated launched led maintained managed mentored merged migrated modeled monitored negotiated optimized orchestrated organized owned parallelized partnered patched piloted planned prevented profiled programmed prototyped published reduced refactored released replaced researched resolved restructured revamped scaled secured shipped simplified solved sped standardized streamlined strengthened surfaced taught tested trained translated triaged tripled tuned unified upgraded validated wrote analyzed adopted audited benchmarked bootstrapped coordinated delivered formalized founded mapped presented ran rebuilt rewrote spearheaded won').split(' ');
  var WEAK = /^(responsible for|worked on|worked with|helped|help with|assisted|assist|involved|participated|duties|tasked|was part of|part of|handled|did|used|utilized|various)\b/i;
  var VERB_SET = null;
  lib.bulletHints = function (text) {
    text = String(text || '').replace(/^\s*[-•*]\s*/, '').trim();
    var r = { empty: !text, words: text ? text.split(/\s+/).length : 0, hasNumber: /\d/.test(text), strongVerb: false, weakStart: false, hints: [] };
    if (!text) return r;
    if (!VERB_SET) { VERB_SET = {}; lib.STRONG_VERBS.forEach(function (v) { VERB_SET[v] = 1; }); }
    var first = text.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    r.strongVerb = !!VERB_SET[first];
    r.weakStart = WEAK.test(text);
    if (r.weakStart) r.hints.push({ tone: 'warn', text: 'Starts with a weak phrase. Lead with what you did: “Built…”, “Cut…”, “Shipped…”.' });
    else if (!r.strongVerb) r.hints.push({ tone: 'warn', text: 'Start with a strong past-tense verb (built, reduced, shipped, led).' });
    if (!r.hasNumber) r.hints.push({ tone: 'warn', text: 'No number. Add a size, speed, count, percent or time so the result is measurable.' });
    if (r.words < 8) r.hints.push({ tone: 'warn', text: 'Short (' + r.words + ' words). Add the measure and how you did it.' });
    else if (r.words > 30 || text.length > 210) r.hints.push({ tone: 'warn', text: 'Long (' + r.words + ' words). Aim for 12 to 28 so it stays at one or two lines.' });
    if (!r.hints.length) r.hints.push({ tone: 'ok', text: 'Strong verb, a number, good length.' });
    r.good = r.hints.length === 1 && r.hints[0].tone === 'ok';
    return r;
  };

  /* ---------- Keyword matcher ---------- */
  // [canonical, ...aliases]. An alias starting with '=' is case-sensitive (Go, C, R are also plain letters).
  var TERMS = ['Python', 'Java', ['JavaScript', 'js', 'ecmascript'], ['TypeScript', 'ts'], ['C++', 'cpp'], ['C', '=C'], ['C#', 'csharp'], ['Go', '=Go', 'golang', 'Golang'], 'Rust', 'Kotlin', 'Swift', 'SQL', 'Ruby', 'PHP', 'Scala', 'Bash', ['R', '=R'], 'MATLAB',
    'React', 'Angular', ['Vue', 'vue.js'], 'HTML', 'CSS', 'Redux', ['Next.js', 'nextjs'], 'Tailwind', ['Node.js', 'node', 'nodejs'], 'Express', 'Django', 'Flask', 'Spring Boot', 'Spring', 'FastAPI', ['REST', 'restful', 'rest api'], 'GraphQL', 'gRPC', 'microservices',
    ['PostgreSQL', 'postgres'], 'MySQL', ['MongoDB', 'mongo'], 'Redis', 'Kafka', 'Spark', 'Hadoop', 'Elasticsearch', 'DynamoDB', 'Snowflake', 'Airflow', 'pandas', 'NumPy',
    ['AWS', 'amazon web services', 'ec2', 's3', 'lambda'], 'Azure', ['GCP', 'google cloud'], 'Docker', ['Kubernetes', 'k8s'], 'Terraform', ['CI/CD', 'ci cd', 'continuous integration', 'continuous delivery'], 'Jenkins', 'GitHub Actions', 'Linux', 'Git',
    ['machine learning', 'ml'], 'PyTorch', 'TensorFlow', ['scikit-learn', 'sklearn'], ['NLP', 'natural language processing'], ['LLM', 'llms', 'large language models'],
    'data structures', 'algorithms', 'system design', ['object-oriented', 'oop', 'object oriented'], 'distributed systems', ['unit testing', 'unit tests', 'jest', 'pytest', 'junit'], 'Agile', 'Scrum', ['API', 'apis'], ['concurrency', 'multithreading', 'multi-threading', 'multithreaded'], 'debugging', 'Android', 'iOS', 'security', ['cloud', 'cloud computing'], 'databases', ['frontend', 'front-end', 'front end'], ['backend', 'back-end', 'back end'], ['full-stack', 'full stack', 'fullstack'], 'Figma', 'Jira', 'Postman'];
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }
  var COMPILED = TERMS.map(function (t) {
    var list = Array.isArray(t) ? t : [t], canon = list[0], cs = false, alts = [];
    list.forEach(function (a, i) {
      if (a.charAt(0) === '=') { cs = true; a = a.slice(1); alts.push(esc(a)); return; }
      if (list.some(function (x) { return x.charAt(0) === '='; }) && i === 0 && a.length <= 2) return; // 'Go' / 'C' / 'R' only as written
      alts.push(esc(a));
    });
    return { term: canon, re: new RegExp('(?<![A-Za-z0-9+#.])(?:' + alts.join('|') + ')(?![A-Za-z0-9+#]|\\.[A-Za-z0-9])', cs ? 'g' : 'gi') };
  });
  function count(re, s) { re.lastIndex = 0; var n = 0; while (re.exec(s)) n++; return n; }
  // Which skill terms does the job description ask for, and does the resume carry them?
  lib.keywordMatch = function (jd, resumeText) {
    var found = [], missing = [];
    COMPILED.forEach(function (c) {
      var n = count(c.re, String(jd || ''));
      if (!n) return;
      (count(c.re, String(resumeText || '')) ? found : missing).push({ term: c.term, count: n });
    });
    var by = function (a, b) { return b.count - a.count || (a.term < b.term ? -1 : 1); };
    found.sort(by); missing.sort(by);
    var total = found.length + missing.length;
    return { found: found, missing: missing, total: total, pct: total ? Math.round(100 * found.length / total) : 0 };
  };

  /* ---------- Resume plain text + helpers ---------- */
  lib.SECTIONS = ['education', 'experience', 'projects', 'skills', 'extras'];
  lib.order = function (r) { return r && r.eduFirst === false ? ['experience', 'projects', 'education', 'skills', 'extras'] : lib.SECTIONS; };
  lib.contactLine = function (c) {
    c = c || {};
    return [c.location, c.phone, c.email].concat((c.links || []).map(function (l) { return l && l.url ? l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : ''; })).filter(Boolean);
  };
  lib.bulletLines = function (b) { return String(b || '').split('\n').map(function (x) { return x.replace(/^\s*[-•*]\s*/, '').trim(); }).filter(Boolean); };
  lib.resumeToText = function (r) {
    r = r || {};
    var L = [], c = r.contact || {};
    if (c.name) L.push(c.name.toUpperCase());
    var cl = lib.contactLine(c); if (cl.length) L.push(cl.join(' | '));
    function entry(a, b, d) { L.push([a, b].filter(Boolean).join(', ') + (d ? '  (' + d + ')' : '')); }
    function bl(e) { lib.bulletLines(e.bullets).forEach(function (b) { L.push('- ' + b); }); }
    lib.order(r).forEach(function (k) {
      var items = r[k] || [];
      if (!items.length) return;
      L.push('', (k === 'extras' ? 'Additional' : k).toUpperCase());
      items.forEach(function (e) {
        if (k === 'education') { entry(e.school, e.degree, e.dates); var m = [e.location, e.gpa && 'GPA ' + e.gpa].filter(Boolean).join(' | '); if (m) L.push(m); bl(e); }
        else if (k === 'experience') { entry(e.role, e.org, e.dates); if (e.location) L.push(e.location); bl(e); }
        else if (k === 'projects') { entry(e.name, e.tech, e.dates); if (e.link) L.push(e.link); bl(e); }
        else if (k === 'skills') L.push((e.label ? e.label + ': ' : '') + (e.items || ''));
        else L.push((e.title ? e.title + ': ' : '') + (e.text || ''));
      });
    });
    return L.join('\n') + '\n';
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  else { window.OR = window.OR || {}; window.OR.rlib = lib; }
})();
