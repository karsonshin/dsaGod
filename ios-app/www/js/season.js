/* Offer Ready: the Season Chart (signature component).
   One bar per week from the first day to offer day: planned hours outlined, logged hours filled,
   phase bands behind, today's marker, offer-day flag, and a pace strip on the same x-axis.
   Scrub with pointer or arrow keys; Enter opens the week in the plan. */
(function () {
  'use strict';
  var OR = window.OR;
  var drawnLogged = {}; // week -> minutes last drawn, so a bar only animates when it grew

  function el(tag, attrs, text) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function fmtRange(a, b) {
    var o = { month: 'short', day: 'numeric' };
    return OR.fmtDate(a, o) + '–' + OR.fmtDate(b, o);
  }

  OR.seasonChart = function (host, opts) {
    opts = opts || {};
    var plan = opts.plan || OR.store.get().plan;
    if (!plan || !plan.weeks || !plan.weeks.length) { host.innerHTML = ''; return { destroy: function () {} }; }
    var preview = !!opts.preview;
    var cur = preview ? 0 : OR.plan.weekIndex();
    var sel = opts.selected || cur || 1;
    var W = plan.weeks.length;

    host.innerHTML = '<div class="season-scroll"><svg class="season-svg" role="group" tabindex="0" aria-roledescription="chart"></svg></div>' +
      (opts.detail === false ? '' : '<div class="season-detail" aria-live="polite"></div>');
    var svg = host.querySelector('svg'), detail = host.querySelector('.season-detail');
    svg.setAttribute('aria-label', 'Season chart: ' + W + ' weeks from ' + OR.fmtDate(plan.start) + ' to offer day, ' + OR.fmtDate(plan.target) +
      (preview ? '.' : '. Week ' + cur + ' is this week. Use the left and right arrow keys to move between weeks; Enter opens that week’s plan.'));

    var logged = plan.weeks.map(function (w) { return preview ? 0 : OR.plan.minutesBetween(w.start, w.end); });
    var pace = preview ? { planned: [], real: [] } : OR.plan.paceSeries();
    var geo = null;

    function weekText(n) {
      var w = plan.weeks[n - 1]; if (!w) return '';
      var names = w.topics.map(function (t) { var m = OR.topicMeta(t.id); return m ? m.title : t.id; });
      var bits = [];
      if (names.length) bits.push('<strong>' + OR.esc(names.join(', ')) + '</strong>');
      else bits.push('<strong>' + OR.esc(OR.plan.phase(w.phase).name) + '</strong>');
      var t = w.tracks || {};
      if (t.practice) bits.push(t.practice + ' practice problems');
      if (t.systemDesign) bits.push('system design ' + t.systemDesign);
      if (t.mocks) bits.push(OR.plural(t.mocks, 'mock'));
      if (t.applications) bits.push('applications: ' + t.applications);
      return bits.join(' · ');
    }
    function renderDetail() {
      if (!detail) return;
      var w = plan.weeks[sel - 1]; if (!w) return;
      var lg = logged[sel - 1];
      detail.innerHTML = '<span class="wk">W' + sel + '</span><span class="what">' + fmtRange(w.start, w.end) + (sel === cur ? ' (this week)' : '') +
        ' · ' + weekText(sel) + '</span><span class="hrs">' + (preview ? w.hours + ' h planned' : OR.fmtHours(lg) + ' / ' + w.hours + ' h') + '</span>';
    }

    function draw() {
      var width = Math.max(host.clientWidth || 640, W * 16 + 110);
      var compact = !!opts.compact;
      var H = compact ? 168 : 252;
      var padL = 34, padR = 78, padT = 32, padB = 22;
      var paceH = compact || preview ? 0 : 40;
      var plotH = H - padT - padB - (paceH ? paceH + 16 : 0);
      var innerW = width - padL - padR;
      var step = innerW / W;
      var bw = Math.max(4, Math.min(30, step * 0.64));
      var maxHours = Math.max(plan.weeklyHours, Math.max.apply(null, logged) / 60) * 1.12;
      var y = function (h) { return padT + plotH - (h / maxHours) * plotH; };
      var bx = function (n) { return padL + (n - 1) * step + (step - bw) / 2; };
      geo = { padL: padL, step: step };

      svg.innerHTML = '';
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + H);
      svg.setAttribute('width', width);
      svg.setAttribute('height', H);
      var defs = el('defs');
      var pat = el('pattern', { id: 'now-hatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
      pat.appendChild(el('rect', { width: 5, height: 5, fill: 'var(--accent-soft)' }));
      pat.appendChild(el('rect', { width: 2.4, height: 5, fill: 'var(--accent)' }));
      defs.appendChild(pat); svg.appendChild(defs);

      // Phase bands
      var phases = {};
      plan.weeks.forEach(function (w) { var p = phases[w.phase] = phases[w.phase] || { a: w.n, b: w.n }; p.b = w.n; });
      var ids = Object.keys(phases).sort();
      ids.forEach(function (id) {
        var p = phases[id], x0 = padL + (p.a - 1) * step, x1 = padL + p.b * step;
        svg.appendChild(el('rect', { class: 'band', x: x0, y: padT - 20, width: x1 - x0, height: plotH + 20 }));
      });
      ids.forEach(function (id) {
        var p = phases[id], x0 = padL + (p.a - 1) * step, x1 = padL + p.b * step;
        var name = OR.plan.phase(+id).name;
        if (x1 - x0 > name.length * 7.4 + 10) svg.appendChild(el('text', { class: 'band-label', x: x0 + 6, y: padT - 7 }, name));
      });

      // Hour gridlines
      var tick = maxHours > 36 ? 10 : maxHours > 14 ? 5 : 2;
      for (var h = tick; h < maxHours; h += tick) {
        svg.appendChild(el('line', { class: 'grid', x1: padL, x2: padL + innerW, y1: Math.round(y(h)) + 0.5, y2: Math.round(y(h)) + 0.5 }));
        svg.appendChild(el('text', { class: 'axis-label', x: padL - 6, y: y(h) + 3, 'text-anchor': 'end' }, h + 'h'));
      }
      svg.appendChild(el('line', { class: 'grid', x1: padL, x2: padL + innerW, y1: padT + plotH + 0.5, y2: padT + plotH + 0.5 }));

      // Weeks
      var every = W > 30 ? 4 : W > 14 ? 2 : 1;
      plan.weeks.forEach(function (w, i) {
        var n = i + 1;
        var lastTopicsUnfinished = !preview && n < cur && w.topics.some(function (t) { return !OR.plan.topicDone(t.id); });
        var cls = 'week ' + (preview ? 'future' : n < cur ? 'past' : n === cur ? 'now' : 'future') + (lastTopicsUnfinished ? ' short' : '') + (n === sel ? ' sel' : '');
        var g = el('g', { class: cls, 'data-n': n });
        g.appendChild(el('rect', { class: 'plan', x: bx(n), y: y(w.hours), width: bw, height: Math.max(1, padT + plotH - y(w.hours)), rx: 1.5 }));
        var lh = logged[i] / 60;
        if (lh > 0) {
          var prev = drawnLogged[w.start];
          var r = el('rect', { class: 'log', x: bx(n), y: y(lh), width: bw, height: Math.max(0, padT + plotH - y(lh)), rx: 1.5 });
          g.appendChild(r);
          // Draw at the final size, then grow from the previous logged height with a transform (no layout-property transition).
          if (prev != null && prev < logged[i] && !OR.reducedMotion()) {
            r.style.transform = 'scaleY(' + (prev / logged[i]) + ')';
            requestAnimationFrame(function () { requestAnimationFrame(function () { r.style.transform = ''; }); });
          }
        }
        if (!preview) drawnLogged[w.start] = logged[i];
        g.appendChild(el('rect', { class: 'hit', x: padL + i * step, y: padT - 20, width: step, height: plotH + 20 + (paceH ? paceH + 16 : 0) }));
        svg.appendChild(g);
        if ((n - 1) % every === 0 || n === W) svg.appendChild(el('text', { class: 'axis-label', x: bx(n) + bw / 2, y: H - 6, 'text-anchor': 'middle' }, 'W' + n));
      });

      // Today marker
      if (!preview && cur) {
        var dayIn = OR.clamp(OR.daysBetween(plan.weeks[cur - 1].start, OR.today()), 0, 6);
        var tx = padL + (cur - 1) * step + step * ((dayIn + 0.5) / 7);
        svg.appendChild(el('line', { class: 'today-line', x1: tx, x2: tx, y1: padT - 20, y2: padT + plotH }));
        var label = el('text', { class: 'today-label', x: tx + 4, y: padT - 24 }, 'Today');
        if (tx > padL + innerW - 40) { label.setAttribute('text-anchor', 'end'); label.setAttribute('x', tx - 4); }
        svg.appendChild(label);
      }

      // Offer-day flag
      var fx = padL + innerW + 10;
      svg.appendChild(el('path', { class: 'flag', d: 'M' + fx + ' ' + (padT + plotH) + 'V' + (padT - 16) + 'h' + 15 + 'l-4 5 4 5h-15z' }));
      svg.appendChild(el('text', { class: 'flag-label', x: fx, y: padT + plotH - 22 }, 'Offer'));
      svg.appendChild(el('text', { class: 'flag-label', x: fx, y: padT + plotH - 8 }, 'day'));
      svg.appendChild(el('text', { class: 'axis-label', x: fx, y: H - 6 }, OR.fmtDate(plan.target, { month: 'short', day: 'numeric' })));

      // Pace strip: share of planned topics finished, plan (dashed) vs you (solid)
      if (paceH && pace.planned.length) {
        var top = padT + plotH + 16, py = function (v) { return top + paceH - v * paceH; };
        var cx = function (n) { return bx(n) + bw / 2; };
        svg.appendChild(el('text', { class: 'axis-label', x: padL - 6, y: top + 8, 'text-anchor': 'end' }, '100%'));
        svg.appendChild(el('text', { class: 'axis-label', x: padL - 6, y: top + paceH, 'text-anchor': 'end' }, '0'));
        svg.appendChild(el('line', { class: 'grid', x1: padL, x2: padL + innerW, y1: top + paceH + 0.5, y2: top + paceH + 0.5 }));
        svg.appendChild(el('polyline', { class: 'pace-plan', points: pace.planned.map(function (v, i) { return cx(i + 1) + ',' + py(v); }).join(' ') }));
        if (pace.real.length) {
          svg.appendChild(el('polyline', { class: 'pace-real', points: pace.real.map(function (v, i) { return cx(i + 1) + ',' + py(v); }).join(' ') }));
          var last = pace.real.length;
          svg.appendChild(el('circle', { class: 'flag', cx: cx(last), cy: py(pace.real[last - 1]), r: 3.2 }));
        }
      }
      renderDetail();
    }

    function select(n, announce) {
      n = OR.clamp(n, 1, W);
      if (n === sel && !announce) return;
      sel = n;
      OR.$$('.week', svg).forEach(function (g) { g.classList.toggle('sel', +g.dataset.n === sel); });
      renderDetail();
      if (opts.onSelect) opts.onSelect(sel);
    }
    function weekAt(evt) {
      var pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return Math.floor((p.x - geo.padL) / geo.step) + 1;
    }
    svg.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') select(weekAt(e)); });
    svg.addEventListener('click', function (e) { var n = weekAt(e); select(n, true); if (opts.onPick && n >= 1 && n <= W) opts.onPick(n); });
    svg.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); select(sel + (k === 'ArrowRight' ? 1 : -1), true); }
      else if (k === 'Home') { e.preventDefault(); select(1, true); }
      else if (k === 'End') { e.preventDefault(); select(W, true); }
      else if (k === 'Enter' && opts.onPick) { e.preventDefault(); opts.onPick(sel); }
    });

    draw();
    var ro = 'ResizeObserver' in window ? new ResizeObserver(OR.debounce(draw, 80)) : null;
    if (ro) ro.observe(host);
    // Keep this week visible when the chart is wider than a phone screen.
    var scroller = host.querySelector('.season-scroll');
    if (scroller && cur > 0 && geo) scroller.scrollLeft = Math.max(0, geo.padL + (cur - 4) * geo.step);
    return { destroy: function () { if (ro) ro.disconnect(); }, redraw: draw };
  };
})();
