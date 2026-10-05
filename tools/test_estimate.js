// Run: node tools/test_estimate.js. Checks js/sd-estimate.js and the ring hashing in js/sd-ring.js (frames).
const assert = require('assert');
const E = require('../js/sd-estimate.js');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= (tol || 1e-6) * Math.max(1, Math.abs(b)), msg + ': got ' + a + ', want ' + b);
const row = (rows, id) => rows.find((r) => r.id === id).value;

// parse
assert.strictEqual(E.parse('10M'), 1e7);
assert.strictEqual(E.parse('2.5k'), 2500);
assert.strictEqual(E.parse('1e6'), 1e6);
assert.strictEqual(E.parse('1,000'), 1000);
assert.strictEqual(E.parse('3b'), 3e9);
assert.ok(Number.isNaN(E.parse('abc')));

// defaults: 10M DAU, 1 write, 10 reads, peak x2, 1 KB, 5 years, x3, hot 0.2, 1000 qps, 0.7 utilization
let r = E.compute({});
near(row(r, 'writesPerDay'), 10e6, 0, 'writes/day');
near(row(r, 'readsPerDay'), 100e6, 0, 'reads/day');
near(row(r, 'readWrite'), 10, 0, 'ratio');
near(row(r, 'avgWriteQps'), 10e6 / 86400, 1e-9, 'avg write qps');
near(row(r, 'avgReadQps'), 100e6 / 86400, 1e-9, 'avg read qps');
near(row(r, 'peakWriteQps'), 2 * 10e6 / 86400, 1e-9, 'peak write');
near(row(r, 'peakReadQps'), 2 * 100e6 / 86400, 1e-9, 'peak read');
near(row(r, 'storagePerDay'), 10e9, 0, 'storage/day = 10 GB');
near(row(r, 'storageRaw'), 10e9 * 365 * 5, 0, 'raw 5y = 18.25 TB');
near(row(r, 'storageReplicated'), 10e9 * 365 * 5 * 3, 0, 'replicated = 54.75 TB');
near(row(r, 'ingressAvg'), (10e6 / 86400) * 1000, 1e-9, 'ingress avg');
near(row(r, 'egressPeak'), 2 * (100e6 / 86400) * 1000, 1e-9, 'egress peak');
near(row(r, 'cacheBytes'), 0.2 * 100e6 * 1000, 0, 'cache = 20 GB');
assert.strictEqual(row(r, 'servers'), 4); // ceil((231.5 + 2314.8) / 700) = ceil(3.64)

// formatting
assert.strictEqual(E.bytes(18.25e12), '18.3 TB');
assert.strictEqual(E.bytes(999), '999 B');
assert.strictEqual(E.bytes(1500), '1.5 KB');
assert.strictEqual(E.format(1157.4, 'qps'), '1160 /s');
assert.strictEqual(E.format(100e6, 'count'), '100 million');
assert.strictEqual(E.format(10, 'ratio'), '10 : 1');

// string inputs and bad input fall back to defaults
r = E.compute({ dau: '2M', writesPerUser: 'oops', readsPerUser: '4' });
near(row(r, 'writesPerDay'), 2e6 * 1, 0, 'bad input uses default 1 write');
near(row(r, 'readsPerDay'), 8e6, 0, 'string input parsed');

// every row has a formula and text
E.compute({}).forEach((x) => { assert.ok(x.formula && x.text, x.id); });

// URL shortener case numbers (data/sd/url-shortener.js uses these inputs): 100M new URLs a month, 100:1 reads
const sd = { cases: [] };
global.window = { OR: { sd } }; global.OR = global.window.OR;
try { require('../data/sd/url-shortener.js'); } catch (e) { /* case file may not exist yet */ }
if (sd.cases.length) {
  const c = sd.cases[0], rows = E.compute(c.estimates.inputs);
  near(row(rows, 'avgWriteQps'), 3.3e6 / 86400, 1e-9, 'shortener writes ~38/s');
  near(row(rows, 'avgReadQps'), 330e6 / 86400, 1e-9, 'shortener reads ~3.8K/s');
  near(row(rows, 'storageRaw'), 3.3e6 * 500 * 365 * 5, 1e-9, 'shortener 5y raw ~3 TB');
  near(row(rows, 'cacheBytes'), 33e9, 1e-9, 'shortener cache 33 GB');
  assert.strictEqual(row(rows, 'servers'), 10); // ceil((114.6 + 11458) / 1200)
}

// consistent hashing: adding a server only moves keys to that server; ring frames are deterministic
global.window = { OR: { sd: {}, esc: String, player: null } };
global.OR = global.window.OR;
require('../js/sd-ring.js');
const ring = global.window.OR.sd.viz.ring;
const keys = []; for (let i = 0; i < 400; i++) keys.push('key:' + i);
[1, 4, 16].forEach((v) => {
  const F = ring.frames(keys, v), a = F[2].assign, b = F[3].assign;
  keys.forEach((k) => { if (a[k] !== b[k]) assert.strictEqual(b[k], 'D', 'keys only move to the new server'); });
  assert.ok(F[3].moved.length < keys.length * 0.6, 'adding D moves a minority of keys (v=' + v + ')');
});
console.log('estimate + ring tests passed');
