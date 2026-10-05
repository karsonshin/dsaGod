/* Offer Ready: Visualizers (#/viz, #/viz/:topic). Index of every topic's visualizer; each opens on its own, the
   same one the lesson's "See it run" shows (without the template-line sync, which lives in the lesson). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  function vizOf(t) { var l = OR.plan.topic(t.id); return l && l.viz && OR.viz[l.viz] ? l.viz : null; }

  OR.views.viz = {
    title: function (ctx) { var m = ctx.params.id && OR.topicMeta(ctx.params.id); return m ? m.title + ' visualizer' : 'Visualizers'; },
    render: function (main, ctx) {
      var id = ctx.params.id, m = id && OR.topicMeta(id);
      if (m && vizOf(m)) {
        main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">' + esc(m.title) + '</h1><p class="page-lede"><a href="#/viz">All visualizers</a> · <a href="#/topic/' + id + '">Read the lesson</a></p></div></div><div class="tp-viz" id="viz-host"></div></div>';
        var v; try { v = OR.viz[vizOf(m)].mount(OR.$('#viz-host', main), { topic: id, mark: function () {} }); }
        catch (e) { console.error(e); OR.$('#viz-host', main).innerHTML = '<p class="muted">The visualizer hit an error: ' + esc(e.message) + '</p>'; }
        return function () { if (v && v.destroy) v.destroy(); };
      }
      var items = OR.curriculum.filter(vizOf);
      main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Visualizers</h1><p class="page-lede">' + items.length + ' topics with a step-by-step visualizer. Edit the input, scrub the timeline, then read the lesson for the code.</p></div></div>' +
        '<ul class="viz-grid">' + items.map(function (t) {
          return '<li><a href="#/viz/' + t.id + '"><strong>' + esc(t.title) + '</strong><span class="faint">' + esc(OR.plan.phase(t.phase).name) + '</span></a></li>';
        }).join('') + '</ul></div>';
    }
  };
})();
