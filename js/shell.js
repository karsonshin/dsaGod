/* Offer Ready: shell behaviour that is not a view: the sidebar width.
   Drag the handle on the sidebar's right edge (or use the arrow keys on it) to any width from icons-only up to 440px. At about 150px and
   above the option names show; below it the sidebar becomes a strip of icons. Double-click the handle, press Home, or use the
   button at the top of the sidebar to switch between names and icons. The width is kept per device. */
(function () {
  'use strict';
  var OR = window.OR, KEY = 'offer-ready:railw', MIN = 56, ICONS = 68, FULL_MIN = 180, FULL = 236, MAX = 440, SWITCH = 150, root = document.documentElement;
  var handle = document.getElementById('rail-resizer'), rail = document.querySelector('.rail'); if (!handle || !rail) return;

  function def() { return innerWidth >= 1180 ? FULL : ICONS; }
  function current() { return parseInt(getComputedStyle(root).getPropertyValue('--rail-w'), 10) || def(); }
  function compact() { return root.getAttribute('data-rail') === 'compact'; }

  // In icons-only mode every group has to be open so no icon is hidden; in names mode only the group holding the current page stays open.
  function folds() {
    var all = rail.querySelectorAll('details.rail-fold'), c = compact();
    all.forEach(function (d) { d.open = c || !!d.querySelector('[aria-current="page"]'); });
  }
  function syncToggle() {
    var b = document.getElementById('rail-toggle'); if (!b) return;
    var c = compact();
    b.setAttribute('aria-label', c ? 'Show option names in the sidebar' : 'Collapse the sidebar to icons');
    b.title = c ? 'Show names' : 'Collapse to icons';
    b.innerHTML = OR.icon(c ? 'chevron-right' : 'chevron-left', 'icon-sm') + '<span class="rail-toggle-label">Collapse</span>';
  }
  function apply(px, save) {
    px = Math.max(MIN, Math.min(MAX, Math.round(px)));
    root.style.setProperty('--rail-w', px + 'px'); handle.setAttribute('aria-valuenow', px);
    var was = compact(), now = px < SWITCH;
    root.setAttribute('data-rail', now ? 'compact' : 'full');
    if (was !== now) { folds(); syncToggle(); }
    if (save) { try { localStorage.setItem(KEY, String(px)); } catch (e) { /* storage blocked */ } }
  }
  // After letting go: snap to a sensible size so names are never squeezed and icons are never cramped.
  function settle(px) { return px < SWITCH ? ICONS : px < FULL_MIN ? FULL_MIN : px; }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } apply(def(), false); }

  handle.setAttribute('aria-valuemin', MIN); handle.setAttribute('aria-valuemax', MAX); handle.setAttribute('aria-valuenow', current());
  handle.addEventListener('pointerdown', function (e) {
    e.preventDefault(); handle.setPointerCapture(e.pointerId); document.body.classList.add('is-resizing');
    function move(ev) { apply(ev.clientX, false); }
    function up(ev) {
      handle.releasePointerCapture(ev.pointerId); handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); document.body.classList.remove('is-resizing');
      apply(settle(Math.max(MIN, Math.min(MAX, ev.clientX))), true);
    }
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
  });
  handle.addEventListener('dblclick', function () { var c = compact(); apply(c ? FULL : ICONS, true); });
  handle.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 48 : 16, w = current();
    if (e.key === 'ArrowLeft') { e.preventDefault(); apply(settle(w - step), true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); apply(settle(w + step), true); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  // The collapse / show-names button sits at the top of the sidebar, under the logo.
  var brand = rail.querySelector('.brand'), toggle = document.createElement('button');
  toggle.type = 'button'; toggle.id = 'rail-toggle'; toggle.className = 'rail-toggle';
  toggle.addEventListener('click', function () { apply(compact() ? FULL : ICONS, true); });
  if (brand && brand.parentNode) brand.parentNode.insertBefore(toggle, brand.nextSibling);
  syncToggle();
  // The sidebar's links are drawn after this script runs, and again when the nav refreshes: keep the groups right each time.
  var navEl = document.getElementById('rail-nav');
  new MutationObserver(function () { folds(); }).observe(rail, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });   // a new page opens its group
  if (navEl) new MutationObserver(function () { folds(); }).observe(navEl, { childList: true });                                         // the links were redrawn
  folds();
})();
