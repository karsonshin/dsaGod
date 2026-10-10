"""Verify topic content in data/topics/*.js.

Every runnable snippet (template, variations, worked solutions, practice solutions) is run in each
language it is written in, Python, JavaScript, Java and C++, against the tests beside it, and the
lesson data is linted (practice problems exist in the bank, hints and tests are present, quiz answers
are in range, flashcard and detective ids are unique, detective decoys are real topics). Comparison matches the in-app runner (js/runner.js).

Java and C++ need a signature on the tests: sig: { args: ['str', 'int[]', ...] }. Types: int long
float bool str char int[] long[] float[] char[] str[] int[][] char[][] list<int> list<str> list<list<int>>.
tests.fn may be a string or a per-language map { py, js, java, cpp, default }.

Run: python tools/verify_content.py [topic-id ...]     (needs node, python, javac/java, g++)
"""
import glob, json, math, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMEOUT = 30

LOAD = ("global.window = global; const fs = require('fs'), vm = require('vm');"
        "for (const f of process.argv.slice(1)) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });"
        "process.stdout.write(JSON.stringify({ topics: window.OR.topics || [], problems: window.OR.problems || [], curriculum: (window.OR.curriculum || []).map(t => t.id) }));")


def load():
    files = [os.path.join(ROOT, 'data', 'curriculum.js'), os.path.join(ROOT, 'data', 'problems.js')] + sorted(glob.glob(os.path.join(ROOT, 'data', 'topics', '*.js')))
    r = subprocess.run(['node', '-e', LOAD, *files], capture_output=True, text=True, encoding='utf-8')
    if r.returncode: sys.exit('could not load topic files:\n' + r.stderr)
    return json.loads(r.stdout)


# ---------- comparison (mirrors js/runner.js) ----------
def norm(v):
    if isinstance(v, float) and v.is_integer(): return int(v)
    if isinstance(v, list): return [norm(x) for x in v]
    return v
def key(v): return json.dumps(v, separators=(',', ':'))
def canon(v, deep, top):
    if not isinstance(v, list): return v
    a = [canon(x, deep, False) if deep else x for x in v]
    return sorted(a, key=key) if (deep or top) else a
def near(a, b):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
        return abs(a - b) <= 1e-5 * max(1, abs(b))
    if isinstance(a, list) and isinstance(b, list): return len(a) == len(b) and all(near(x, y) for x, y in zip(a, b))
    return key(a) == key(b)
def same(got, want, mode):
    got, want = norm(got), norm(want)
    if mode == 'float': return near(got, want)
    if mode in ('unordered', 'deep'): return key(canon(got, mode == 'deep', True)) == key(canon(want, mode == 'deep', True))
    return key(got) == key(want)
def passes(res, case, mode):
    if 'error' in res: return False
    return any(same(res['got'], o, mode) for o in case['out']) if case.get('any') else same(res['got'], case['out'], mode)


# ---------- Python ----------
PY = r'''
import json, sys
from typing import *
import collections, heapq, bisect, math, itertools, functools, string, re
from collections import deque, defaultdict, Counter, OrderedDict
from functools import cache, lru_cache, reduce
from heapq import heappush, heappop, heapify, heappushpop, nlargest, nsmallest
from bisect import bisect_left, bisect_right, insort
from math import inf
class ListNode:
    def __init__(self, val=0, next=None): self.val = val; self.next = next
class TreeNode:
    def __init__(self, val=0, left=None, right=None): self.val = val; self.left = left; self.right = right
def to_list(a):
    d = t = ListNode()
    for v in a or []: t.next = ListNode(v); t = t.next
    return d.next
def to_tree(a):
    if not a or a[0] is None: return None
    root = TreeNode(a[0]); q = [root]; i = 1
    while q and i < len(a):
        n = q.pop(0)
        if i < len(a) and a[i] is not None: n.left = TreeNode(a[i]); q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None: n.right = TreeNode(a[i]); q.append(n.right)
        i += 1
    return root
def plain(v):
    if isinstance(v, ListNode):
        out = []
        while v is not None and len(out) < 10000: out.append(v.val); v = v.next
        return out
    if isinstance(v, TreeNode):
        out, q = [], [v]
        while q:
            n = q.pop(0)
            if n is None: out.append(None); continue
            out.append(n.val); q += [n.left, n.right]
        while out and out[-1] is None: out.pop()
        return out
    if isinstance(v, (list, tuple, set, frozenset)): return [plain(x) for x in v]
    return v
d = json.load(open(sys.argv[1], encoding='utf-8')); t = d['tests']; ns = dict(globals())
exec(compile(d['code'], 'solution.py', 'exec'), ns)
types = t.get('argTypes') or []
out = []
for c in t['cases']:
    try:
        if t.get('design'):
            obj = ns[c['ops'][0]](*c['args'][0]); res = [None]
            for op, a in zip(c['ops'][1:], c['args'][1:]): res.append(plain(getattr(obj, op)(*a)))
            out.append({'got': res}); continue
        f = ns.get(d['fn']) or getattr(ns['Solution'](), d['fn'])
        args = [to_list(a) if i < len(types) and types[i] == 'list' else to_tree(a) if i < len(types) and types[i] == 'tree' else a for i, a in enumerate(json.loads(json.dumps(c['args'])))]
        got = f(*args)
        if t.get('inPlace') is not None: got = args[t['inPlace']]
        out.append({'got': plain(got)})
    except Exception as e:
        out.append({'error': type(e).__name__ + ': ' + str(e)})
print(json.dumps(out))
'''

