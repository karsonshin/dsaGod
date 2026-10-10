/* Assertions for js/resume-lib.js: URL autofill parser, keyword matcher, bullet hints, plain-text export.
   Run: node tools/test_autofill.js */
'use strict';
const assert = require('assert');
const lib = require('../js/resume-lib.js');
let n = 0;
function url(input, want) {
  const r = lib.parseUrl(input);
  Object.keys(want).forEach(function (k) { assert.strictEqual(r[k], want[k], input + ' -> ' + k + ': got ' + JSON.stringify(r[k]) + ', want ' + JSON.stringify(want[k])); });
  n++;
}

/* ----- URL shapes ----- */
url('https://boards.greenhouse.io/stripe/jobs/12345', { ok: true, name: 'Stripe', slug: 'stripe', source: 'greenhouse', careersUrl: 'https://boards.greenhouse.io/stripe', role: '' });
url('https://job-boards.greenhouse.io/anthropic/jobs/4020159008?utm_source=x', { name: 'Anthropic', careersUrl: 'https://boards.greenhouse.io/anthropic', jobUrl: 'https://job-boards.greenhouse.io/anthropic/jobs/4020159008' });
url('https://boards.greenhouse.io/embed/job_app?for=airbnb&token=99', { name: 'Airbnb', slug: 'airbnb' });
url('https://jobs.lever.co/netflix/0a1b2c3d-1111-2222-3333-444455556666', { name: 'Netflix', source: 'lever', careersUrl: 'https://jobs.lever.co/netflix', role: '' });
url('https://jobs.lever.co/palantir', { name: 'Palantir', jobUrl: '' });
url('https://jobs.lever.co/acme/software-engineer-new-grad', { name: 'Acme', role: 'Software Engineer New Grad' });
url('https://jobs.ashbyhq.com/ramp/9f8e7d6c-1234-5678-9abc-def012345678', { name: 'Ramp', source: 'ashby', careersUrl: 'https://jobs.ashbyhq.com/ramp' });
url('https://acme.wd5.myworkdayjobs.com/en-US/External/job/New-York/Software-Engineer-New-Grad_R1234', { name: 'Acme', source: 'workday', role: 'Software Engineer New Grad', careersUrl: 'https://acme.wd5.myworkdayjobs.com/External' });
url('https://www.linkedin.com/jobs/view/software-engineer-new-grad-at-google-3812345678', { name: 'Google', role: 'Software Engineer New Grad', source: 'linkedin' });
url('https://www.linkedin.com/jobs/view/3812345678', { name: '', role: '', source: 'linkedin' });
url('https://www.linkedin.com/company/jane-street/', { name: 'Jane Street', kind: 'company', slug: 'jane-street' });
url('https://careers.google.com/jobs/results/123-software-engineer-intern/', { name: 'Google', role: 'Software Engineer Intern', careersUrl: 'https://careers.google.com' });
url('https://www.metacareers.com/jobs/1234', { name: 'Meta', careersUrl: 'https://www.metacareers.com' });
url('https://amazon.jobs/en/jobs/2500123/software-development-engineer-new-grad-2026', { name: 'Amazon', role: 'Software Development Engineer New Grad 2026' });
url('https://jobs.apple.com/en-us/details/200012345/software-engineer', { name: 'Apple', role: 'Software Engineer', website: 'https://apple.com' });
url('https://www.stripe.com/jobs/search?gh_jid=123', { name: 'Stripe', careersUrl: 'https://www.stripe.com/jobs' });
url('stripe.com', { ok: true, name: 'Stripe', website: 'https://stripe.com', careersUrl: '' });
url('https://apply.workable.com/acme-corp/j/ABC123DEF4/', { name: 'Acme Corp', source: 'workable' });
url('https://acme.bamboohr.com/careers/12', { name: 'Acme', source: 'bamboohr' });
url('https://jobs.smartrecruiters.com/Acme/743999-software-engineer', { name: 'Acme', role: 'Software Engineer', source: 'smartrecruiters' });
url('https://acme.recruitee.com/o/backend-engineer-intern', { name: 'Acme', role: 'Backend Engineer Intern' });
url('https://www.example.co.uk/careers', { name: 'Example', website: 'https://example.co.uk', careersUrl: 'https://www.example.co.uk/careers' });
url('https://openai.com/careers/software-engineer-new-grad', { name: 'Openai', role: 'Software Engineer New Grad', careersUrl: 'https://openai.com/careers' });
url('https://ibm.com', { name: 'IBM' });
url('https://www.indeed.com/viewjob?jk=abc123', { ok: true, name: '', source: 'indeed' });
url('https://www.google.com/about/careers/applications/jobs/results/123456789-software-engineer-early-career', { name: 'Google', role: 'Software Engineer Early Career' });

