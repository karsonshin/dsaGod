// Validates data/extras/<id>.js against data/topics/<id>.js and runs every drill's Python (code + hidden `check` asserts).
// Usage: node tools/check_extras.js [topic-id ...]    (no ids = every topic)
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const root = path.join(__dirname, '..');
const HARD = new Set('recursion monotonic linked-lists binary-search heaps trees tries backtracking graphs topo-sort union-find shortest-paths mst greedy intervals dp-1d dp-2d knapsack string-dp lis interval-dp tree-dp bitmask-dp design-ds segment-tree fenwick string-algos advanced-graphs bits math'.split(' '));
const STRUCT = new Set('language arrays-hashing hashing-internals stacks queues linked-lists heaps trees tries matrix union-find segment-tree fenwick design-ds monotonic'.split(' '));
function load(file) {
  const OR = { topics: [], extras: {}, flashcards: [], cheatsheets: [], sd: {} }, ctx = { window: { OR }, OR, console };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, 'utf8'), ctx); return ctx.window.OR;
}
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(root, 'data/extras')).map(f => f.replace(/\.js$/, ''));
let bad = 0, empty = 0;
const say = (id, m) => { bad++; console.log(`  ${id}: ${m}`); };
for (const id of ids) {
  const ex = load(path.join(root, 'data/extras', id + '.js')).extras[id];
  if (!ex) { empty++; console.log(`  ${id}: (no extras yet)`); continue; }
  const topic = load(path.join(root, 'data/topics', id + '.js')).topics.find(t => t.id === id) || {};
  const p = ex.primer || {};
  if (!['structure', 'technique'].includes(p.kind)) say(id, 'primer.kind must be structure or technique');
  ['what', 'does', 'impl', 'possibilities'].forEach(k => { if (!p[k] || p[k].length < 40) say(id, 'primer.' + k + ' missing or too short'); });
  if (STRUCT.has(id) && p.kind !== 'structure') say(id, 'a data-structure topic should use kind "structure"');
  if ((ex.think || []).length < 4) say(id, 'think needs at least 4 questions');
  (ex.think || []).forEach((t, i) => { if (!t.q || !t.a || t.a.length < 60) say(id, `think[${i}] needs q and a real answer`); });
  if (HARD.has(id) && (ex.breakdown || []).length < 5) say(id, 'breakdown needs at least 5 steps for a hard topic');
  (ex.breakdown || []).forEach((b, i) => { if (!b.title || !b.body || b.body.length < 80) say(id, `breakdown[${i}] too thin`); });
  if ((ex.drills || []).length < 3) say(id, 'drills needs at least 3');
  (ex.drills || []).forEach((d, i) => {
    if (!d.title || !d.q || !d.how || d.how.length < 200 || !d.hint) say(id, `drills[${i}] needs title, q, hint and a real how (200+ chars)`);
    if (!d.code || !d.code.py) { say(id, `drills[${i}] needs code.py`); return; }
    if (!d.check) { say(id, `drills[${i}] needs a hidden check (python asserts)`); return; }
    const f = path.join(os.tmpdir(), `drill-${id}-${i}.py`); fs.writeFileSync(f, d.code.py + '\n\n' + d.check + '\nprint("ok")\n');
    const r = cp.spawnSync('python', [f], { encoding: 'utf8', timeout: 20000 });
    if (r.status !== 0 || !/ok/.test(r.stdout)) say(id, `drills[${i}] "${d.title}" failed: ${(r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' ')}`);
  });
  const lcs = (topic.practice || []).map(q => String(q.lc)), how = ex.how || {};
  const missing = lcs.filter(l => !how[l] || how[l].length < 150);
  if (missing.length) say(id, `how missing or thin for practice problems: ${missing.join(', ')}`);
  Object.keys(how).forEach(l => { if (!lcs.includes(l)) say(id, `how has ${l}, which is not in this topic's practice set`); });
}
console.log(bad || empty ? `${bad} problem(s), ${empty} topic(s) without extras` : 'extras OK');
process.exit(bad ? 1 : 0);
