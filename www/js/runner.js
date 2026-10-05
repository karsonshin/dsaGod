/* Offer Ready: code runner.
   JavaScript runs in a fresh Web Worker per run (built from a Blob, so it works from file://),
   killed after a time limit. Python runs in Pyodide inside a long-lived worker, lazy-loaded from
   jsDelivr on the first Python run; a timeout kills that worker and the next run reloads it.
   Results come back as JSON-safe values and are compared on the main thread.

   tests: { fn: 'twoSum', cases: [{ args: [[2,7,11,15], 9], out: [0,1] }], compare?: 'exact' | 'unordered' | 'deep' | 'float',
            argTypes?: [null, 'list' | 'tree'], outType?: 'list' | 'tree', inPlace?: argIndex,
            design?: true  (cases are { ops: ['LRUCache','put','get'], args: [[2],[1,1],[1]], out: [null,null,1] }) }
   A case may set any: true when out is a list of acceptable answers. */
(function () {
  'use strict';
  var OR = window.OR;
  var PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  var JS_LIMIT = 5000, PY_LIMIT = 10000, PY_LOAD_LIMIT = 90000;
  var OFFLINE_PY = 'Python runner needs internet; JS runs offline.';

  /* ---------- Worker sources (serialized with Function.prototype.toString) ---------- */
  function jsWorker() {
    var logs = [], size = 0, truncated = false;
    function fmt(v) {
      if (typeof v === 'string') return v;
      try { var s = JSON.stringify(v, function (k, x) { return x instanceof Map ? Array.from(x) : x instanceof Set ? Array.from(x) : x === undefined ? null : x; }); return s === undefined ? String(v) : s; }
      catch (e) { return String(v); }
    }
    function push(args) {
      if (truncated) return;
      var s = Array.prototype.map.call(args, fmt).join(' ');
      size += s.length + 1;
      if (size > 20000 || logs.length >= 1000) { truncated = true; return; }
      logs.push({ kind: 'log', text: s });
    }
    var log = function () { push(arguments); };
    self.console = { log: log, info: log, warn: log, error: log, debug: log, table: log };
    function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }
    function TreeNode(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; }
    function toList(a) { var d = new ListNode(), t = d; (a || []).forEach(function (v) { t = t.next = new ListNode(v); }); return d.next; }
    function fromList(n) { var a = []; while (n && a.length < 10000) { a.push(n.val); n = n.next; } return a; }
    function toTree(a) {
      if (!a || !a.length || a[0] === null) return null;
      var root = new TreeNode(a[0]), q = [root], i = 1;
      while (q.length && i < a.length) {
        var n = q.shift();
        if (i < a.length && a[i] !== null) q.push(n.left = new TreeNode(a[i])); i++;
        if (i < a.length && a[i] !== null) q.push(n.right = new TreeNode(a[i])); i++;
      }
      return root;
    }
    function fromTree(r) {
      var out = [], q = [r];
      while (q.length && out.length < 20000) { var n = q.shift(); if (!n) { out.push(null); continue; } out.push(n.val); q.push(n.left, n.right); }
      while (out.length && out[out.length - 1] === null) out.pop();
      return out;
    }
    function conv(v, t) { return t === 'list' ? toList(v) : t === 'tree' ? toTree(v) : v; }
    function back(v) {
      if (v instanceof ListNode) return fromList(v);
      if (v instanceof TreeNode) return fromTree(v);
      if (v === undefined) return null;
      if (v instanceof Set || v instanceof Map) return Array.from(v);
      if (typeof v === 'number' && !isFinite(v)) return String(v);
      return v;
    }
    function clean(v) { try { return JSON.parse(JSON.stringify(back(v), function (k, x) { return k === '' ? x : back(x); })); } catch (e) { return String(v); } }
    function msg(e) { return e && e.name ? e.name + ': ' + e.message : String(e); }
    self.onmessage = function (e) {
      var d = e.data, res = { cases: [], logs: logs }, t = d.tests, t0 = performance.now();
      try {
        var name = t && (t.design ? t.cases[0].ops[0] : t.fn);
        var expr = name ? '(typeof ' + name + ' !== "undefined" ? ' + name + ' : (typeof Solution !== "undefined" ? Solution : undefined))' : 'undefined';
        var target = new Function('ListNode', 'TreeNode', d.code + '\n;return ' + expr + ';')(ListNode, TreeNode);
        if (t) {
          if (typeof target !== 'function') throw new Error('Define ' + (t.design ? 'class ' : 'function ') + name + ' so the tests can call it.');
          var call = target;
          if (!t.design && target.prototype && typeof target.prototype[t.fn] === 'function') { var inst = new target(); call = function () { return inst[t.fn].apply(inst, arguments); }; }
          t.cases.forEach(function (c) {
            var c0 = performance.now();
            try {
              if (t.design) {
                var obj = new target(...JSON.parse(JSON.stringify(c.args[0] || []))), outs = [null];
                for (var k = 1; k < c.ops.length; k++) {
                  if (typeof obj[c.ops[k]] !== 'function') throw new Error(name + ' has no method ' + c.ops[k]);
                  outs.push(clean(obj[c.ops[k]].apply(obj, JSON.parse(JSON.stringify(c.args[k] || [])))));
                }
                res.cases.push({ got: outs, ms: performance.now() - c0 });
              } else {
                var args = JSON.parse(JSON.stringify(c.args)).map(function (a, i) { return conv(a, t.argTypes && t.argTypes[i]); });
                var got = call.apply(null, args);
                if (t.inPlace != null) got = args[t.inPlace];
                res.cases.push({ got: clean(got), ms: performance.now() - c0 });
              }
            } catch (err) { res.cases.push({ error: msg(err), ms: performance.now() - c0 }); }
          });
        }
      } catch (err) { res.error = msg(err); }
      res.ms = performance.now() - t0;
      res.truncated = truncated;
      self.postMessage(res);
    };
  }

  var PY_HARNESS = [
    'import sys, io, json, time, traceback',
    'class ListNode:',
    '    def __init__(self, val=0, next=None): self.val = val; self.next = next',
    'class TreeNode:',
    '    def __init__(self, val=0, left=None, right=None): self.val = val; self.left = left; self.right = right',
    'def _to_list(a):',
    '    d = t = ListNode()',
    '    for v in a or []: t.next = ListNode(v); t = t.next',
    '    return d.next',
    'def _from_list(n):',
    '    out = []',
    '    while n is not None and len(out) < 10000: out.append(n.val); n = n.next',
    '    return out',
    'def _to_tree(a):',
    '    if not a or a[0] is None: return None',
    '    root = TreeNode(a[0]); q = [root]; i = 1',
    '    while q and i < len(a):',
    '        n = q.pop(0)',
    '        if i < len(a) and a[i] is not None: n.left = TreeNode(a[i]); q.append(n.left)',
    '        i += 1',
    '        if i < len(a) and a[i] is not None: n.right = TreeNode(a[i]); q.append(n.right)',
    '        i += 1',
    '    return root',
    'def _from_tree(r):',
    '    out = []; q = [r]',
    '    while q and len(out) < 20000:',
    '        n = q.pop(0)',
    '        if n is None: out.append(None); continue',
    '        out.append(n.val); q.append(n.left); q.append(n.right)',
    '    while out and out[-1] is None: out.pop()',
    '    return out',
    'def _plain(v):',
    '    if isinstance(v, ListNode): return _from_list(v)',
    '    if isinstance(v, TreeNode): return _from_tree(v)',
    '    if isinstance(v, (list, tuple, set, frozenset)): return [_plain(x) for x in v]',
    '    if isinstance(v, dict): return {str(k): _plain(x) for k, x in v.items()}',
    '    if isinstance(v, float) and (v != v or v in (float("inf"), float("-inf"))): return str(v)',
    '    if v is None or isinstance(v, (bool, int, float, str)): return v',
    '    return repr(v)',
    'class _Out(io.StringIO):',
    '    cut = False',
    '    def write(self, s):',
    '        room = 20000 - self.tell()',
    '        if len(s) > room: self.cut = True; s = s[:max(0, room)]',
    '        return super().write(s)',
    '_PRELUDE = "from typing import *\\nimport collections, heapq, bisect, math, itertools, functools, string, re\\nfrom collections import deque, defaultdict, Counter, OrderedDict\\nfrom functools import cache, lru_cache, reduce\\nfrom heapq import heappush, heappop, heapify, heappushpop, nlargest, nsmallest\\nfrom bisect import bisect_left, bisect_right, insort\\nfrom math import inf\\n"',
    'def _err():',
    '    e = sys.exc_info()',
    '    tb = [f for f in traceback.extract_tb(e[2]) if f.filename == "solution.py"]',
    '    where = f" (line {tb[-1].lineno})" if tb else ""',
    '    return f"{e[0].__name__}: {e[1]}{where}"',
    'def _or_run(code, tests_json):',
    '    t = json.loads(tests_json)',
    '    out = _Out(); old = (sys.stdout, sys.stderr); sys.stdout = sys.stderr = out',
    '    res = {"cases": []}; t0 = time.perf_counter()',
    '    ns = {"__name__": "__main__", "ListNode": ListNode, "TreeNode": TreeNode}',
    '    try:',
    '        exec(_PRELUDE, ns)',
    '        exec(compile(code, "solution.py", "exec"), ns)',
    '        if t:',
    '            name = t["cases"][0]["ops"][0] if t.get("design") else t["fn"]',
    '            target = ns.get(name)',
    '            if target is None and "Solution" in ns and not t.get("design"): target = getattr(ns["Solution"](), name, None)',
    '            if target is None: raise NameError(("class " if t.get("design") else "function ") + name + " is not defined, so the tests can’t call it")',
    '            types = t.get("argTypes") or []',
    '            for c in t["cases"]:',
    '                c0 = time.perf_counter()',
    '                try:',
    '                    if t.get("design"):',
    '                        obj = target(*json.loads(json.dumps(c["args"][0] or []))); outs = [None]',
    '                        for op, a in zip(c["ops"][1:], c["args"][1:]): outs.append(_plain(getattr(obj, op)(*json.loads(json.dumps(a or [])))))',
    '                        res["cases"].append({"got": outs, "ms": (time.perf_counter() - c0) * 1000})',
    '                    else:',
    '                        args = json.loads(json.dumps(c["args"]))',
    '                        args = [_to_list(a) if i < len(types) and types[i] == "list" else _to_tree(a) if i < len(types) and types[i] == "tree" else a for i, a in enumerate(args)]',
    '                        got = target(*args)',
    '                        if t.get("inPlace") is not None: got = args[t["inPlace"]]',
    '                        res["cases"].append({"got": _plain(got), "ms": (time.perf_counter() - c0) * 1000})',
    '                except Exception:',
    '                    res["cases"].append({"error": _err(), "ms": (time.perf_counter() - c0) * 1000})',
    '    except Exception:',
    '        res["error"] = _err()',
    '    finally:',
    '        sys.stdout, sys.stderr = old',
    '    res["ms"] = (time.perf_counter() - t0) * 1000',
    '    res["logs"] = [{"kind": "log", "text": out.getvalue()}] if out.getvalue() else []',
    '    res["truncated"] = out.cut',
    '    return json.dumps(res)'
  ].join('\n');

  function pyWorker(cfg) {
    var py = null, loading = null;
    function load() {
      return new Promise(function (resolve, reject) {
        try { importScripts(cfg.url + 'pyodide.js'); } catch (e) { reject(new Error('download')); return; }
        loadPyodide({ indexURL: cfg.url }).then(function (p) { py = p; py.runPython(cfg.harness); resolve(); }, reject);
      });
    }
    self.onmessage = function (e) {
      if (!loading) loading = load();
      loading.then(function () {
        self.postMessage({ type: 'ready' });
        var out;
        try { out = JSON.parse(py.globals.get('_or_run')(e.data.code, JSON.stringify(e.data.tests || null))); }
        catch (err) { out = { cases: [], logs: [], error: String(err && err.message || err) }; }
        self.postMessage({ type: 'result', data: out });
      }, function (err) { self.postMessage({ type: 'load-error', error: String(err && err.message || err) }); });
    };
  }

  function spawn(fn, arg) {
    var url = URL.createObjectURL(new Blob(['(' + fn.toString() + ')(' + (arg === undefined ? '' : JSON.stringify(arg)) + ');'], { type: 'text/javascript' }));
    try { return new Worker(url); }
    finally { setTimeout(function () { URL.revokeObjectURL(url); }, 30000); }
  }

  /* ---------- Comparing answers ---------- */
  function key(v) { return JSON.stringify(v); }
  function canon(v, deep, top) {
    if (!Array.isArray(v)) return v;
    var a = v.map(function (x) { return deep ? canon(x, deep, false) : x; });
    return (deep || top) ? a.sort(function (x, y) { var p = key(x), q = key(y); return p < q ? -1 : p > q ? 1 : 0; }) : a;
  }
  function near(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b));
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every(function (x, i) { return near(x, b[i]); });
    return key(a) === key(b);
  }
  function same(got, want, mode) {
    if (mode === 'float') return near(got, want);
    if (mode === 'unordered' || mode === 'deep') return key(canon(got, mode === 'deep', true)) === key(canon(want, mode === 'deep', true));
    return key(got) === key(want);
  }
  OR.sameAnswer = same;
  function grade(res, tests) {
    if (!tests || !res.cases) return res;
    res.cases.forEach(function (c, i) {
      var tc = tests.cases[i];
      if (c.error) { c.pass = false; return; }
      c.pass = tc.any ? tc.out.some(function (o) { return same(c.got, o, tests.compare); }) : same(c.got, tc.out, tests.compare);
    });
    return res;
  }

  /* ---------- Python worker lifecycle ---------- */
  var pw = null, pyReady = false;
  function killPy() { if (pw) pw.terminate(); pw = null; pyReady = false; }

  function runPy(code, tests) {
    return new Promise(function (resolve) {
      if (!navigator.onLine && !pyReady) { resolve({ unavailable: OFFLINE_PY }); return; }
      if (!pw) {
        try { pw = spawn(pyWorker, { url: PYODIDE, harness: PY_HARNESS }); }
        catch (e) { resolve({ unavailable: 'This browser blocked the Python worker (' + e.message + '). JavaScript may still run.' }); return; }
      }
      var w = pw, limit = pyReady ? PY_LIMIT : PY_LOAD_LIMIT, timer = setTimeout(onTimeout, limit);
      function done(r) { clearTimeout(timer); w.onmessage = null; w.onerror = null; resolve(r); }
      function onTimeout() { // limit switches to PY_LIMIT once Pyodide has loaded
        killPy();
        done(limit === PY_LIMIT
          ? { timedOut: 'Stopped after ' + (PY_LIMIT / 1000) + ' seconds. Look for an infinite loop or a very slow approach. Python restarts on the next run, which takes a few seconds.', cases: [], logs: [] }
          : { unavailable: 'Python took too long to download. Check your connection and run again. ' + OFFLINE_PY });
      }
      w.onmessage = function (e) {
        var m = e.data;
        if (m.type === 'ready') { if (!pyReady) { pyReady = true; clearTimeout(timer); timer = setTimeout(onTimeout, limit = PY_LIMIT); } return; }
        if (m.type === 'load-error') { killPy(); done({ unavailable: OFFLINE_PY + (m.error && m.error !== 'download' ? ' (' + m.error + ')' : '') }); return; }
        done(grade(m.data, tests));
      };
      w.onerror = function (e) { e.preventDefault(); killPy(); done({ unavailable: OFFLINE_PY }); };
      w.postMessage({ code: code, tests: tests });
    });
  }

  function runJs(code, tests) {
    return new Promise(function (resolve) {
      var w;
      try { w = spawn(jsWorker); }
      catch (e) { resolve({ unavailable: 'This browser blocked the code sandbox (' + e.message + '), so code can’t run here.' }); return; }
      var timer = setTimeout(function () {
        w.terminate();
        resolve({ timedOut: 'Stopped after ' + (JS_LIMIT / 1000) + ' seconds. Look for an infinite loop or a very slow approach.', cases: [], logs: [] });
      }, JS_LIMIT);
      w.onmessage = function (e) { clearTimeout(timer); w.terminate(); resolve(grade(e.data, tests)); };
      w.onerror = function (e) { e.preventDefault(); clearTimeout(timer); w.terminate(); resolve({ error: e.message || 'The code could not run.', cases: [], logs: [] }); };
      w.postMessage({ code: code, tests: tests });
    });
  }

  OR.runner = {
    canRun: function (lang) { return lang === 'js' || lang === 'py'; },
    pyReady: function () { return pyReady; },
    // Resolves (never rejects) with { cases:[{ got, pass, error, ms }], logs, truncated, error, ms, timedOut, unavailable }.
    run: function (o) {
      if (o.lang === 'py') return runPy(o.code, o.tests);
      if (o.lang === 'js') return runJs(o.code, o.tests);
      return Promise.resolve({ unavailable: OR.langName(o.lang) + ' can’t run in the browser. Run it on LeetCode, or switch the editor to Python or JavaScript.' });
    }
  };
})();