# ---------- JavaScript ----------
JS = r'''
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8')), t = d.tests;
function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }
function TreeNode(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; }
const toList = a => { const h = new ListNode(); let x = h; (a || []).forEach(v => { x = x.next = new ListNode(v); }); return h.next; };
const toTree = a => { if (!a || !a.length || a[0] === null) return null; const r = new TreeNode(a[0]), q = [r]; let i = 1;
  while (q.length && i < a.length) { const n = q.shift(); if (i < a.length && a[i] !== null) q.push(n.left = new TreeNode(a[i])); i++; if (i < a.length && a[i] !== null) q.push(n.right = new TreeNode(a[i])); i++; } return r; };
const plain = v => { if (v instanceof ListNode) { const o = []; while (v && o.length < 10000) { o.push(v.val); v = v.next; } return o; }
  if (v instanceof TreeNode) { const o = [], q = [v]; while (q.length) { const n = q.shift(); if (!n) { o.push(null); continue; } o.push(n.val); q.push(n.left, n.right); } while (o.length && o[o.length - 1] === null) o.pop(); return o; }
  if (v instanceof Set || v instanceof Map) return Array.from(v); if (Array.isArray(v)) return v.map(plain); return v === undefined ? null : v; };
const name = t.design ? t.cases[0].ops[0] : d.fn;
const target = new Function('ListNode', 'TreeNode', d.code + '\n;return typeof ' + name + ' !== "undefined" ? ' + name + ' : (typeof Solution !== "undefined" ? Solution : undefined);')(ListNode, TreeNode);
const out = t.cases.map(c => { try {
  if (t.design) { const o = new target(...c.args[0]); return { got: [null].concat(c.ops.slice(1).map((op, k) => plain(o[op](...c.args[k + 1])))) }; }
  const args = JSON.parse(JSON.stringify(c.args)).map((a, i) => (t.argTypes || [])[i] === 'list' ? toList(a) : (t.argTypes || [])[i] === 'tree' ? toTree(a) : a);
  const f = target.prototype && target.prototype[d.fn] ? (...x) => new target()[d.fn](...x) : target;
  let got = f(...args); if (t.inPlace != null) got = args[t.inPlace]; return { got: plain(got) };
} catch (e) { return { error: e.name + ': ' + e.message }; } });
console.log(JSON.stringify(out));
'''

# ---------- Java / C++ harness generation ----------
def jlit(v, t):
    if t == 'int': return str(int(v))
    if t == 'long': return str(int(v)) + 'L'
    if t == 'float': return repr(float(v))
    if t == 'bool': return 'true' if v else 'false'
    if t == 'str': return json.dumps(v)
    if t == 'char': return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if t.endswith('[][]'): return 'new ' + JTYPE[t] + '{' + ','.join('{' + ','.join(jlit(x, t[:-4]) for x in row) + '}' for row in v) + '}'
    if t.endswith('[]'): return 'new ' + JTYPE[t] + '{' + ','.join(jlit(x, t[:-2]) for x in v) + '}'
    if t == 'list<int>': return 'new ArrayList<Integer>(List.of(' + ','.join(str(x) for x in v) + '))'
    if t == 'list<str>': return 'new ArrayList<String>(List.of(' + ','.join(json.dumps(x) for x in v) + '))'
    if t == 'list<list<int>>': return 'new ArrayList<List<Integer>>(List.of(' + ','.join(jlit(x, 'list<int>') for x in v) + '))'
    raise ValueError('unknown Java type ' + t)
