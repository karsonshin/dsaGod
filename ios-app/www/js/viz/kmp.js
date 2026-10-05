/* Offer Ready: KMP visualizer. First the failure (LPS) table is built by sliding the pattern under itself,
   then the search slides the pattern along the text and, on a mismatch, jumps to lps[matched-1] instead of restarting.
   Frames are snapshots. Frame steps map to template marks via MARK: bfall / bextend / bset (build), jump / match / cmp / found (search).
   A frame shows one comparison: top[a] against pat[q], with the pattern drawn at offset a - q. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_T = 16, MAX_P = 6;
  var PRESETS = [['aaabaaaab', 'aaaab'], ['abababcab', 'ababc'], ['aaaaab', 'aab'], ['abcxabcdabcy', 'abcy']];
  var STEPS = {
    start: { label: 'Start' }, bfall: { label: 'Fall back', tone: 'hard' }, bextend: { label: 'Extend', tone: 'accent' }, bset: { label: 'Set lps', tone: 'ok' },
    cmp: { label: 'Mismatch, j = 0' }, match: { label: 'Match', tone: 'accent' }, jump: { label: 'Jump', tone: 'hard' }, found: { label: 'Found', tone: 'ok' }, done: { label: 'Done' }
  };
  var MARK = { bfall: 'bfall', bextend: 'bextend', bset: 'bset', cmp: 'cmp', match: 'match', jump: 'jump', found: 'found' };
  function show(c) { return c === ' ' ? '␣' : c; }
  function q(t) { return '“' + t + '”'; }

  /* Pure builder. Returns frames; also the true lps table and first match index for tests. */
  function build(text, pat) {
    var m = pat.length, n = text.length, out = [], lps = [], k = 0, filled = 0;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, phase: 'build', lps: lps.slice(), a: 0, q: 0, res: null, k: k, j: 0, found: -1 }, x));
    }
    lps.push(0); filled = 1;
    snap('start', m ? 'Part 1: build the failure table. lps[i] is the length of the longest proper prefix of the pattern that is also a suffix of pat[0..i]. lps[0] is always 0.' : 'Enter a pattern first.', { start: true });
    if (!m) return { frames: out, lps: [], at: -1 };
    for (var i = 1; i < m; i++) {
      var guard = 0;
      while (k > 0 && pat[i] !== pat[k]) {
        snap('bfall', 'pat[' + i + '] = ' + q(pat[i]) + ' does not match pat[' + k + '] = ' + q(pat[k]) + '. Do not restart: the border of length ' + k + ' itself has a border of length lps[' + (k - 1) + '] = ' + lps[k - 1] + '. Fall back to k = ' + lps[k - 1] + '.', { a: i, q: k, res: 'ne' });
        k = lps[k - 1]; guard++;
      }
      if (pat[i] === pat[k]) {
        snap('bextend', 'pat[' + i + '] = ' + q(pat[i]) + ' matches pat[' + k + '] = ' + q(pat[k]) + '. The border grows: k = ' + (k + 1) + '.', { a: i, q: k, res: 'eq' });
        k++;
      }
      lps.push(k); filled = lps.length;
      snap('bset', 'lps[' + i + '] = ' + k + (k ? ': the first ' + k + ' letters also end at index ' + i + '.' : ': no prefix is also a suffix here.'), { a: i, q: k, res: 'set', i: i });
    }
    var table = lps.slice(), j = 0, found = -1;
    function snap2(step, note, x) {
      out.push(Object.assign({ step: step, note: note, phase: 'search', lps: table, a: 0, q: 0, res: null, k: 0, j: j, found: -1 }, x));
    }
    snap2('start', 'Part 2: search. Slide along the text keeping j = how many pattern letters match right now. On a mismatch, j jumps to lps[j-1]; the text index never goes back.', { start: true, a: 0, q: 0 });
    for (var t = 0; t < n && found < 0; t++) {
      while (true) {
        if (text[t] === pat[j]) {
          if (j + 1 === m) {
            snap2('match', 'text[' + t + '] = ' + q(text[t]) + ' matches pat[' + j + ']. j becomes ' + (j + 1) + '.', { a: t, q: j, res: 'eq' });
            j++; found = t - m + 1;
            snap2('found', 'j = ' + m + ' = pattern length: the whole pattern matches, starting at index ' + found + '.', { a: t, q: m - 1, res: 'eq', found: found, full: true });
          } else {
            snap2('match', 'text[' + t + '] = ' + q(text[t]) + ' matches pat[' + j + ']. j becomes ' + (j + 1) + '.', { a: t, q: j, res: 'eq' });
            j++;
          }
          break;
        }
        if (j > 0) {
          snap2('jump', 'text[' + t + '] = ' + q(text[t]) + ' does not match pat[' + j + '] = ' + q(pat[j]) + '. The ' + j + ' matched letters end with a border of length lps[' + (j - 1) + '] = ' + table[j - 1] + ', so j jumps to ' + table[j - 1] + ' with no text letter re-read.', { a: t, q: j, res: 'ne', to: table[j - 1] });
          j = table[j - 1];
        } else {
          snap2('cmp', 'text[' + t + '] = ' + q(text[t]) + ' does not match pat[0] = ' + q(pat[0]) + ', and j is already 0. Move on to the next text letter.', { a: t, q: 0, res: 'ne' });
          break;
        }
      }
    }
    out.push(Object.assign({}, out[out.length - 1], { step: 'done', phase: 'search', final: true, found: found, res: null,
      note: found >= 0 ? 'First match at index ' + found + '. Total work is at most 2n comparisons: the text index only moves forward, and j can only fall as far as it has risen.'
        : 'No match: the text ran out. Total work stayed within 2n comparisons because the text index never moved back.' }));
    return { frames: out, lps: table, at: found };
  }

  function cells(s, row) {
    return s.split('').map(function (c, i) { return '<span class="va-cell"><b>' + esc(show(c)) + '</b><small>' + i + '</small></span>'; }).join('');
  }
  function lpsCells(pat) {
    return pat.split('').map(function (c, i) { return '<span class="va-cell kmp-l"><b>·</b><small>' + esc(show(c)) + '</small></span>'; }).join('');
  }

  function stageHTML(top, pat, w, phase) {
    return '<div class="kmp-scroll" tabindex="0" role="group" aria-label="Pattern and text"><div class="kmp" style="--w:' + w + '">' +
      '<p class="kmp-tag">' + (phase === 'build' ? 'pattern' : 'text') + '</p><div class="kmp-row kmp-top" aria-hidden="true">' + cells(top) + '</div>' +
      '<p class="kmp-tag">' + (phase === 'build' ? 'pattern slid under itself' : 'pattern') + '</p><div class="kmp-row kmp-pat" aria-hidden="true">' + cells(pat) + '</div>' +
      '<p class="kmp-tag">lps table</p><div class="kmp-row kmp-lps" aria-hidden="true">' + lpsCells(pat) + '</div></div></div>' +
      '<dl class="va-read kmp-read"><div><dt>i</dt><dd class="kmp-i"></dd></div><div><dt>' + (phase === 'build' ? 'k' : 'j') + '</dt><dd class="kmp-j"></dd></div><div><dt>lps</dt><dd class="kmp-tab"></dd></div></dl>';
  }

  function paint(text, pat, W, stage, f) {
    var phase = f.phase, top = phase === 'build' ? pat : text, m = pat.length;
    if (stage.dataset.phase !== phase) { stage.innerHTML = stageHTML(top, pat, W, phase); stage.dataset.phase = phase; }
    var tc = OR.$$('.kmp-top .va-cell', stage), pc = OR.$$('.kmp-pat .va-cell', stage), lc = OR.$$('.kmp-lps .va-cell', stage);
    var cmpFrame = f.res === 'eq' || f.res === 'ne', offset = 0, qq = f.q, i;
    if (f.start || f.final) { offset = 0; qq = 0; }
    else if (f.res === 'set') { offset = f.q > 0 ? f.a - f.q + 1 : 0; }
    else if (f.final) offset = 0;
    else offset = f.a - f.q;
    if (f.final && f.found >= 0) { offset = f.found; qq = m; }
    OR.$('.kmp-pat', stage).style.setProperty('--off', Math.max(offset, 0));
    OR.$('.kmp-pat', stage).classList.toggle('faint-row', !!f.start || (f.res === 'set' && f.q === 0) || (f.final && f.found < 0));
    var a = f.a, hi = f.res === 'set' ? f.q : qq;
    tc.forEach(function (el, t) {
      var cls = 'va-cell';
      if (f.final && f.found >= 0) { if (t >= f.found && t < f.found + m) cls += ' ok'; }
      else if (!f.start && !f.final) {
        if (f.res === 'set') { if (hi > 0 && t > a - hi && t <= a) cls += ' ok'; if (t === a) cls += ' cur'; }
        else {
          if (t >= a - qq && t < a) cls += ' in';
          if (t === a) cls += f.res === 'ne' ? ' dup cur' : ' cur';
        }
      }
      el.className = cls;
    });
    pc.forEach(function (el, p) {
      var cls = 'va-cell';
      if (f.final && f.found >= 0) cls += ' ok';
      else if (!f.start && !f.final) {
        if (f.res === 'set') { if (p < hi) cls += ' ok'; }
        else {
          if (p < qq) cls += ' in';
          if (p === qq) cls += f.res === 'ne' ? ' dup cur' : ' cur';
        }
      }
      el.className = cls;
    });
    lc.forEach(function (el, p) {
      var set = p < f.lps.length, b = OR.$('b', el);
      b.textContent = set ? String(f.lps[p]) : '·';
      var cls = 'va-cell kmp-l' + (set ? ' kmp-set' : '');
      if (f.res === 'set' && p === f.a && phase === 'build') cls += ' cur';
      if (phase === 'search' && (f.step === 'jump') && p === f.q - 1) cls += ' cur';
      el.className = cls;
    });
    OR.$('.kmp-i', stage).innerHTML = f.start ? '<span class="faint">-</span>' : f.final ? '<span class="faint">end</span>' : '<b class="num">' + f.a + '</b>';
    var jEl = OR.$('.kmp-j', stage);
    jEl.innerHTML = f.step === 'jump' ? '<b class="num">' + f.q + '</b> <span class="faint">to</span> <b class="num">' + f.to + '</b>'
      : f.step === 'bfall' ? '<b class="num">' + f.q + '</b> <span class="faint">to</span> <b class="num">' + lpsOf(f, f.q) + '</b>'
      : '<b class="num">' + (f.start ? 0 : f.res === 'eq' ? f.q + ' → ' + (f.q + 1) : f.q) + '</b>';
    OR.$('.kmp-tab', stage).innerHTML = f.lps.map(function (v) { return '<span class="va-kv">' + v + '</span>'; }).join('');
  }
  function lpsOf(f, kk) { return f.lps[kk - 1]; }

  OR.viz.kmp = {
    build: build, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input kmp-input" novalidate><div class="kmp-fields">' +
        '<div><label class="field-label" for="kmp-t">Text</label><input class="input mono" id="kmp-t" maxlength="' + MAX_T + '" spellcheck="false" autocomplete="off" value="' + PRESETS[0][0] + '"></div>' +
        '<div><label class="field-label" for="kmp-p">Pattern</label><input class="input mono" id="kmp-p" maxlength="' + MAX_P + '" spellcheck="false" autocomplete="off" value="' + PRESETS[0][1] + '"></div>' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-i="' + i + '">' + p[0] + ' / ' + p[1] + '</button>'; }).join('') +
        '<span class="faint">Text up to ' + MAX_T + ' letters, pattern up to ' + MAX_P + '. Watch the jumps in ' + q('aaabaaaab') + ' / ' + q('aaaab') + '.</span></p></form><div class="va-player"></div>';
      var inT = OR.$('#kmp-t', host), inP = OR.$('#kmp-p', host), slot = OR.$('.va-player', host);

      function run(t, p) {
        t = t.slice(0, MAX_T); p = p.slice(0, MAX_P);
        if (player) player.destroy();
        slot.innerHTML = '';
        var B = build(t, p), W = Math.max(t.length, p.length * 2, 1);
        B.frames.forEach(function (f) { if (f.phase === 'search' && !f.start && !f.final) W = Math.max(W, f.a - f.q + p.length); });
        player = OR.player(slot, {
          frames: B.frames, steps: STEPS, label: 'KMP of ' + q(p) + ' in ' + q(t),
          paint: function (stage, f) { paint(t, p, W, stage, f); mark(MARK[f.step] || null); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(inT.value, inP.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-i]'); if (!b) return;
        var pr = PRESETS[+b.dataset.i]; inT.value = pr[0]; inP.value = pr[1]; run(pr[0], pr[1]);
      });
      run(PRESETS[0][0], PRESETS[0][1]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
