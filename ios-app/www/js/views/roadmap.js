/* Offer Ready: Roadmap (#/roadmap). The prerequisite graph of every topic, laid out in columns by depth
   (a topic sits one column right of its deepest prerequisite), colored by mastery. Hover or focus a topic to
   light its prerequisites and what it unlocks. The recommended order is the plan's own order below the graph. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var W = 176, H = 34, GX = 64, GY = 10, PAD = 8, NS = 'http://www.w3.org/2000/svg';

  function layout() {
    var byId = {}, depth = {}, cols = [], pos = {};
    OR.curriculum.forEach(function (t) { byId[t.id] = t; });
    function d(id) {
      if (depth[id] != null) return depth[id];
      depth[id] = 0; // cycle guard; curriculum has none
      var m = -1; (byId[id].prereqs || []).forEach(function (p) { if (byId[p]) m = Math.max(m, d(p)); });
      return (depth[id] = m + 1);
    }
    OR.curriculum.forEach(function (t) { var c = d(t.id); (cols[c] = cols[c] || []).push(t); });
    cols.forEach(function (col, c) { col.forEach(function (t, r) { pos[t.id] = { x: PAD + c * (W + GX), y: PAD + r * (H + GY) }; }); });
    return { cols: cols, pos: pos, width: PAD * 2 + cols.length * (W + GX) - GX, height: PAD * 2 + Math.max.apply(null, cols.map(function (c) { return c.length; })) * (H + GY) - GY, byId: byId };
  }

  OR.views.roadmap = {
    title: function () { return 'Roadmap'; },
    render: function (main) {
      var L = layout(), next = {};
      OR.curriculum.forEach(function (t) { (t.prereqs || []).forEach(function (p) { (next[p] = next[p] || []).push(t.id); }); });

      var edges = '', nodes = '';
      OR.curriculum.forEach(function (t) {
        (t.prereqs || []).forEach(function (p) {
          var a = L.pos[p], b = L.pos[t.id]; if (!a || !b) return;
          var x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2;
          edges += '<path class="rm-edge" data-from="' + p + '" data-to="' + t.id + '" d="M' + x1 + ' ' + y1 + 'C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>';
        });
        var m = OR.plan.mastery(t.id), lv = OR.plan.masteryLevel(m.score), p = L.pos[t.id];
        nodes += '<a class="rm-node" href="#/topic/' + t.id + '" data-id="' + t.id + '" data-level="' + lv.id + '" transform="translate(' + p.x + ' ' + p.y + ')">' +
          '<title>' + esc(t.title + ' — ' + lv.label) + '</title><rect width="' + W + '" height="' + H + '" rx="5"/>' +
          '<rect class="rm-fill" width="' + Math.round(W * m.score) + '" height="3" y="' + (H - 3) + '"/>' +
          '<text x="10" y="' + (H / 2 + 4) + '">' + esc(t.title.length > 24 ? t.title.slice(0, 23) + '…' : t.title) + '</text></a>';
      });

      var order = [1, 2, 3, 4, 5].map(function (ph) {
        var rows = OR.curriculum.filter(function (t) { return t.phase === ph; }); if (!rows.length) return '';
        return '<li class="rm-phase"><h3>' + esc(OR.plan.phase(ph).name) + '</h3><ol>' + rows.map(function (t) {
          var lv = OR.plan.masteryLevel(OR.plan.mastery(t.id).score), pre = (t.prereqs || []).map(function (p) { return (L.byId[p] || {}).title; }).filter(Boolean);
          return '<li data-level="' + lv.id + '"><a href="#/topic/' + t.id + '">' + esc(t.title) + '</a>' + (lv.id === 'new' ? '' : '<span class="sr-only">, ' + lv.label.toLowerCase() + '</span>') +
            (pre.length ? '<span class="faint">needs ' + esc(pre.join(', ')) + '</span>' : '') + '</li>';
        }).join('') + '</ol></li>';
      }).join('');

      main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Roadmap</h1>' +
        '<p class="page-lede"><span class="rm-hint">Each topic sits right of what it builds on. Hover or focus one to see its prerequisites and what it unlocks. </span>Learn in order; each topic lists what it needs.</p></div>' +
        '<p class="lane-legend"><span><i data-level="new"></i>Not started</span><span><i data-level="learning"></i>Learning</span><span><i data-level="practicing"></i>Practicing</span><span><i data-level="mastered"></i>Mastered</span></p></div>' +
        '<div class="rm-scroll" tabindex="0" role="region" aria-label="Topic dependency graph, scrolls sideways"><svg class="rm-svg" width="' + L.width + '" height="' + L.height + '" viewBox="0 0 ' + L.width + ' ' + L.height + '">' + edges + nodes + '</svg></div>' +
        '<section class="section"><h2 class="section-title">Recommended order</h2><ul class="rm-order">' + order + '</ul></section></div>';

      var svg = OR.$('.rm-svg', main);
      function light(id) {
        var on = {}; on[id] = 1;
        (L.byId[id].prereqs || []).forEach(function (p) { on[p] = 1; });
        (next[id] || []).forEach(function (n) { on[n] = 1; });
        svg.classList.add('is-lit');
        OR.$$('.rm-node', svg).forEach(function (n) { n.classList.toggle('is-on', !!on[n.dataset.id]); });
        OR.$$('.rm-edge', svg).forEach(function (e) { e.classList.toggle('is-on', e.dataset.from === id || e.dataset.to === id); });
      }
      function clear() { svg.classList.remove('is-lit'); }
      svg.addEventListener('mouseover', function (e) { var n = e.target.closest('.rm-node'); if (n) light(n.dataset.id); });
      svg.addEventListener('focusin', function (e) { var n = e.target.closest('.rm-node'); if (n) light(n.dataset.id); });
      svg.addEventListener('mouseleave', clear);
      svg.addEventListener('focusout', clear);
    }
  };
})();