/* ----- Not parseable ----- */
['', 'not a url', 'localhost', 'http://10.0.0.1/jobs', 'javascript:alert(1)', 'ftp://example.com', 'https://'].forEach(function (s) { assert.strictEqual(lib.parseUrl(s).ok, false, 'should reject ' + s); n++; });
assert.strictEqual(lib.parseUrl(null).ok, false);

/* ----- Keyword matcher ----- */
const km = lib.keywordMatch('We use Python, C++, Go (golang), React and AWS. Kubernetes a plus. Strong communicators.', 'Skills: python, react, C++');
assert.deepStrictEqual(km.found.map(x => x.term).sort(), ['C++', 'Python', 'React']); n++;
assert.deepStrictEqual(km.missing.map(x => x.term).sort(), ['AWS', 'Go', 'Kubernetes']); n++;
assert.strictEqual(km.pct, 50); n++;
assert.strictEqual(lib.keywordMatch('Must love going places and Cats', 'x').total, 0, '"going" must not match Go'); n++;
assert.strictEqual(lib.keywordMatch('We use C#', 'C++ Java').missing[0].term, 'C#'); n++;
assert.strictEqual(lib.keywordMatch('Node.js and node', 'nodejs').missing.length, 0); n++;
assert.strictEqual(lib.keywordMatch('', '').total, 0); n++;

/* ----- Bullet hints ----- */
assert.ok(lib.bulletHints('Reduced p95 API latency from 480 ms to 120 ms by adding a Redis cache in front of three hot endpoints').good); n++;
assert.ok(lib.bulletHints('Responsible for the backend').weakStart); n++;
assert.ok(!lib.bulletHints('Built a login page').hasNumber); n++;
assert.ok(lib.bulletHints(Array(45).fill('word').join(' ')).hints.some(h => /Long/.test(h.text))); n++;
assert.ok(lib.bulletHints('').empty); n++;
assert.ok(lib.bulletHints('- Cut build time 40% by caching dependencies in CI across 12 repos').strongVerb); n++;

/* ----- Plain text ----- */
const txt = lib.resumeToText({ contact: { name: 'Ada Lovelace', email: 'ada@x.dev', links: [{ label: 'GitHub', url: 'https://github.com/ada' }] },
  education: [{ school: 'State University', degree: 'BS Computer Science', dates: '2023 to 2027', gpa: '3.8' }],
  experience: [{ role: 'Software Engineer Intern', org: 'Acme', bullets: '- Cut build time 40%\nShipped a thing' }], skills: [{ label: 'Languages', items: 'Python, Java' }] });
assert.ok(/^ADA LOVELACE\nada@x.dev \| github.com\/ada/.test(txt)); n++;
assert.ok(txt.indexOf('EDUCATION') < txt.indexOf('EXPERIENCE')); n++;
assert.ok(txt.indexOf('- Shipped a thing') > 0); n++;
assert.ok(lib.resumeToText({ eduFirst: false, education: [{ school: 'U' }], experience: [{ role: 'R' }] }).indexOf('EXPERIENCE') < 40); n++;

console.log('test_autofill: ' + n + ' assertions passed');
