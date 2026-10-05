// Run: node tools/test_comp.js. Hand-computed cases for OR.career.comp.
var assert = require('assert');
global.window = {}; var C = require('../data/career.js');
var close = function (a, b) { assert(Math.abs(a - b) < 1e-6, a + ' != ' + b); };

// 1. Even vesting, no bonus/sign/refresh/growth: 100 base + 200 grant => 150 per year, 600 total.
var r = C.comp({ base: 100, equity: 200, schedule: 'even' });
r.years.forEach(function (y) { close(y.equity, 50); close(y.total, 150); }); close(r.total, 600); close(r.avg, 150);

// 2. Back-loaded 5/15/40/40 on 400: 20, 60, 160, 160. Bonus 10% of 200 = 20, sign-on 30 in year 1 only.
r = C.comp({ base: 200, bonusPct: 10, signOn: 30, equity: 400, schedule: 'back' });
[20, 60, 160, 160].forEach(function (e, i) { close(r.years[i].equity, e); });
close(r.years[0].total, 200 + 20 + 30 + 20); close(r.years[1].total, 200 + 20 + 60);
close(r.total, 4 * 220 + 30 + 400);

// 3. Front-loaded 33/33/22/12 on 100: 33, 33, 22, 12 sums to 100.
r = C.comp({ equity: 100, schedule: 'front' });
[33, 33, 22, 12].forEach(function (e, i) { close(r.years[i].equity, e); }); close(r.total, 100);

// 4. Growth 10%, even, grant 400 (100 a year): 100, 110, 121, 133.1.
r = C.comp({ equity: 400, growthPct: 10 });
[100, 110, 121, 133.1].forEach(function (e, i) { close(r.years[i].equity, e); });

// 5. Refresher 50% of a 400 grant = 200, even (50 a year), granted at start of years 2, 3, 4.
//    Year 2: 100 + 50; year 3: 100 + 50 + 50; year 4: 100 + 50 + 50 + 50; year 1: 100.
r = C.comp({ equity: 400, refreshPct: 50 });
[100, 150, 200, 250].forEach(function (e, i) { close(r.years[i].equity, e); }); close(r.total, 700);

// 6. Garbage in is zeros, unknown schedule falls back to even.
r = C.comp({ base: 'abc', equity: '', schedule: 'nope' }); close(r.total, 0);
close(C.comp({ equity: 100, schedule: 'nope' }).years[0].equity, 25);
close(C.comp().total, 0);
console.log('comp: all assertions passed');
