/* Offer Ready: consistent hashing ring visualizer (used by the "Consistent hashing" fundamentals page).
   OR.sd.viz.ring.mount(host) builds the frames and plays them with OR.player. The ring has 360 positions (degrees).
   Story: three servers, keys land on the next server clockwise, then server D joins and server B leaves.
   Each frame compares against plain "hash mod N" so the saving is visible. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, SIZE = 360, NS = ['A', 'B', 'C', 'D'];
  OR.sd = OR.sd || {}; OR.sd.viz = OR.sd.viz || {};

  function hash(s) { // FNV-1a, 32-bit, folded onto the ring
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; // avalanche so similar names spread out
    return (h >>> 0) % SIZE;
  }
  function points(servers, vnodes) {
    var pts = [];
    servers.forEach(function (s) { for (var v = 0; v < vnodes; v++) pts.push({ s: s, v: v, at: hash(s + '#' + v) }); });
    return pts.sort(function (a, b) { return a.at - b.at || (a.s < b.s ? -1 : 1); });
  }
  function owner(pts, key) { // first point at or after the key, wrapping past 360
    var p = hash(key);
    for (var i = 0; i < pts.length; i++) if (pts[i].at >= p) return pts[i].s;
    return pts[0].s;
  }
  function counts(assign, servers) {
    var c = {}; servers.forEach(function (s) { c[s] = 0; });
    Object.keys(assign).forEach(function (k) { if (c[assign[k]] != null) c[assign[k]]++; });
    return servers.map(function (s) { return s + ' holds ' + c[s]; }).join(', ');
  }
  function mod(keys, servers) { var m = {}; keys.forEach(function (k) { m[k] = servers[hash(k) % servers.length]; }); return m; }
  function movedCount(a, b) { return Object.keys(a).filter(function (k) { return a[k] !== b[k]; }).length; }

  // Returns frames [{ step, note, servers, assign, moved }].
  function frames(keys, vnodes) {
    var S1 = ['A', 'B', 'C'], S2 = ['A', 'B', 'C', 'D'], S3 = ['A', 'C', 'D'];
    var a1 = {}, a2 = {}, a3 = {}, p1 = points(S1, vnodes), p2 = points(S2, vnodes), p3 = points(S3, vnodes);
    keys.forEach(function (k) { a1[k] = owner(p1, k); a2[k] = owner(p2, k); a3[k] = owner(p3, k); });
    var n = keys.length;
    var moved2 = keys.filter(function (k) { return a1[k] !== a2[k]; }), moved3 = keys.filter(function (k) { return a2[k] !== a3[k]; });
    return [
      { step: 'ring', servers: S1, assign: null, moved: [], note: 'Hash each server name onto a ring of ' + SIZE + ' positions (' + vnodes + ' point' + (vnodes > 1 ? 's' : '') + ' per server).' },
      { step: 'keys', servers: S1, assign: null, moved: [], note: 'Hash each key onto the same ring. A key belongs to the first server point clockwise from it.' },
      { step: 'assign', servers: S1, assign: a1, moved: [], note: n + ' keys placed: ' + counts(a1, S1) + '.' },
      { step: 'add', servers: S2, assign: a2, moved: moved2, note: 'Server D joins. ' + moved2.length + ' of ' + n + ' keys move, all of them to D. Plain hash mod N would move ' + movedCount(mod(keys, S1), mod(keys, S2)) + '.' },
      { step: 'remove', servers: S3, assign: a3, moved: moved3, note: 'Server B leaves. Its ' + moved3.length + ' of ' + n + ' keys move, each to the next server clockwise. Plain hash mod N would move ' + movedCount(mod(keys, S2), mod(keys, S3)) + '. Now ' + counts(a3, S3) + '.' }
    ];
  }

  function paint(stage, f, vnodes) {
    var R = 110, C = 150, pts = points(f.servers, vnodes);
    function xy(deg, r) { var a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
    var cls = function (s) { return 'rg-s' + NS.indexOf(s); };
    var html = '<svg class="rg-svg" viewBox="0 0 300 300" role="img" aria-label="Hash ring with ' + f.servers.join(', ') + '"><circle class="rg-ring" cx="' + C + '" cy="' + C + '" r="' + R + '"/>';
    html += '<text class="rg-zero" x="' + C + '" y="' + (C - R - 22) + '" text-anchor="middle">0 / 360</text>';
    if (f.assign) Object.keys(f.assign).forEach(function (k) {
      var o = pts.filter(function (p) { return p.s === f.assign[k]; }), p = hash(k), target = o.filter(function (x) { return x.at >= p; })[0] || pts[0];
      var a = xy(p, R - 24), b = xy(target.at, R);
      html += '<path class="rg-link ' + cls(f.assign[k]) + (f.moved.indexOf(k) >= 0 ? ' is-moved' : '') + '" d="M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1] + '"/>';
    });
    pts.forEach(function (p) {
      var c = xy(p.at, R), t = xy(p.at, R + 17);
      html += '<g class="rg-pt ' + cls(p.s) + '"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="6"/><text x="' + t[0] + '" y="' + (t[1] + 4) + '" text-anchor="middle">' + p.s + '</text></g>';
    });
    var keys = stage._keys;
    keys.forEach(function (k) {
      var p = xy(hash(k), R - 24), who = f.assign && f.assign[k], mv = f.moved.indexOf(k) >= 0;
      html += '<g class="rg-key ' + (who ? cls(who) : '') + (mv ? ' is-moved' : '') + '"><rect x="' + (p[0] - 4) + '" y="' + (p[1] - 4) + '" width="8" height="8" rx="1.5"/></g>';
    });
    stage.innerHTML = html + '</svg><ul class="rg-keys faint">' + keys.map(function (k) {
      var who = f.assign && f.assign[k];
      return '<li' + (f.moved.indexOf(k) >= 0 ? ' class="is-moved"' : '') + '><code>' + esc(k) + '</code> at ' + hash(k) + (who ? ' &rarr; <b class="' + cls(who) + '">' + who + '</b>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  OR.sd.viz.ring = {
    hash: hash, frames: frames, owner: owner, points: points,
    mount: function (host) {
      var keys = ['user:17', 'user:42', 'cart:9', 'img:301', 'feed:8', 'sess:5', 'order:77', 'user:99'], vnodes = 1, pl = null;
      host.innerHTML = '<div class="rg"><div class="rg-ctl"><label class="field"><span class="field-label">Keys (comma separated, up to 12)</span><input class="input rg-in" type="text" value="' + esc(keys.join(', ')) + '" spellcheck="false" autocomplete="off"></label>' +
        '<label class="field"><span class="field-label">Points per server</span><select class="select rg-vn"><option value="1">1</option><option value="4">4</option><option value="16">16</option></select></label></div><div class="rg-host"></div></div>';
      var ph = OR.$('.rg-host', host), input = OR.$('.rg-in', host), sel = OR.$('.rg-vn', host);
      function build() {
        if (pl) pl.destroy();
        var F = frames(keys, vnodes);
        pl = OR.player(ph, {
          frames: F, label: 'Consistent hashing ring',
          steps: { ring: { label: 'Servers on the ring.' }, keys: { label: 'Keys on the ring.' }, assign: { label: 'Keys find a server.', tone: 'accent' }, add: { label: 'Add server D.', tone: 'ok' }, remove: { label: 'Remove server B.', tone: 'hard' } },
          paint: function (stage, f) { stage._keys = keys; paint(stage, f, vnodes); }
        });
      }
      input.addEventListener('change', function () {
        var k = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, 12);
        if (!k.length) { input.value = keys.join(', '); return; }
        keys = k; input.value = keys.join(', '); build();
      });
      sel.addEventListener('change', function () { vnodes = +sel.value; build(); });
      build();
      return { destroy: function () { if (pl) pl.destroy(); }, frames: frames };
    }
  };
})();
