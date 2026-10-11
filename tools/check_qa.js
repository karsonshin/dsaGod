// Validates data/qa/*.js and RUNS every entry's Python (code.py + check) and JavaScript (code.js + checkJs).
// Usage: node tools/check_qa.js [file ...]     (no args = every file in data/qa)
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const root = path.join(__dirname, '..');
const files = process.argv.slice(2).length ? process.argv.slice(2).map(f => path.resolve(f)) : fs.readdirSync(path.join(root, 'data/qa')).filter(f => f.endsWith('.js')).map(f => path.join(root, 'data/qa', f));
const topicIds = new Set(); fs.readFileSync(path.join(root, 'data/curriculum.js'), 'utf8').replace(/\{ id: '([a-z0-9-]+)'/g, (_, i) => topicIds.add(i));
const problems = new Set(); fs.readFileSync(path.join(root, 'data/problems.js'), 'utf8').replace(/"lc": (\d+)/g, (_, n) => problems.add(n));
const sheets = new Set(['big-o', 'sorting', 'patterns', 'graphs', 'dp-catalog', 'languages', 'night-before', 'python', 'big-o-algorithms', 'data-structures', 'edge-cases', 'study-playbook', 'talk-track']);
const CATS = new Set(['Graphs: shortest paths','Graphs: search','Graphs: spanning trees and connectivity','Graphs: flow and matching','Graphs: trees','Graphs: other','Game and AI search','Optimization and heuristics','Machine learning basics','Strings: matching','Strings: structures','Strings: sequence alignment and compression','Number theory','Numerical methods','Combinatorics and randomness','Geometry','Data structures: advanced','Data structures: probabilistic','Range queries and offline techniques','DP optimizations','Searching and sorting: advanced','Puzzles and simulations']);
let bad = 0, count = 0; const ids = new Set();
const say = (f, id, m) => { bad++; console.log(`  ${path.basename(f)} ${id}: ${m}`); };
for (const f of files) {
  const OR = { qa: [] }, ctx = { window: { OR }, OR, console }; vm.createContext(ctx);
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { say(f, '-', 'does not load: ' + e.message); continue; }
  for (const e of OR.qa) {
    count++;
    if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) { say(f, e.id, 'bad id'); continue; }
    if (ids.has(e.id)) say(f, e.id, 'duplicate id'); ids.add(e.id);
    if (!e.title) say(f, e.id, 'missing title');
    if (!Array.isArray(e.q) || e.q.length < 4) say(f, e.id, 'needs at least 4 question phrasings');
    if (!e.a || e.a.length < 25) say(f, e.id, 'direct answer `a` missing or too short');
    if (e.a && e.a.length > 700) say(f, e.id, 'direct answer `a` is too long (keep it to a few sentences)');
    if (!e.tags || e.tags.length < 5) say(f, e.id, 'needs tags (search words)');
    if (e.cat && !CATS.has(e.cat)) say(f, e.id, 'unknown cat "' + e.cat + '"');
    if (path.basename(f).startsWith('cat-')) {   // algorithm catalog files carry more required fields
      if (!e.cat) say(f, e.id, 'catalog entry needs `cat`');
      if (!e.more || e.more.length < 60) say(f, e.id, 'catalog entry needs `more`');
      if (!e.cx) say(f, e.id, 'catalog entry needs `cx`');
      if (!e.code || !e.code.py) say(f, e.id, 'catalog entry needs code.py');
      if ((e.q || []).length < 6) say(f, e.id, 'catalog entry needs at least 6 phrasings');
    }
    for (const s of e.see || []) {
      const m = s.match(/^#\/(topic|cheatsheets|problem|system-design|cs|flashcards|behavioral)(?:\/([^/]+))?/);
      if (!m) { say(f, e.id, 'bad see link ' + s); continue; }
      if (m[1] === 'topic' && !topicIds.has(m[2])) say(f, e.id, 'unknown topic in ' + s);
      if (m[1] === 'cheatsheets' && m[2] && !sheets.has(m[2])) say(f, e.id, 'unknown cheat sheet in ' + s);
      if (m[1] === 'problem' && !problems.has(m[2])) say(f, e.id, 'problem ' + m[2] + ' is not in the problem bank (' + s + ')');
    }
    const code = e.code || {};
    if (code.py) {
      if (!e.check) { say(f, e.id, 'code.py needs a `check`'); continue; }
      const p = path.join(os.tmpdir(), `qa-${e.id}.py`); fs.writeFileSync(p, code.py + '\n\n' + e.check + '\nprint("ok")\n');
      const r = cp.spawnSync('python', ['-I', p], { encoding: 'utf8', timeout: 20000 });
      if (r.status !== 0 || !/ok/.test(r.stdout)) say(f, e.id, 'python failed: ' + (r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' '));
    }
    if (code.js) {
      if (!e.checkJs) { say(f, e.id, 'code.js needs a `checkJs`'); continue; }
      const p = path.join(os.tmpdir(), `qa-${e.id}.js`); fs.writeFileSync(p, 'const assert = require("assert");\n' + code.js + '\n\n' + e.checkJs + '\nconsole.log("ok");\n');
      const r = cp.spawnSync('node', [p], { encoding: 'utf8', timeout: 20000 });
      if (r.status !== 0 || !/ok/.test(r.stdout)) say(f, e.id, 'javascript failed: ' + (r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' '));
    }
    if (!code.py && !code.js && !e.more && e.a.length < 120) say(f, e.id, 'a concept answer with no code needs `more` detail');
  }
}
console.log(bad ? `${bad} problem(s) in ${count} entries` : `qa OK (${count} entries)`);
process.exit(bad ? 1 : 0);
