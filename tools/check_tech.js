// Validates data/tech/*.js (the Tech Pulse digest): structure, dates, URLs, lengths. It cannot check that a summary is true; the authoring agents read each article.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const files = process.argv.slice(2).length ? process.argv.slice(2).map(f => path.resolve(f)) : fs.readdirSync(path.join(root, 'data/tech')).filter(f => f.endsWith('.js')).map(f => path.join(root, 'data/tech', f));
const AREAS = new Set(['AI', 'Databases', 'Cloud and infrastructure', 'Languages and tools', 'Security', 'Hardware and chips', 'Industry']);
let bad = 0, n = 0; const ids = new Set(), urls = new Set(), today = new Date('2026-10-11');
const say = (f, id, m) => { bad++; console.log(`  ${path.basename(f)} ${id}: ${m}`); };
for (const f of files) {
  const OR = { tech: { items: [] } }, ctx = { window: { OR }, OR, console }; vm.createContext(ctx);
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { say(f, '-', 'does not load: ' + e.message); continue; }
  for (const e of OR.tech.items) {
    n++;
    if (!e.id || ids.has(e.id)) say(f, e.id, 'missing or duplicate id'); ids.add(e.id);
    if (!AREAS.has(e.area)) say(f, e.id, 'area must be one of ' + [...AREAS].join(' | '));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || '')) say(f, e.id, 'bad date');
    else { const d = new Date(e.date), age = (today - d) / 864e5; if (age < 0) say(f, e.id, 'date is in the future'); if (age > 75) say(f, e.id, 'older than 75 days (' + e.date + ')'); }
    if (!/^https:\/\/[^\s]+$/.test(e.url || '')) say(f, e.id, 'url must be https'); else { if (urls.has(e.url)) say(f, e.id, 'duplicate url'); urls.add(e.url); if (/[?&](utm_|ref=|fbclid)/.test(e.url)) say(f, e.id, 'remove tracking parameters from the url'); }
    for (const k of ['title', 'source', 'summary', 'why', 'interview']) if (!e[k] || String(e[k]).length < 12) say(f, e.id, 'missing ' + k);
    const words = String(e.summary || '').split(/\s+/).length;
    if (words < 25 || words > 130) say(f, e.id, 'summary should be 25-130 words (is ' + words + ')');
    if (!Array.isArray(e.terms) || e.terms.length < 2 || e.terms.some(t => !Array.isArray(t) || t.length !== 2 || String(t[1]).length < 10)) say(f, e.id, 'needs 2-4 [term, definition] pairs');
  }
}
console.log(bad ? `${bad} problem(s) in ${n} items` : `tech OK (${n} items)`);
process.exit(bad ? 1 : 0);
