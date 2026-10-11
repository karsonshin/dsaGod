/* Offer Ready: Visualizers (#/viz, #/viz/:topic). Index of every topic's visualizer; each opens on its own, the
   same one the lesson's "See it run" shows (without the template-line sync, which lives in the lesson). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  // Visualizers that are not the main one of any topic: id -> [title, lesson link, blurb]
  var EXTRA = { astar: ['A* search vs Dijkstra', '#/topic/shortest-paths', 'Same shortest path, far fewer cells looked at. Compare A*, Dijkstra and greedy best-first on a grid you edit.'] };
  function vizOf(t) { var l = OR.plan.topic(t.id); return l && l.viz && OR.viz[l.viz] ? l.viz : null; }

  OR.views.viz = {
    title: function (ctx) { var m = ctx.params.id && OR.topicMeta(ctx.params.id); return m ? m.title + ' visualizer' : 'Visualizers'; },
    render: function (main, ctx) {
      var id = ctx.params.id, m = id && OR.topicMeta(id);
      if (id && EXTRA[id] && OR.viz[id]) {
        main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">' + esc(EXTRA[id][0]) + '</h1><p class="page-lede"><a href="#/viz">All visualizers</a> · <a href="' + EXTRA[id][1] + '">Read the lesson</a> · <a href="#/algorithms">Algorithm catalog</a></p></div></div><div class="tp-viz" id="viz-host"></div></div>';
        var ev = OR.viz[id].mount(OR.$('#viz-host', main), { mark: function () {} });
        return function () { if (ev && ev.destroy) ev.destroy(); };
      }
      if (m && vizOf(m)) {
        main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">' + esc(m.title) + '</h1><p class="page-lede"><a href="#/viz">All visualizers</a> · <a href="#/topic/' + id + '">Read the lesson</a></p></div></div><div class="tp-viz" id="viz-host"></div></div>';
        var v; try { v = OR.viz[vizOf(m)].mount(OR.$('#viz-host', main), { topic: id, mark: function () {} }); }
        catch (e) { console.error(e); OR.$('#viz-host', main).innerHTML = '<p class="muted">The visualizer hit an error: ' + esc(e.message) + '</p>'; }
        return function () { if (v && v.destroy) v.destroy(); };
      }
      var items = OR.curriculum.filter(vizOf);
      main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Visualizers</h1><p class="page-lede">' + items.length + ' topics with a step-by-step visualizer. Edit the input, scrub the timeline, then read the lesson for the code.</p></div></div>' +
        '<ul class="viz-grid">' + Object.keys(EXTRA).filter(function (k) { return OR.viz[k]; }).map(function (k) { return '<li><a href="#/viz/' + k + '"><strong>' + esc(EXTRA[k][0]) + '</strong><span class="faint">' + esc(EXTRA[k][2]) + '</span></a></li>'; }).join('') + items.map(function (t) {
          return '<li><a href="#/viz/' + t.id + '"><strong>' + esc(t.title) + '</strong><span class="faint">' + esc(OR.plan.phase(t.phase).name) + '</span></a></li>';
        }).join('') + '</ul></div>';
    }
  };
})();
