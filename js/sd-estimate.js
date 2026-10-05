/* Offer Ready: back-of-envelope estimator for the system design module.
   Pure math, no DOM, so tools/test_estimate.js can load it in node. In the browser it becomes OR.sd.estimate.
   Units are decimal (1 KB = 1,000 B, 1 GB = 10^9 B) because interview estimates round to powers of ten;
   a year is 365 days and a day is 86,400 s. Every row carries its formula with the numbers filled in. */
(function (root) {
  'use strict';
  var DAY = 86400, YEAR_DAYS = 365;

  // Inputs, in the order the calculator shows them. unit: how the field is labelled and parsed.
  var FIELDS = [
    { id: 'dau', label: 'Daily active users', unit: 'users', def: 10e6, hint: 'Users who touch the system on an average day.' },
    { id: 'writesPerUser', label: 'Writes per user per day', unit: 'writes', def: 1, hint: 'Actions that create or change stored data.' },
    { id: 'readsPerUser', label: 'Reads per user per day', unit: 'reads', def: 10, hint: 'Page views, feed loads, lookups.' },
    { id: 'peakFactor', label: 'Peak factor', unit: 'x average', def: 2, hint: 'Peak QPS divided by average QPS. 2 to 3 is a common starting point; spiky products use 5 or more.' },
    { id: 'bytesPerWrite', label: 'Bytes stored per write', unit: 'bytes', def: 1000, hint: 'Size of one stored record, including keys and metadata (before replication).' },
    { id: 'bytesPerRead', label: 'Bytes returned per read', unit: 'bytes', def: 1000, hint: 'Average response payload.' },
    { id: 'years', label: 'Retention', unit: 'years', def: 5, hint: 'How long data is kept.' },
    { id: 'replication', label: 'Replication factor', unit: 'copies', def: 3, hint: 'Copies of each record across nodes or zones.' },
    { id: 'hotFraction', label: 'Cache share (80/20 rule)', unit: 'fraction', def: 0.2, hint: '0.2 means cache the hottest 20% of one day of read traffic.' },
    { id: 'serverQps', label: 'QPS one server handles', unit: 'req/s', def: 1000, hint: 'Depends on the work per request; measure or assume.' },
    { id: 'utilization', label: 'Target server utilization', unit: 'fraction', def: 0.7, hint: 'Headroom for spikes and failures; 0.5 to 0.7 is typical.' }
  ];

  function defaults() { var o = {}; FIELDS.forEach(function (f) { o[f.id] = f.def; }); return o; }

  // '10M', '2.5k', '1e6', '1,000' -> number; NaN when it isn't one.
  function parse(s) {
    if (typeof s === 'number') return s;
    var m = String(s == null ? '' : s).trim().replace(/,/g, '').match(/^(-?\d*\.?\d+(?:e[+-]?\d+)?)\s*([kmbt])?$/i);
    if (!m) return NaN;
    var mult = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[(m[2] || '').toLowerCase()] || 1;
    return parseFloat(m[1]) * mult;
  }

  function sig(n, d) { // d significant digits, no trailing zeros
    return String(parseFloat(Number(n).toPrecision(d)));
  }
  function count(n) {
    var a = Math.abs(n);
    if (a >= 1e12) return sig(n / 1e12, 3) + ' trillion';
    if (a >= 1e9) return sig(n / 1e9, 3) + ' billion';
    if (a >= 1e6) return sig(n / 1e6, 3) + ' million';
    if (a >= 1e4) return sig(n / 1e3, 3) + ' thousand';
    if (a >= 100) return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sig(n, 3);
  }
  var BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  function bytes(n) {
    var i = 0, a = Math.abs(n);
    while (a >= 1000 && i < BYTE_UNITS.length - 1) { a /= 1000; i++; }
    return sig(n < 0 ? -a : a, 3) + ' ' + BYTE_UNITS[i];
  }
  function format(v, unit) {
    if (!isFinite(v)) return '-';
    if (unit === 'bytes') return bytes(v);
    if (unit === 'bytesPerSec') return bytes(v) + '/s';
    if (unit === 'qps') return sig(v, 3) + ' /s';
    if (unit === 'ratio') return sig(v, 3) + ' : 1';
    return count(v);
  }

  // Returns ordered rows: { id, group, label, formula, value, unit, text }.
  function compute(input) {
    var d = defaults(), i = {};
    FIELDS.forEach(function (f) { var v = input && input[f.id] != null ? parse(input[f.id]) : NaN; i[f.id] = isFinite(v) ? v : d[f.id]; });
    var rows = [];
    function add(id, group, label, formula, value, unit) { rows.push({ id: id, group: group, label: label, formula: formula, value: value, unit: unit, text: format(value, unit) }); }
    var n = function (v) { return format(v, 'count').replace(' thousand', 'K').replace(' million', 'M').replace(' billion', 'B').replace(' trillion', 'T'); };

    var writesDay = i.dau * i.writesPerUser, readsDay = i.dau * i.readsPerUser;
    var wQps = writesDay / DAY, rQps = readsDay / DAY, wPeak = wQps * i.peakFactor, rPeak = rQps * i.peakFactor, peak = wPeak + rPeak;
    add('writesPerDay', 'Traffic', 'Writes per day', n(i.dau) + ' users x ' + n(i.writesPerUser) + ' writes', writesDay, 'count');
    add('readsPerDay', 'Traffic', 'Reads per day', n(i.dau) + ' users x ' + n(i.readsPerUser) + ' reads', readsDay, 'count');
    add('readWrite', 'Traffic', 'Read to write ratio', n(readsDay) + ' / ' + n(writesDay), writesDay ? readsDay / writesDay : Infinity, 'ratio');
    add('avgWriteQps', 'Traffic', 'Average write QPS', n(writesDay) + ' / 86,400 s', wQps, 'qps');
    add('avgReadQps', 'Traffic', 'Average read QPS', n(readsDay) + ' / 86,400 s', rQps, 'qps');
    add('peakWriteQps', 'Traffic', 'Peak write QPS', sig(wQps, 3) + ' x ' + i.peakFactor + ' peak', wPeak, 'qps');
    add('peakReadQps', 'Traffic', 'Peak read QPS', sig(rQps, 3) + ' x ' + i.peakFactor + ' peak', rPeak, 'qps');

    var perDay = writesDay * i.bytesPerWrite, raw = perDay * YEAR_DAYS * i.years, rep = raw * i.replication;
    add('storagePerDay', 'Storage', 'New data per day', n(writesDay) + ' writes x ' + bytes(i.bytesPerWrite), perDay, 'bytes');
    add('storageRaw', 'Storage', 'Data over ' + i.years + ' years', bytes(perDay) + ' x 365 x ' + i.years, raw, 'bytes');
    add('storageReplicated', 'Storage', 'With replication', bytes(raw) + ' x ' + i.replication + ' copies', rep, 'bytes');

    add('ingressAvg', 'Bandwidth', 'Ingress, average', sig(wQps, 3) + ' writes/s x ' + bytes(i.bytesPerWrite), wQps * i.bytesPerWrite, 'bytesPerSec');
    add('ingressPeak', 'Bandwidth', 'Ingress, peak', sig(wPeak, 3) + ' writes/s x ' + bytes(i.bytesPerWrite), wPeak * i.bytesPerWrite, 'bytesPerSec');
    add('egressAvg', 'Bandwidth', 'Egress, average', sig(rQps, 3) + ' reads/s x ' + bytes(i.bytesPerRead), rQps * i.bytesPerRead, 'bytesPerSec');
    add('egressPeak', 'Bandwidth', 'Egress, peak', sig(rPeak, 3) + ' reads/s x ' + bytes(i.bytesPerRead), rPeak * i.bytesPerRead, 'bytesPerSec');

    var cache = i.hotFraction * readsDay * i.bytesPerRead;
    add('cacheBytes', 'Cache', 'Cache size', i.hotFraction + ' x ' + n(readsDay) + ' reads x ' + bytes(i.bytesPerRead), cache, 'bytes');

    var servers = Math.ceil(peak / (i.serverQps * i.utilization));
    add('servers', 'Servers', 'App servers needed', 'ceil(' + sig(peak, 3) + ' peak QPS / (' + n(i.serverQps) + ' x ' + i.utilization + '))', servers, 'count');
    return rows;
  }

  var api = { FIELDS: FIELDS, defaults: defaults, parse: parse, compute: compute, format: format, bytes: bytes, count: count, DAY: DAY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.OR) { root.OR.sd = root.OR.sd || {}; root.OR.sd.estimate = api; }
})(typeof window !== 'undefined' ? window : null);
