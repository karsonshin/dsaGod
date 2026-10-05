/* Offer Ready: code playground (#/playground). Scratch space that runs JavaScript offline and Python
   through Pyodide. Each language's code autosaves. Problem-specific editors live on the problem pages. */
(function () {
  'use strict';
  var OR = window.OR;
  var STARTER = {
    py: 'from collections import Counter\n\n# Python runs through Pyodide. The first run downloads it (about 10 MB), later runs are instant.\ncounts = Counter("mississippi")\nprint(counts.most_common(2))\n',
    js: '// JavaScript runs offline in a sandbox and stops after 5 seconds.\nconst counts = new Map();\nfor (const ch of "mississippi") counts.set(ch, (counts.get(ch) || 0) + 1);\nconsole.log([...counts].sort((a, b) => b[1] - a[1]).slice(0, 2));\n'
  };
  OR.views.playground = {
    title: function () { return 'Playground'; },
    render: function (main) {
      main.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><h1 class="page-title display">Playground</h1><p class="page-lede">Try an idea before you commit to it. JavaScript runs offline; Python needs internet for its first run. Java and C++ don’t run in the browser, so test those on LeetCode.</p></div></div>' +
        '<div id="pg-panel"></div></div>';
      OR.codePanel(OR.$('#pg-panel'), { key: 'playground', starter: STARTER });
    }
  };
})();
