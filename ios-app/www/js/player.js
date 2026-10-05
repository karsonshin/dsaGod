/* Offer Ready: step player for every visualizer (the owner's pick: Timeline control bar, 2026-10-02).
   A visualizer supplies frames and a paint function; the player owns playback, the timeline, speed and keys. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var SPEEDS = [0.5, 1, 2, 4];

  // opts: { frames: [{ step, note }], steps: { id: { label, tone } }, paint(stage, frame, i), label }
  // A step's tone ('accent' | 'hard' | 'ok') sets its tick color and height and lists it in the legend.
  // Steps without a tone (start, done) draw as short muted ticks.
  OR.player = function (host, opts) {
    var F = opts.frames, steps = opts.steps || {}, n = F.length, i = 0, timer = null, speed = 1;
    function label(s) { return (steps[s] || {}).label || s; }
    function at(k) { return (n > 1 ? 100 * k / (n - 1) : 0) + '%'; }

    host.innerHTML = '<div class="player" tabindex="0" aria-label="' + esc(opts.label || 'Visualizer') + '. Space plays, arrow keys step.">' +
      '<div class="player-stage"></div><p class="player-note" aria-live="polite"></p>' +
      '<div class="player-bar" role="toolbar" aria-label="Playback">' +
        '<div class="player-ctl"><button class="player-play" type="button" data-c="play" aria-label="Play">' + OR.icon('play') + '</button>' +
          '<button class="icon-btn" type="button" data-c="back" aria-label="Step back">' + OR.icon('step-back') + '</button>' +
          '<button class="icon-btn" type="button" data-c="fwd" aria-label="Step forward">' + OR.icon('step-fwd') + '</button>' +
          '<button class="icon-btn" type="button" data-c="reset" aria-label="Reset to the start">' + OR.icon('reset') + '</button></div>' +
        '<div class="player-track" role="slider" tabindex="0" aria-label="Timeline" aria-valuemin="1" aria-valuemax="' + n + '"><div class="player-ticks">' +
          F.map(function (f, k) { return '<i class="tone-' + ((steps[f.step] || {}).tone || 'muted') + '" style="left:' + at(k) + '"></i>'; }).join('') +
        '</div><div class="player-head"></div></div>' +
        '<div class="player-meta"><span class="player-count"></span><div class="seg" role="radiogroup" aria-label="Speed">' +
          SPEEDS.map(function (v) { return '<button type="button" role="radio" aria-checked="' + (v === 1) + '" tabindex="' + (v === 1 ? 0 : -1) + '" data-speed="' + v + '">' + v + '×</button>'; }).join('') +
        '</div></div></div>' +
      '<p class="player-legend">' + Object.keys(steps).filter(function (s) { return steps[s].tone; }).map(function (s) {
        return '<span><i class="tone-' + steps[s].tone + '"></i>' + esc(steps[s].label) + '</span>';
      }).join('') + '<span class="faint"><kbd>Space</kbd> play · <kbd>←</kbd><kbd>→</kbd> step</span></p></div>';

    var root = host.firstChild, stage = root.querySelector('.player-stage'), note = root.querySelector('.player-note'),
      play = root.querySelector('[data-c="play"]'), track = root.querySelector('.player-track'),
      head = root.querySelector('.player-head'), count = root.querySelector('.player-count');

    function paint() {
      var f = F[i];
      opts.paint(stage, f, i);
      note.innerHTML = '<b>' + esc(label(f.step)) + '</b> ' + esc(f.note || '');
      play.innerHTML = OR.icon(timer ? 'pause' : 'play');
      play.setAttribute('aria-label', timer ? 'Pause' : 'Play');
      count.textContent = (i + 1) + ' / ' + n;
      head.style.left = at(i);
      track.setAttribute('aria-valuenow', i + 1);
      track.setAttribute('aria-valuetext', 'Step ' + (i + 1) + ' of ' + n + ', ' + label(f.step));
    }

    var api = {
      get i() { return i; }, get playing() { return !!timer; },
      seek: function (k) { i = OR.clamp(k, 0, n - 1); paint(); },
      step: function (d) { api.pause(); api.seek(i + d); },
      play: function () {
        if (timer) return;
        if (i >= n - 1) i = 0;
        timer = setInterval(function () { if (i >= n - 1) api.pause(); else { i++; paint(); } }, 900 / speed);
        paint();
      },
      pause: function () { if (!timer) return; clearInterval(timer); timer = null; paint(); },
      toggle: function () { if (timer) api.pause(); else api.play(); },
      setSpeed: function (v) { speed = v; if (timer) { clearInterval(timer); timer = null; api.play(); } },
      destroy: function () { clearInterval(timer); timer = null; }
    };

    function pickSpeed(b) {
      OR.$$('[data-speed]', root).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      api.setSpeed(+b.dataset.speed);
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c],[data-speed]'); if (!b) return;
      if (b.dataset.speed) pickSpeed(b);
      else if (b.dataset.c === 'play') api.toggle();
      else if (b.dataset.c === 'reset') { api.pause(); api.seek(0); }
      else api.step(b.dataset.c === 'fwd' ? 1 : -1);
    });
    root.addEventListener('keydown', function (e) {
      var k = e.key, radio = e.target.closest('[data-speed]'), onTrack = e.target === track;
      if (radio && (k === 'ArrowLeft' || k === 'ArrowRight')) { // the speed radiogroup moves its own selection
        e.preventDefault();
        var all = OR.$$('[data-speed]', root), next = all[(all.indexOf(radio) + (k === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
        pickSpeed(next); next.focus();
      } else if (k === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); api.toggle(); }
      else if (k === 'ArrowRight' || (onTrack && k === 'ArrowUp')) { e.preventDefault(); api.step(1); }
      else if (k === 'ArrowLeft' || (onTrack && k === 'ArrowDown')) { e.preventDefault(); api.step(-1); }
      else if (onTrack && (k === 'Home' || k === 'End')) { e.preventDefault(); api.pause(); api.seek(k === 'Home' ? 0 : n - 1); }
    });
    function seekAt(e) {
      var r = track.getBoundingClientRect();
      api.pause(); api.seek(Math.round(OR.clamp((e.clientX - r.left) / r.width, 0, 1) * (n - 1)));
    }
    track.addEventListener('pointerdown', function (e) { track.setPointerCapture(e.pointerId); seekAt(e); });
    track.addEventListener('pointermove', function (e) { if (track.hasPointerCapture(e.pointerId)) seekAt(e); });

    paint();
    return api;
  };
})();