JTYPE = {'int[]': 'int[]', 'long[]': 'long[]', 'float[]': 'double[]', 'char[]': 'char[]', 'str[]': 'String[]', 'int[][]': 'int[][]', 'char[][]': 'char[][]'}
CTYPE = {'int': 'int', 'long': 'long long', 'float': 'double', 'bool': 'bool', 'str': 'string', 'char': 'char'}
def clit(v, t):
    if t == 'int': return str(int(v))
    if t == 'long': return str(int(v)) + 'LL'
    if t == 'float': return repr(float(v))
    if t == 'bool': return 'true' if v else 'false'
    if t == 'str': return 'string(' + json.dumps(v) + ')'
    if t == 'char': return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if t in ('list<int>', 'int[]', 'long[]', 'float[]', 'char[]', 'str[]', 'list<str>'):
        inner = {'list<int>': 'int', 'int[]': 'int', 'long[]': 'long', 'float[]': 'float', 'char[]': 'char', 'str[]': 'str', 'list<str>': 'str'}[t]
        return 'vector<' + CTYPE[inner] + '>{' + ','.join(clit(x, inner) for x in v) + '}'
    if t in ('int[][]', 'list<list<int>>'): return 'vector<vector<int>>{' + ','.join(clit(x, 'int[]') for x in v) + '}'
    if t == 'char[][]': return 'vector<vector<char>>{' + ','.join(clit(x, 'char[]') for x in v) + '}'
    raise ValueError('unknown C++ type ' + t)

JAVA_MAIN = r'''
public class Main {
  static String j(Object o) {
    if (o == null) return "null";
    if (o instanceof String s) { StringBuilder b = new StringBuilder("\""); for (char ch : s.toCharArray()) { if (ch == '"' || ch == '\\') b.append('\\'); b.append(ch); } return b.append('"').toString(); }
    if (o instanceof Character c) return j(String.valueOf(c));
    if (o instanceof int[] a) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < a.length; i++) b.append(i > 0 ? "," : "").append(a[i]); return b.append("]").toString(); }
    if (o instanceof long[] a) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < a.length; i++) b.append(i > 0 ? "," : "").append(a[i]); return b.append("]").toString(); }
    if (o instanceof double[] a) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < a.length; i++) b.append(i > 0 ? "," : "").append(a[i]); return b.append("]").toString(); }
    if (o instanceof char[] a) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < a.length; i++) b.append(i > 0 ? "," : "").append(j(a[i])); return b.append("]").toString(); }
    if (o instanceof Object[] a) return j(java.util.Arrays.asList(a));
    if (o instanceof java.util.Collection<?> c) { StringBuilder b = new StringBuilder("["); boolean f = true; for (Object x : c) { b.append(f ? "" : ",").append(j(x)); f = false; } return b.append("]").toString(); }
    return String.valueOf(o);
  }
  public static void main(String[] args) {
    Solution s;
%BODY%
  }
}
'''
CPP_HEAD = r'''#include <bits/stdc++.h>
using namespace std;
'''
CPP_JSON = r'''
string js(int x) { return to_string(x); }
string js(long x) { return to_string(x); }
string js(long long x) { return to_string(x); }
string js(unsigned x) { return to_string(x); }
string js(bool x) { return x ? "true" : "false"; }
string js(double x) { ostringstream o; o << setprecision(12) << x; return o.str(); }
string js(const string& s) { string o = "\""; for (char c : s) { if (c == '"' || c == '\\') o += '\\'; o += c; } return o + "\""; }
string js(char c) { return js(string(1, c)); }
template <class T> string js(const vector<T>& v) { string o = "["; for (size_t i = 0; i < v.size(); i++) { if (i) o += ","; o += js(v[i]); } return o + "]"; }
'''

def fn_for(tests, lang):
    f = tests.get('fn')
    return f.get(lang) or f.get('default') if isinstance(f, dict) else f

