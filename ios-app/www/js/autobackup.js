/* Offer Ready: automatic backup file (Chrome and Edge, File System Access API). The owner picks a .json file once;
   the app rewrites it a few seconds after changes. Browser data can be cleared or tied to a moved folder, so this file
   is the safety net: Settings > Import backup restores from it. The handle lives in its own IndexedDB database. */
(function () {
  'use strict';
  var OR = window.OR, DB = 'offer-ready-handles', handle = null, timer = null, state = { on: false, needsPermission: false, last: 0, error: '' };

  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      var open = indexedDB.open(DB, 1);
      open.onupgradeneeded = function () { open.result.createObjectStore('h'); };
      open.onerror = function () { rej(open.error); };
      open.onsuccess = function () {
        var tx = open.result.transaction('h', mode), r = fn(tx.objectStore('h'));
        tx.oncomplete = function () { res(r && r.result); }; tx.onerror = function () { rej(tx.error); };
      };
    });
  }
  async function write() {
    if (!handle) return;
    try {
      if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') { state.needsPermission = true; OR.emit('autobackup'); return; }
      var w = await handle.createWritable();
      await w.write(JSON.stringify(await OR.store.exportPayload()));
      await w.close();
      state.last = Date.now(); state.error = ''; state.needsPermission = false;
    } catch (e) { state.error = e.message || 'Could not write the backup file.'; }
    OR.emit('autobackup');
  }
  function later() { clearTimeout(timer); timer = setTimeout(write, 8000); }

  OR.autoBackup = {
    supported: !!window.showSaveFilePicker,
    state: function () { return state; },
    enable: async function () {
      handle = await window.showSaveFilePicker({ suggestedName: 'offer-ready-autobackup.json', types: [{ description: 'Offer Ready backup', accept: { 'application/json': ['.json'] } }] });
      await idb('readwrite', function (s) { return s.put(handle, 'file'); });
      state.on = true; await write();
    },
    // Needs a click: browsers only re-grant file access from a user gesture.
    resume: async function () {
      if (handle && (await handle.requestPermission({ mode: 'readwrite' })) === 'granted') { state.needsPermission = false; await write(); }
    },
    disable: async function () { handle = null; state.on = false; clearTimeout(timer); await idb('readwrite', function (s) { return s.delete('file'); }); OR.emit('autobackup'); }
  };

  // Ask the browser not to evict storage under pressure (best effort; some browsers decide on their own).
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (ok) { OR.storagePersistent = ok; }); } catch (e) { /* ignore */ }

  if (OR.autoBackup.supported) {
    idb('readonly', function (s) { return s.get('file'); }).then(function (h) {
      if (!h) return;
      handle = h; state.on = true;
      h.queryPermission({ mode: 'readwrite' }).then(function (p) { state.needsPermission = p !== 'granted'; OR.emit('autobackup'); });
    }).catch(function () { /* no saved handle */ });
    OR.on('state', later);
    document.addEventListener('visibilitychange', function () { if (document.hidden && state.on) write(); });
  }
})();
