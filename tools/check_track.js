// Validates a CS track file (data/cs/<id>.js): structure, quiz answers, card ids, section lengths.
const fs = require('fs'), path = require('path'), vm = require('vm');
let bad = 0;
for (const f of process.argv.slice(2).map(x => path.resolve(x))) {
  const OR = { cs: [] }, ctx = { window: { OR }, OR, console }; vm.createContext(ctx);
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { console.log('  does not load: ' + e.message); bad++; continue; }
  const say = m => { bad++; console.log(`  ${path.basename(f)}: ${m}`); };
  for (const t of OR.cs) {
    if (!t.id || !t.title || !t.blurb) say('needs id, title, blurb');
    if (!(t.sections || []).length || t.sections.length < 12) say('needs at least 12 sections (has ' + (t.sections || []).length + ')');
    const sid = new Set();
    (t.sections || []).forEach(s => {
      if (!s.id || sid.has(s.id)) say('bad or duplicate section id ' + s.id); sid.add(s.id);
      const w = String(s.body || '').split(/\s+/).length; if (w < 180) say(`section ${s.id} is thin (${w} words)`); if (w > 900) say(`section ${s.id} is very long (${w} words)`);
      if ((String(s.body).match(/```/g) || []).length % 2) say(`section ${s.id} has an unclosed code fence`);
    });
    if ((t.quiz || []).length < 10) say('needs at least 10 quiz questions');
    (t.quiz || []).forEach((q, i) => { const a = [].concat(q.answer); if (!q.q || !q.explain || (q.choices || []).length < 3 || a.some(x => !(x >= 0 && x < q.choices.length))) say(`quiz ${i} is malformed`); });
    const cid = new Set(); if ((t.cards || []).length < 15) say('needs at least 15 cards');
    (t.cards || []).forEach(c => { if (!c.id || cid.has(c.id) || !c.front || !c.back) say('bad card ' + c.id); cid.add(c.id); });
    console.log(`  ${t.id}: ${t.sections.length} sections, ${(t.quiz || []).length} quiz, ${(t.cards || []).length} cards, ~${t.sections.reduce((n, s) => n + String(s.body).split(/\s+/).length, 0)} words`);
  }
}
console.log(bad ? bad + ' problem(s)' : 'track OK'); process.exit(bad ? 1 : 0);