def run_py(code, tests, tmp):
    data = os.path.join(tmp, 'd.json'); json.dump({'code': code, 'tests': tests, 'fn': fn_for(tests, 'py')}, open(data, 'w', encoding='utf-8'))
    h = os.path.join(tmp, 'h.py'); open(h, 'w', encoding='utf-8').write(PY)
    return subprocess.run([sys.executable, h, data], capture_output=True, text=True, timeout=TIMEOUT, encoding='utf-8')

def run_js(code, tests, tmp):
    data = os.path.join(tmp, 'd.json'); json.dump({'code': code, 'tests': tests, 'fn': fn_for(tests, 'js')}, open(data, 'w', encoding='utf-8'))
    h = os.path.join(tmp, 'h.js'); open(h, 'w', encoding='utf-8').write(JS)
    return subprocess.run(['node', h, data], capture_output=True, text=True, timeout=TIMEOUT, encoding='utf-8')

def run_java(code, tests, tmp):
    sig = tests['sig']['args']; fn = fn_for(tests, 'java'); lines = []
    for c in tests['cases']:
        decl = ''.join('      var a%d = %s;\n' % (i, jlit(v, t)) for i, (v, t) in enumerate(zip(c['args'], sig)))
        call = 's.%s(%s)' % (fn, ', '.join('a%d' % i for i in range(len(sig))))
        show = ('%s; System.out.println(j(a%d));' % (call, tests['inPlace'])) if tests.get('inPlace') is not None else 'System.out.println(j(%s));' % call
        lines.append('    try {\n      s = new Solution();\n%s      %s\n    } catch (Exception e) { System.out.println("{\\"error\\": " + j(e.toString()) + "}"); }' % (decl, show))
    imports = [l for l in code.split('\n') if l.strip().startswith('import ')]
    body = '\n'.join(l for l in code.split('\n') if not l.strip().startswith('import '))
    src = 'import java.util.*;\n' + '\n'.join(imports) + '\n' + body + '\n' + JAVA_MAIN.replace('%BODY%', '\n'.join(lines))
    open(os.path.join(tmp, 'Main.java'), 'w', encoding='utf-8').write(src)
    c = subprocess.run(['javac', '-nowarn', 'Main.java'], cwd=tmp, capture_output=True, text=True, timeout=120)
    if c.returncode: return c
    return subprocess.run(['java', '-cp', tmp, 'Main'], capture_output=True, text=True, timeout=TIMEOUT)

def run_cpp(code, tests, tmp):
    sig = tests['sig']['args']; fn = fn_for(tests, 'cpp'); lines = []
    for c in tests['cases']:
        decl = ''.join('    { auto a%d = %s;\n' % (i, clit(v, t)) if i == 0 else '      auto a%d = %s;\n' % (i, clit(v, t)) for i, (v, t) in enumerate(zip(c['args'], sig)))
        if not sig: decl = '    {\n'
        call = 's.%s(%s)' % (fn, ', '.join('a%d' % i for i in range(len(sig))))
        show = ('%s; cout << js(a%d) << "\\n";' % (call, tests['inPlace'])) if tests.get('inPlace') is not None else 'cout << js(%s) << "\\n";' % call
        lines.append(decl + '      Solution s; ' + show + ' }')
    src = CPP_HEAD + code + '\n' + CPP_JSON + 'int main() {\n' + '\n'.join(lines) + '\n}\n'
    open(os.path.join(tmp, 'main.cpp'), 'w', encoding='utf-8').write(src)
    exe = os.path.join(tmp, 'main.exe')
    c = subprocess.run(['g++', '-std=c++17', '-O2', '-o', exe, 'main.cpp'], cwd=tmp, capture_output=True, text=True, timeout=180)
    if c.returncode: return c
    return subprocess.run([exe], capture_output=True, text=True, timeout=TIMEOUT)

RUNNERS = {'py': run_py, 'js': run_js, 'java': run_java, 'cpp': run_cpp}

