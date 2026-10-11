/* Offer Ready: shell behaviour that is not a view. The sidebar's drag handle (wide screens): the width is kept per device. */
(function () {
  'use strict';
  var OR = window.OR, KEY = 'offer-ready:railw', MIN = 200, MAX = 440, DEF = 236, root = document.documentElement;
  var handle = document.getElementById('rail-resizer'); if (!handle) return;

  function clamp(px) { return Math.max(MIN, Math.min(MAX, Math.round(px))); }
  function current() { return parseInt(getComputedStyle(root).getPropertyValue('--rail-w'), 10) || DEF; }
  function set(px, save) {
    px = clamp(px); root.style.setProperty('--rail-w', px + 'px'); handle.setAttribute('aria-valuenow', px);
    if (save) { try { localStorage.setItem(KEY, String(px)); } catch (e) { /* storage blocked */ } }
  }
  function reset() { root.style.removeProperty('--rail-w'); try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } handle.setAttribute('aria-valuenow', current()); }

  handle.setAttribute('aria-valuemin', MIN); handle.setAttribute('aria-valuemax', MAX); handle.setAttribute('aria-valuenow', current());
  handle.addEventListener('pointerdown', function (e) {
    e.preventDefault(); handle.setPointerCapture(e.pointerId); document.body.classList.add('is-resizing');
    function move(ev) { set(ev.clientX, false); }
    function up(ev) { handle.releasePointerCapture(ev.pointerId); handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); document.body.classList.remove('is-resizing'); set(ev.clientX, true); }
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
  });
  handle.addEventListener('dblclick', reset);
  handle.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 48 : 16;
    if (e.key === 'ArrowLeft') { e.preventDefault(); set(current() - step, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); set(current() + step, true); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });
})();
