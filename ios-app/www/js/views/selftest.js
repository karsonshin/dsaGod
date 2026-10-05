/* Offer Ready: hidden self-test (#/selftest). Runs every practice solution that has test cases through the
   in-browser runner and reports pass/fail. JavaScript runs offline; Python needs Pyodide (internet). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  function jobs(lang) {
    var out = [];
    OR.topics.forEach(function (t) {
      (t.practice || []).forEach(function (p) {
        var code = p.solution && p.solution.code && p.solution.code[lang];
        if (code && p.tests) out.push({ topic: t.id, lc: p.lc, code: code, tests: p.tests });
      });
    });
    return out;
  }

  OR.views.selftest = {
    title: function () { return 'Self-test'; },
    render: function (main) {
      var live = true;
      main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Self-test</h1>' +
        '<p class="page-lede">Runs each practice solution against its test cases in this browser.</p></div>' +
        '<div class="btn-row"><button class="btn btn-primary" data-lang="js">Run JavaScript</button><button class="btn" data-lang="py">Run Python (needs internet)</button></div></div>' +
        '<p id="st-sum" class="muted" role="status"></p><ul id="st-list" class="mk-trend"></ul></div>';
      var sum = OR.$('#st-sum', main), list = OR.$('#st-list', main);
      OR.$$('[data-lang]', main).forEach(function (b) {
        b.onclick = async function () {
          var lang = b.dataset.lang, js = jobs(lang), ok = 0, bad = 0;
          list.innerHTML = '';
          for (var i = 0; i < js.length && live; i++) {
            var j = js[i], r = await OR.runner.run({ lang: lang, code: j.code, tests: j.tests });
            var pass = !r.error && !r.unavailable && !r.timedOut && r.cases && r.cases.length > 0 && r.cases.every(function (c) { return c.pass; });
            pass ? ok++ : bad++;
            if (!pass) list.insertAdjacentHTML('beforeend', '<li><span class="num">' + j.lc + '</span><span>' + esc(j.topic) + ': ' + esc(r.error || r.unavailable || 'a case failed') + '</span><span></span><span class="num">FAIL</span></li>');
            sum.textContent = lang.toUpperCase() + ': ' + ok + ' pass, ' + bad + ' fail, of ' + js.length + (i + 1 === js.length ? '. Done.' : '…');
          }
        };
      });
      return function () { live = false; };
    }
  };
})();