def check(code, tests, lang):
    if lang in ('java', 'cpp') and 'sig' not in tests: return None, 'no sig, skipped'
    if lang in ('java', 'cpp') and tests.get('design'): return None, 'design problems are checked in py/js only'
    tmp = tempfile.mkdtemp(prefix='or-verify-')
    try:
        r = RUNNERS[lang](code, tests, tmp)
        if r.returncode: return False, (r.stderr or r.stdout).strip()[-1500:]
        lines = [l for l in r.stdout.strip().split('\n') if l.strip()]
        if lang in ('py', 'js'): res = json.loads(lines[-1])  # [{got} | {error}] per case
        else: res = [x if isinstance(x, dict) and 'error' in x else {'got': x} for x in map(json.loads, lines)]  # one JSON value per case
        for i, (c, x) in enumerate(zip(tests['cases'], res)):
            if not passes(x, c, tests.get('compare')):
                return False, 'case %d: args=%s expected=%s got=%s' % (i + 1, json.dumps(c.get('args'))[:200], json.dumps(c.get('out'))[:200], json.dumps(x)[:200])
        if len(res) != len(tests['cases']): return False, 'ran %d of %d cases' % (len(res), len(tests['cases']))
        return True, '%d cases' % len(res)
    except subprocess.TimeoutExpired:
        return False, 'timed out'
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

def units(t):
    by_lc = {p['lc']: p.get('tests') for p in t.get('practice', []) if p.get('tests')}
    tm = t.get('template') or {}
    if tm.get('tests'): yield 'template', tm['code'], tm['tests']
    for v in t.get('variations', []):
        if v.get('code') and v.get('tests'): yield 'variation "%s"' % v['name'], v['code'], v['tests']
    for w in t.get('worked', []):
        tests = w.get('tests') or by_lc.get(w.get('lc'))
        if w.get('code') and tests: yield 'worked %s' % w.get('lc', w.get('title')), w['code'], tests
    for p in t.get('practice', []):
        if p.get('solution') and p.get('tests'): yield 'practice %s' % p['lc'], p['solution']['code'], p['tests']

def lint(t, bank, curriculum):
    msgs = []
    worked_code = {w.get('lc') for w in t.get('worked', []) if w.get('code')}
    for p in t.get('practice', []):
        if p['lc'] not in bank: msgs.append('practice %s is not in data/problems.js' % p['lc'])
        for k in ('hints', 'solution', 'tests', 'starter'):
            if not p.get(k) and not (k == 'solution' and p['lc'] in worked_code):  # the worked walkthrough is its solution
                msgs.append('practice %s has no %s' % (p['lc'], k))
        if p.get('hints') and len(p['hints']) != 3: msgs.append('practice %s has %d hints (the ladder wants 3)' % (p['lc'], len(p['hints'])))
    for w in t.get('worked', []):
        if w.get('lc') and w['lc'] not in bank: msgs.append('worked %s is not in data/problems.js' % w['lc'])
        for k in ('java', 'cpp', 'py', 'js'):
            if k not in (w.get('code') or {}): msgs.append('worked %s has no %s solution' % (w.get('lc'), k))
    for i, q in enumerate(t.get('quiz', [])):
        ans = q['answer'] if isinstance(q['answer'], list) else [q['answer']]
        if any(a < 0 or a >= len(q['choices']) for a in ans): msgs.append('quiz %d answer out of range' % (i + 1))
        if not q.get('explain'): msgs.append('quiz %d has no explanation' % (i + 1))
    ids = [c.get('id') for c in t.get('flashcards', [])]
    if None in ids or len(set(ids)) != len(ids): msgs.append('flashcards need unique ids')
    ids = [d.get('id') for d in t.get('detective', [])]
    if None in ids or len(set(ids)) != len(ids): msgs.append('detective cases need unique ids')
    for d in t.get('detective', []):
        if not d.get('statement') or not d.get('why'): msgs.append('detective %s needs a statement and a why' % d.get('id'))
        bad = [x for x in d.get('decoys', []) if x not in curriculum or x == t['id']]
        if bad: msgs.append('detective %s has bad decoys %s' % (d.get('id'), bad))
    return msgs

def main():
    data = load(); only = set(sys.argv[1:]); bank = {p['lc'] for p in data['problems']}
    fails = 0
    for t in data['topics']:
        if only and t['id'] not in only: continue
        print('\n== %s' % t['id'])
        for m in lint(t, bank, set(data['curriculum'])): print('  lint: ' + m); fails += 1
        for name, code, tests in units(t):
            for lang in ('py', 'js', 'java', 'cpp'):
                if not code.get(lang): continue
                ok, msg = check(code[lang], tests, lang)
                if ok is None: print('  %-26s %-4s skip  %s' % (name, lang, msg)); continue
                print('  %-26s %-4s %s  %s' % (name, lang, 'pass' if ok else 'FAIL', msg if not ok else ''))
                fails += 0 if ok else 1
    print('\n%s' % ('all checks passed' if not fails else '%d problem(s)' % fails))
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
