/* Offer Ready: Settings. Language, theme, motion, season, backup (export/import), reset. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function seg(name, current, options) {
    return '<div class="seg seg-lg" role="radiogroup" aria-label="' + esc(name) + '">' + options.map(function (o) {
      var on = o[0] === current;
      return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-act="setting" data-key="' + o[2] + '" data-val="' + o[0] + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }

  OR.actions.setting = function (el) {
    var k = el.dataset.key, v = el.dataset.val;
    if (k === 'lang') { OR.setLang(v); OR.rerender(); return; }
    OR.store.update(function (s) { s.settings[k] = v; });
    if (k === 'theme') { OR.applyTheme(); OR.emit('theme'); }
    if (k === 'motion') OR.applyMotion();
    document.dispatchEvent(new CustomEvent('or-settings'));
    OR.rerender();
  };

  OR.actions['import-pick'] = function () { OR.$('#import-file').click(); };
  OR.actions['reset-all'] = async function () {
    var html = '<p>This deletes every solved problem, note, card review, story, application and logged hour on this computer. It can’t be undone.</p>' +
      '<p><label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="reset-docs"> Also delete stored resumes and cover letters</label></p>' +
      '<p class="field-hint" style="margin-top:12px">Export a backup first if there’s any chance you’ll want it back.</p>';
    var v = await OR.dialog({ title: 'Reset all progress?', html: html, buttons: [{ label: 'Export first', value: 'export' }, { label: 'Cancel', value: 'cancel' }, { label: 'Reset everything', value: 'reset', danger: true }] });
    if (v === 'export') { OR.store.exportFile(); return; }
    if (v !== 'reset') return;
    var docs = false; // the checkbox lives inside the closed dialog; read it before it is replaced
    try { docs = OR.$('#reset-docs').checked; } catch (e) { /* dialog already cleared */ }
    await OR.store.reset(docs);
    OR.toast('Progress reset. Set up your season again to start over.', { tone: 'ok' });
  };

  OR.views.settings = {
    title: function () { return 'Settings'; },
    render: function (main) {
      var st = OR.store.get(), s = st.settings;
      var last = s.lastExport ? new Date(s.lastExport).toLocaleString() : 'never';
      main.innerHTML = '<div class="page-narrow">' + OR.healthBanners(false) +
        '<div class="page-head"><div><h1 class="page-title display">Settings</h1><p class="page-lede">Everything here is stored on this computer only.</p></div></div>' +
        '<div class="settings-grid">' +
        '<section class="setting"><div><h2>Code language</h2><p>Every template and solution switches to this language. You can also change it from the top bar.</p></div><div class="setting-body">' +
          seg('Code language', s.lang, OR.LANGS.map(function (l) { return [l[0], l[2], 'lang']; })) + '</div></section>' +
        '<section class="setting"><div><h2>Theme</h2><p>System follows your computer’s light or dark setting.</p></div><div class="setting-body">' +
          seg('Theme', s.theme, [['system', 'System', 'theme'], ['light', 'Light', 'theme'], ['dark', 'Dark', 'theme']]) + '</div></section>' +
        '<section class="setting"><div><h2>Motion</h2><p>Visualizers animate to explain each step. Reduce keeps every state change but drops the movement.</p></div><div class="setting-body">' +
          seg('Motion', s.motion, [['system', 'System', 'motion'], ['reduce', 'Reduce', 'motion'], ['full', 'Full', 'motion']]) + '</div></section>' +
        '<section class="setting"><div><h2>Season</h2><p>Changing these rebuilds the weeks from today forward. Finished topics stay finished.</p></div><div class="setting-body">' +
          '<form id="season-form" class="stack-4">' +
          '<div class="field"><label class="field-label" for="s-target">Offer by</label><input class="input" type="date" id="s-target" name="targetDate" value="' + esc(s.targetDate) + '" min="' + OR.addDays(OR.today(), 14) + '"></div>' +
          '<div class="field"><label class="field-label" for="s-hours">Hours per week: <output id="s-hours-v">' + s.weeklyHours + '</output></label><input type="range" id="s-hours" name="weeklyHours" min="3" max="30" value="' + s.weeklyHours + '"></div>' +
          '<div class="field"><label class="field-label" for="s-level">Starting level</label><select class="select" id="s-level" name="level">' + OR.plan.LEVELS.map(function (l) { return '<option value="' + l.id + '"' + (l.id === s.level ? ' selected' : '') + '>' + esc(l.label) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label class="field-label" for="s-rest">Rest day</label><select class="select" id="s-rest" name="restDay">' + DAYS.map(function (d, i) { return '<option value="' + i + '"' + (i === s.restDay ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select><span class="field-hint">Your streak never breaks on your rest day.</span></div>' +
          '<div class="field"><label class="field-label" for="s-new">New flashcards per day</label><input class="input" type="number" id="s-new" name="newCardsPerDay" min="0" max="100" value="' + s.newCardsPerDay + '"></div>' +
          '<div class="btn-row"><button class="btn btn-primary" type="submit">Save and rebuild plan</button></div></form></div></section>' +
        '<section class="setting"><div><h2>Backup</h2><p>One JSON file holds all progress, notes, stories, applications and stored documents. Import it on any device to continue there.</p></div><div class="setting-body">' +
          '<p class="field-hint">Last backup: ' + esc(last) + '</p>' +
          '<div class="btn-row"><button class="btn btn-primary" data-act="export">' + OR.icon('download', 'icon-sm') + 'Export backup</button>' +
          '<button class="btn" data-act="import-pick">' + OR.icon('upload', 'icon-sm') + 'Import backup…</button></div>' +
          '<input type="file" id="import-file" accept="application/json,.json" hidden>' +
          '<div id="auto-bk" class="stack-2"></div>' +
          '<p class="field-hint">Your progress lives in this browser, tied to where index.html is saved. Keep opening it from the same place in the same browser, and do not move or rename the folder. An exported or automatic backup file is the way to recover if browser data is ever cleared.</p></div></section>' +
        '<section class="setting"><div><h2>Cloud sync</h2><p>Keep the same progress, history and documents on every device through a private GitHub repository that only you can open.</p></div><div class="setting-body"><div id="sync-box" class="stack-4"></div></div></section>' +
        '<section class="setting"><div><h2>Reset</h2><p>Start over from a clean slate.</p></div><div class="setting-body"><div class="btn-row"><button class="btn btn-danger" data-act="reset-all">' + OR.icon('trash', 'icon-sm') + 'Reset all progress…</button></div></div></section>' +
        '</div></div>';

      var ab = OR.autoBackup, abHost = OR.$('#auto-bk');
      function paintAuto() {
        if (!abHost) return;
        if (!ab || !ab.supported) { abHost.innerHTML = '<p class="field-hint">Automatic backup files need Chrome or Edge on a computer. Here, use Export backup now and then: the share sheet can save it to Files or iCloud Drive, and Import backup restores it on any device.</p>'; return; }
        var a = ab.state();
        abHost.innerHTML = a.on
          ? '<p class="field-hint">Automatic backup is on' + (a.last ? ', last written ' + esc(new Date(a.last).toLocaleTimeString()) : '') + '.' + (a.error ? ' ' + esc(a.error) : '') + '</p>' +
            '<div class="btn-row">' + (a.needsPermission ? '<button class="btn btn-primary" data-act="ab-resume">Allow writing again</button>' : '') + '<button class="btn" data-act="ab-off">Turn off</button></div>'
          : '<div class="btn-row"><button class="btn" data-act="ab-on">Keep an automatic backup file…</button></div><p class="field-hint">Pick a file once, ideally in OneDrive or Documents. It is rewritten a few seconds after each change.</p>';
      }
      paintAuto();
      var offAb = OR.on('autobackup', paintAuto);
      abHost && abHost.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var go = { 'ab-on': ab.enable, 'ab-off': ab.disable, 'ab-resume': ab.resume }[b.dataset.act];
        if (go) go().then(paintAuto, function (err) { if (err && err.name !== 'AbortError') OR.toast('Could not set up the backup file: ' + err.message, { tone: 'error' }); });
      });
      var syncBox = OR.$('#sync-box');
      function paintSync() {
        if (!syncBox) return;
        var x = OR.sync.status();
        syncBox.innerHTML = x.connected
          ? '<p class="field-hint">Connected to <strong>' + esc(x.repo) + '</strong>. ' + (x.busy ? 'Syncing…' : x.at ? 'Last synced ' + esc(new Date(x.at).toLocaleString()) + '.' : 'Not synced yet.') + '</p>' +
            (x.error ? '<p class="banner" data-tone="warn">' + OR.icon('warning') + '<span>' + esc(x.error) + '</span></p>' : '') +
            '<div class="btn-row"><button class="btn btn-primary" type="button" data-sy="now">Sync now</button><button class="btn" type="button" data-sy="off">Disconnect this device</button></div>' +
            '<p class="field-hint">Changes upload a few seconds after you make them, and this device checks for others’ changes when you open the app and about once a minute. Documents you delete on one device are not removed from the others.</p>'
          : '<form id="sync-form" class="stack-4"><div class="field"><label class="field-label" for="sy-repo">Private repository</label><input class="input" id="sy-repo" placeholder="your-username/offer-ready-data" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
            '<div class="field"><label class="field-label" for="sy-token">Access token</label><input class="input" id="sy-token" type="password" autocomplete="off" placeholder="github_pat_…"></div>' +
            '<div class="btn-row"><button class="btn btn-primary" type="submit">Connect and sync</button></div></form>' +
            '<details class="field-hint"><summary>How to set this up (about 3 minutes)</summary><ol>' +
            '<li>On github.com, create a <strong>private</strong> repository named <code>offer-ready-data</code>, with a README so it is not empty.</li>' +
            '<li>Open Settings → Developer settings → Personal access tokens → <strong>Fine-grained tokens</strong> → Generate new token.</li>' +
            '<li>Repository access: <strong>Only select repositories</strong>, and pick just that one. Permissions → Repository permissions → <strong>Contents: Read and write</strong>.</li>' +
            '<li>Copy the token, paste it above with the repository name, and press Connect. Repeat on each device with the same repository.</li></ol>' +
            '<p>The token stays in this browser only; it is never part of a backup. Anyone holding it can read and write that repository, so keep it limited to that one.</p></details>';
      }
      paintSync();
      var offSy = OR.on('sync', paintSync);
      syncBox && syncBox.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sy]'); if (!b) return;
        if (b.dataset.sy === 'now') { OR.sync.now(); paintSync(); }
        else OR.confirm({ title: 'Disconnect this device?', body: 'This device keeps its data and stops syncing. Your repository is untouched.', ok: 'Disconnect' }).then(function (y) { if (y) OR.sync.disconnect(); });
      });
      syncBox && syncBox.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = OR.$('button[type=submit]', syncBox); btn.disabled = true; btn.textContent = 'Connecting…';
        OR.sync.connect(OR.$('#sy-repo').value, OR.$('#sy-token').value).then(function () { OR.toast('Connected. This device is now syncing.', { tone: 'ok' }); }, function (err) { OR.toast(err.message, { tone: 'error' }); paintSync(); });
      });
      OR.$('#s-hours').addEventListener('input', function (e) { OR.$('#s-hours-v').textContent = e.target.value; });
      OR.$('#season-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = new FormData(e.target), t = f.get('targetDate');
        if (!t || t < OR.addDays(OR.today(), 14)) { OR.toast('Pick an offer date at least two weeks from today.', { tone: 'error' }); return; }
        OR.store.update(function (st2) {
          st2.settings.targetDate = t;
          st2.settings.weeklyHours = OR.clamp(+f.get('weeklyHours') || 12, 3, 30);
          st2.settings.level = f.get('level');
          st2.settings.restDay = +f.get('restDay');
          st2.settings.newCardsPerDay = OR.clamp(+f.get('newCardsPerDay') || 0, 0, 100);
        });
        OR.plan.rebalance();
        OR.toast('Saved. Weeks from today forward were rebuilt.', { tone: 'ok' });
      });
      OR.$('#import-file').addEventListener('change', async function (e) {
        var file = e.target.files[0]; e.target.value = '';
        if (!file) return;
        var parsed;
        try { parsed = OR.store.parseBackup(await OR.readFileText(file)); }
        catch (err) { OR.dialog({ title: 'Can’t import that file', body: err.message }); return; }
        var sm = parsed.summary;
        var html = '<p>' + (parsed.exportedAt ? 'Backup from ' + esc(new Date(parsed.exportedAt).toLocaleString()) + '. ' : '') + 'It contains:</p>' +
          '<ul style="margin:12px 0 0 18px;color:var(--ink-2)"><li>' + OR.plural(sm.solved, 'solved problem') + '</li><li>' + OR.plural(sm.cards, 'flashcard') + ' with review history</li><li>' + OR.fmtMin(sm.minutes) + ' logged</li><li>' + OR.plural(sm.stories, 'story', 'stories') + ', ' + OR.plural(sm.applications, 'application') + ', ' + OR.plural(sm.docs, 'document') + '</li></ul>' +
          '<p style="margin-top:12px">Importing <strong>replaces</strong> the progress on this computer.</p>';
        var ok = await OR.confirm({ title: 'Replace your progress with this backup?', html: html, ok: 'Replace my progress' });
        if (!ok) return;
        await OR.store.applyBackup(parsed);
        OR.toast('Backup imported.', { tone: 'ok' });
      });
      return function () { offAb(); offSy(); };
    }
  };
})();
