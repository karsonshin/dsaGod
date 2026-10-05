/* Offer Ready: IDE-grade editor (Monaco, the engine behind VS Code), vendored in vendor/monaco and loaded lazily.
   Adds VS Code-style colors, autocomplete with method suggestions and docs, snippets, and rename-all (F2).
   It works from file:// (no web workers, no fetch). If Monaco can't load, OR.ide.load() rejects and the
   plain textarea editor in code.js stays in use. */
(function () {
  'use strict';
  var OR = window.OR, loading = null;

  /* From file:// the browser refuses web workers, so Monaco runs its small editor worker on the main thread
     and says so on every start. That is expected here, so drop just those two warnings. */
  var warn = console.warn;
  console.warn = function () {
    var m = String(arguments[0] || '');
    if (/web worker\(s\)|Invalid base URL/.test(m)) return;
    return warn.apply(console, arguments);
  };

  /* ---------- Loading ---------- */
  OR.ide = { load: load, create: create };
  function load() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'vendor/monaco/vs/loader.js';
      s.onerror = function () { loading = null; reject(new Error('Monaco loader missing')); };
      s.onload = function () {
        window.require.config({ paths: { vs: 'vendor/monaco/vs' } });
        window.require(['vs/editor/editor.main'], function () { setup(window.monaco); resolve(window.monaco); }, function (e) { loading = null; reject(e); });
      };
      document.head.appendChild(s);
    });
    return loading;
  }

  /* ---------- Completion data: [label, signature, doc] ---------- */
  var PY_KW = 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' ');
  var PY_BUILTINS = [
    ['len', 'len(obj) -> int', 'Number of items in a sequence or collection.'], ['range', 'range(stop) / range(start, stop, step)', 'An immutable sequence of integers.'],
    ['enumerate', 'enumerate(iterable, start=0)', 'Pairs of (index, item).'], ['zip', 'zip(*iterables)', 'Iterate several sequences in lockstep.'],
    ['sorted', 'sorted(iterable, key=None, reverse=False) -> list', 'A new sorted list; O(n log n).'], ['reversed', 'reversed(seq)', 'Iterator over a sequence backwards.'],
    ['min', 'min(iterable, key=None, default=...)', 'Smallest item, or smallest argument.'], ['max', 'max(iterable, key=None, default=...)', 'Largest item, or largest argument.'],
    ['sum', 'sum(iterable, start=0)', 'Total of the items.'], ['abs', 'abs(x)', 'Absolute value.'], ['any', 'any(iterable) -> bool', 'True if any item is truthy.'], ['all', 'all(iterable) -> bool', 'True if every item is truthy.'],
    ['map', 'map(func, *iterables)', 'Lazily apply a function to each item.'], ['filter', 'filter(func, iterable)', 'Lazily keep items where func is truthy.'],
    ['list', 'list(iterable=())', 'Build a list.'], ['dict', 'dict(**kw)', 'Build a dictionary.'], ['set', 'set(iterable=())', 'Build a set.'], ['tuple', 'tuple(iterable=())', 'Build a tuple.'], ['frozenset', 'frozenset(iterable=())', 'An immutable, hashable set.'],
    ['str', 'str(obj)', 'Convert to a string.'], ['int', 'int(x, base=10)', 'Convert to an integer.'], ['float', 'float(x)', 'Convert to a float.'], ['bool', 'bool(x)', 'Truthiness of a value.'],
    ['ord', 'ord(c) -> int', 'Code point of a one-character string.'], ['chr', 'chr(i) -> str', 'Character for a code point.'], ['divmod', 'divmod(a, b) -> (a // b, a % b)', 'Quotient and remainder together.'],
    ['pow', 'pow(base, exp, mod=None)', 'Power; the 3-argument form is fast modular exponentiation.'], ['round', 'round(x, ndigits=None)', 'Round to the nearest value (ties go to even).'],
    ['print', 'print(*values, sep=" ", end="\\n")', 'Write to the output panel.'], ['input', 'input(prompt="")', 'Read a line.'], ['isinstance', 'isinstance(obj, cls) -> bool', 'Type check.'],
    ['iter', 'iter(iterable)', 'Get an iterator.'], ['next', 'next(iterator, default)', 'Next item of an iterator.'], ['hash', 'hash(obj) -> int', 'Hash of a hashable object.'], ['id', 'id(obj) -> int', 'Identity of an object.'],
    ['bin', 'bin(n) -> str', 'Binary string such as "0b101".'], ['hex', 'hex(n) -> str', 'Hex string.'], ['float("inf")', 'float("inf")', 'Positive infinity, a common sentinel.']
  ];
  var LIST_M = [
    ['append', 'list.append(x)', 'Add x at the end. O(1) amortized.'], ['extend', 'list.extend(iterable)', 'Add every item of the iterable.'], ['insert', 'list.insert(i, x)', 'Insert before index i. O(n).'],
    ['pop', 'list.pop(i=-1)', 'Remove and return item i (default last). pop() is O(1), pop(0) is O(n).'], ['remove', 'list.remove(x)', 'Remove the first x. O(n).'], ['index', 'list.index(x)', 'Index of the first x, ValueError if absent.'],
    ['count', 'list.count(x)', 'Number of occurrences of x.'], ['sort', 'list.sort(key=None, reverse=False)', 'Sort in place. O(n log n).'], ['reverse', 'list.reverse()', 'Reverse in place.'], ['copy', 'list.copy()', 'Shallow copy.'], ['clear', 'list.clear()', 'Remove everything.']
  ];
  var STR_M = [
    ['split', 'str.split(sep=None, maxsplit=-1)', 'Split into a list of strings.'], ['join', 'str.join(iterable)', 'Join strings with this one between them.'], ['strip', 'str.strip(chars=None)', 'Trim both ends.'], ['lstrip', 'str.lstrip()', 'Trim the left.'], ['rstrip', 'str.rstrip()', 'Trim the right.'],
    ['lower', 'str.lower()', 'Lowercase copy.'], ['upper', 'str.upper()', 'Uppercase copy.'], ['replace', 'str.replace(old, new, count=-1)', 'Copy with replacements.'], ['find', 'str.find(sub)', 'Index of sub, or -1.'], ['index', 'str.index(sub)', 'Index of sub, ValueError if absent.'],
    ['count', 'str.count(sub)', 'Non-overlapping occurrences.'], ['startswith', 'str.startswith(prefix)', 'True if it starts with prefix.'], ['endswith', 'str.endswith(suffix)', 'True if it ends with suffix.'],
    ['isalpha', 'str.isalpha()', 'All letters?'], ['isdigit', 'str.isdigit()', 'All digits?'], ['isalnum', 'str.isalnum()', 'All letters or digits?'], ['isspace', 'str.isspace()', 'All whitespace?'], ['islower', 'str.islower()', ''], ['isupper', 'str.isupper()', ''],
    ['format', 'str.format(*args, **kw)', 'Fill {} placeholders.'], ['zfill', 'str.zfill(width)', 'Pad with zeros on the left.'], ['partition', 'str.partition(sep)', 'Split into (before, sep, after).']
  ];
  var DICT_M = [
    ['get', 'dict.get(key, default=None)', 'Value for key, or default. Never raises.'], ['items', 'dict.items()', 'View of (key, value) pairs.'], ['keys', 'dict.keys()', 'View of keys.'], ['values', 'dict.values()', 'View of values.'],
    ['pop', 'dict.pop(key, default)', 'Remove key and return its value.'], ['popitem', 'dict.popitem()', 'Remove and return the last inserted pair.'], ['setdefault', 'dict.setdefault(key, default=None)', 'Return the value, inserting default if missing.'],
    ['update', 'dict.update(other)', 'Merge another mapping in.'], ['copy', 'dict.copy()', 'Shallow copy.'], ['clear', 'dict.clear()', 'Remove everything.']
  ];
  var SET_M = [
    ['add', 'set.add(x)', 'Add x. O(1).'], ['remove', 'set.remove(x)', 'Remove x, KeyError if absent.'], ['discard', 'set.discard(x)', 'Remove x if present.'], ['pop', 'set.pop()', 'Remove and return an arbitrary item.'],
    ['union', 'set.union(*others)', 'Items in any.'], ['intersection', 'set.intersection(*others)', 'Items in all.'], ['difference', 'set.difference(*others)', 'Items not in the others.'],
    ['issubset', 'set.issubset(other)', ''], ['issuperset', 'set.issuperset(other)', ''], ['update', 'set.update(*others)', 'Add every item of the others.'], ['clear', 'set.clear()', ''], ['copy', 'set.copy()', '']
  ];
  var DEQUE_M = [
    ['append', 'deque.append(x)', 'Add on the right. O(1).'], ['appendleft', 'deque.appendleft(x)', 'Add on the left. O(1).'], ['pop', 'deque.pop()', 'Remove from the right. O(1).'], ['popleft', 'deque.popleft()', 'Remove from the left. O(1).'],
    ['extend', 'deque.extend(iterable)', ''], ['rotate', 'deque.rotate(n=1)', 'Rotate n steps right.'], ['clear', 'deque.clear()', '']
  ];
  var PY_MODULES = {
    heapq: [['heappush', 'heapq.heappush(heap, item)', 'Push onto a min-heap. O(log n).'], ['heappop', 'heapq.heappop(heap)', 'Pop the smallest. O(log n).'], ['heapify', 'heapq.heapify(x)', 'Turn a list into a heap in place. O(n).'],
      ['heappushpop', 'heapq.heappushpop(heap, item)', 'Push then pop the smallest, faster than two calls.'], ['heapreplace', 'heapq.heapreplace(heap, item)', 'Pop the smallest, then push.'], ['nlargest', 'heapq.nlargest(n, iterable, key=None)', 'The n largest items.'], ['nsmallest', 'heapq.nsmallest(n, iterable, key=None)', 'The n smallest items.'], ['merge', 'heapq.merge(*iterables)', 'Merge sorted inputs lazily.']],
    bisect: [['bisect_left', 'bisect.bisect_left(a, x, lo=0, hi=len(a))', 'Leftmost insertion point that keeps a sorted.'], ['bisect_right', 'bisect.bisect_right(a, x)', 'Rightmost insertion point.'], ['bisect', 'bisect.bisect(a, x)', 'Same as bisect_right.'], ['insort', 'bisect.insort(a, x)', 'Insert while keeping sorted. O(n).']],
    collections: [['deque', 'collections.deque(iterable, maxlen=None)', 'Double-ended queue with O(1) at both ends.'], ['defaultdict', 'collections.defaultdict(default_factory)', 'A dict that creates missing values.'], ['Counter', 'collections.Counter(iterable)', 'Frequency table; has most_common(n).'], ['OrderedDict', 'collections.OrderedDict()', 'A dict with order helpers (move_to_end).'], ['namedtuple', 'collections.namedtuple(name, fields)', '']],
    math: [['floor', 'math.floor(x)', ''], ['ceil', 'math.ceil(x)', ''], ['sqrt', 'math.sqrt(x)', ''], ['isqrt', 'math.isqrt(n)', 'Exact integer square root.'], ['gcd', 'math.gcd(a, b)', ''], ['log', 'math.log(x, base=e)', ''], ['log2', 'math.log2(x)', ''], ['inf', 'math.inf', 'Positive infinity.'], ['comb', 'math.comb(n, k)', 'Binomial coefficient.'], ['factorial', 'math.factorial(n)', ''], ['prod', 'math.prod(iterable)', '']],
    itertools: [['accumulate', 'itertools.accumulate(it, func=add)', 'Running totals (prefix sums).'], ['combinations', 'itertools.combinations(it, r)', ''], ['permutations', 'itertools.permutations(it, r=None)', ''], ['product', 'itertools.product(*its, repeat=1)', ''], ['chain', 'itertools.chain(*its)', ''], ['groupby', 'itertools.groupby(it, key=None)', '']],
    functools: [['lru_cache', 'functools.lru_cache(maxsize=128)', 'Memoize a function.'], ['cache', 'functools.cache', 'Unbounded memoize (3.9+).'], ['reduce', 'functools.reduce(func, it, init)', ''], ['cmp_to_key', 'functools.cmp_to_key(cmp)', 'Use an old-style comparator as a sort key.']]
  };
  var JS_KW = 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await true false null undefined'.split(' ');
  var JS_GLOBALS = [
    ['Math', 'Math', 'Math.max, Math.min, Math.floor, Math.abs …'], ['Map', 'new Map(iterable?)', 'Key-value map; O(1) get/set/has.'], ['Set', 'new Set(iterable?)', 'Unique values; O(1) add/has.'], ['Array', 'Array', 'Array.from, Array.isArray, new Array(n).fill(x)'], ['Object', 'Object', 'Object.keys/values/entries'],
    ['Number', 'Number', 'Number.MAX_SAFE_INTEGER, Number.isInteger …'], ['String', 'String', ''], ['JSON', 'JSON', 'JSON.stringify / JSON.parse'], ['parseInt', 'parseInt(str, radix)', ''], ['console', 'console', 'console.log writes to the output panel.'], ['Infinity', 'Infinity', 'Positive infinity, a common sentinel.']
  ];
  var ARR_M = [['push', 'push(...items)', 'Add at the end. O(1).'], ['pop', 'pop()', 'Remove the last. O(1).'], ['shift', 'shift()', 'Remove the first. O(n).'], ['unshift', 'unshift(...items)', 'Add at the front. O(n).'], ['slice', 'slice(start, end)', 'Copy a range.'], ['splice', 'splice(start, count, ...items)', 'Remove or insert in place.'],
    ['concat', 'concat(...arrays)', ''], ['indexOf', 'indexOf(x)', ''], ['includes', 'includes(x)', ''], ['join', 'join(sep)', ''], ['reverse', 'reverse()', 'In place.'], ['sort', 'sort(compare)', 'In place. Without a comparator it sorts as strings: use (a, b) => a - b.'],
    ['map', 'map(fn)', ''], ['filter', 'filter(fn)', ''], ['reduce', 'reduce(fn, init)', ''], ['forEach', 'forEach(fn)', ''], ['find', 'find(fn)', ''], ['findIndex', 'findIndex(fn)', ''], ['some', 'some(fn)', ''], ['every', 'every(fn)', ''], ['fill', 'fill(x)', ''], ['flat', 'flat(depth)', ''], ['at', 'at(i)', 'Supports negative indexes.'], ['length', 'length', 'Number of items.']];
  var JSSTR_M = [['split', 'split(sep)', ''], ['slice', 'slice(start, end)', ''], ['substring', 'substring(start, end)', ''], ['charAt', 'charAt(i)', ''], ['charCodeAt', 'charCodeAt(i)', ''], ['indexOf', 'indexOf(s)', ''], ['includes', 'includes(s)', ''], ['startsWith', 'startsWith(s)', ''], ['endsWith', 'endsWith(s)', ''],
    ['trim', 'trim()', ''], ['toLowerCase', 'toLowerCase()', ''], ['toUpperCase', 'toUpperCase()', ''], ['replace', 'replace(a, b)', ''], ['repeat', 'repeat(n)', ''], ['padStart', 'padStart(n, s)', ''], ['length', 'length', '']];
  var JSMAP_M = [['get', 'get(key)', ''], ['set', 'set(key, value)', ''], ['has', 'has(key)', ''], ['delete', 'delete(key)', ''], ['add', 'add(value)', 'Set only.'], ['clear', 'clear()', ''], ['size', 'size', ''], ['keys', 'keys()', ''], ['values', 'values()', ''], ['entries', 'entries()', ''], ['forEach', 'forEach(fn)', '']];
  var JSMATH_M = [['max', 'Math.max(...n)', ''], ['min', 'Math.min(...n)', ''], ['floor', 'Math.floor(x)', ''], ['ceil', 'Math.ceil(x)', ''], ['round', 'Math.round(x)', ''], ['abs', 'Math.abs(x)', ''], ['sqrt', 'Math.sqrt(x)', ''], ['pow', 'Math.pow(x, y)', ''], ['trunc', 'Math.trunc(x)', ''], ['log2', 'Math.log2(x)', ''], ['random', 'Math.random()', ''], ['PI', 'Math.PI', '']];

  var PY_SNIPPETS = [
    ['def', 'def ${1:name}(${2:args}):\n\t${0:pass}', 'Function'], ['class', 'class ${1:Name}:\n\tdef __init__(self${2}):\n\t\t${0:pass}', 'Class'], ['for', 'for ${1:i} in ${2:range(n)}:\n\t${0:pass}', 'for loop'],
    ['fori', 'for ${1:i}, ${2:x} in enumerate(${3:items}):\n\t${0:pass}', 'for with enumerate'], ['while', 'while ${1:cond}:\n\t${0:pass}', 'while loop'], ['if', 'if ${1:cond}:\n\t${0:pass}', 'if'], ['ifelse', 'if ${1:cond}:\n\t${2:pass}\nelse:\n\t${0:pass}', 'if / else'],
    ['try', 'try:\n\t${1:pass}\nexcept ${2:Exception}:\n\t${0:pass}', 'try / except'], ['lc', '[${1:x} for ${2:x} in ${3:items}]', 'List comprehension'], ['dc', '{${1:k}: ${2:v} for ${3:k}, ${4:v} in ${5:items}}', 'Dict comprehension'],
    ['main', 'if __name__ == "__main__":\n\t${0:pass}', 'Entry point'], ['dd', '${1:d} = defaultdict(${2:list})', 'defaultdict'], ['heap', 'heapq.heappush(${1:h}, ${2:x})', 'heappush']
  ];
  var JS_SNIPPETS = [
    ['function', 'function ${1:name}(${2:args}) {\n\t${0}\n}', 'Function'], ['arrow', 'const ${1:name} = (${2:args}) => {\n\t${0}\n};', 'Arrow function'], ['for', 'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}', 'for loop'],
    ['forof', 'for (const ${1:x} of ${2:items}) {\n\t${0}\n}', 'for…of'], ['while', 'while (${1:cond}) {\n\t${0}\n}', 'while'], ['if', 'if (${1:cond}) {\n\t${0}\n}', 'if'], ['class', 'class ${1:Name} {\n\tconstructor(${2}) {\n\t\t${0}\n\t}\n}', 'Class'], ['log', 'console.log(${0});', 'console.log']
  ];

  /* Guess what a receiver is, from how it was assigned or annotated in the file. */
  function guess(model, pos, name, lang) {
    var text = model.getValue(), esc = name.replace(/[$]/g, '\\$'), m;
    if (lang === 'python') {
      if (PY_MODULES[name]) return 'module:' + name;
      m = new RegExp('\\b' + esc + '\\s*(?::\\s*([\\w\\[\\], ]+?))?\\s*=\\s*([^\\n#]*)').exec(text) || new RegExp('\\b' + esc + '\\s*:\\s*([\\w\\[\\], ]+)').exec(text);
      var hint = ((m && (m[1] || '')) + ' ' + ((m && m[2]) || '')).trim();
      if (/^(List|list|\[)|\bsorted\(|\[|\blist\(|\.split\(/.test(hint)) return 'list';
      if (/\bdeque\b/.test(hint)) return 'deque';
      if (/\b(str|")|^["']|\bstr\(|\.join\(|\.strip\(/.test(hint) || /^["']/.test(hint)) return 'str';
      if (/\b(Dict|dict|defaultdict|Counter)\b|^\{[^}]*:|\{\}/.test(hint)) return 'dict';
      if (/\b(Set|set)\b|\bset\(|^\{[^:}]*\}/.test(hint)) return 'set';
      return null;
    }
    m = new RegExp('(?:let|const|var)\\s+' + esc + '\\s*=\\s*([^\\n;]*)').exec(text);
    var h = m ? m[1].trim() : '';
    if (/^\[|new Array|Array\.|\.split\(|\.map\(|\.filter\(/.test(h)) return 'array';
    if (/^["'`]|\.join\(|String\(|\.trim\(/.test(h)) return 'string';
    if (/new (Map|Set)/.test(h)) return 'map';
    if (name === 'Math') return 'math';
    return null;
  }

  function items(m, list, kind, range, extra) {
    return list.map(function (e, i) {
      return { label: e[0], kind: kind, insertText: e[0], detail: e[1], documentation: e[2] || undefined, range: range, sortText: ('0' + (extra || '') + String(i + 100)), };
    });
  }

  /* Names defined in the file, so completion also offers your own variables, functions, and self.attrs. */
  function localNames(model, lang) {
    var seen = Object.create(null), out = [];
    var re = /[A-Za-z_$][\w$]*/g, t = model.getValue(), m;
    while ((m = re.exec(t))) { var w = m[0]; if (w.length > 1 && !seen[w]) { seen[w] = 1; out.push(w); } }
    return out;
  }

  function setup(monaco) {
    if (OR.ide.ready) return; OR.ide.ready = true;
    var K = monaco.languages.CompletionItemKind, SN = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

    /* ----- Tokenizers: VS Code-like coloring (calls, types, builtins, decorators, self) ----- */
    monaco.languages.setMonarchTokensProvider('python', {
      defaultToken: '', tokenPostfix: '.python',
      keywords: PY_KW.filter(function (k) { return !/^(True|False|None)$/.test(k); }), constants: ['True', 'False', 'None'],
      builtins: PY_BUILTINS.map(function (b) { return b[0]; }).concat(['Exception', 'ValueError', 'KeyError', 'IndexError', 'TypeError', 'object', 'type', 'super', 'open', 'repr', 'slice', 'callable', 'getattr', 'setattr', 'hasattr', 'vars', 'dir', 'format', 'bytes', 'bytearray']),
      tokenizer: {
        root: [
          [/#.*$/, 'comment'], [/^\s*@[\w.]+/, 'tag'],
          [/[rRbBfFuU]{0,2}"""/, 'string', '@tdq'], [/[rRbBfFuU]{0,2}'''/, 'string', '@tsq'],
          [/[rRbBfFuU]{0,2}"/, 'string', '@dq'], [/[rRbBfFuU]{0,2}'/, 'string', '@sq'],
          [/\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?\b|\b0[xX][\da-fA-F_]+\b|\b0[bB][01_]+\b/, 'number'],
          [/\b(def)(\s+)([A-Za-z_]\w*)/, ['keyword', '', 'entity.function']], [/\b(class)(\s+)([A-Za-z_]\w*)/, ['keyword', '', 'type']],
          [/\bself\b|\bcls\b/, 'variable.language'],
          [/[A-Za-z_]\w*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@builtins': 'support.function', '[A-Z]\\w*': 'type', '@default': 'entity.function' } }],
          [/[A-Za-z_]\w*/, { cases: { '@keywords': 'keyword', '@constants': 'constant', '@builtins': 'support.function', '[A-Z][A-Za-z0-9]*': 'type', '@default': 'variable' } }],
          [/[{}()[\]]/, '@brackets'], [/[-+*/%=<>!&|^~@:;,.]+/, 'operator']
        ],
        dq: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"/, 'string', '@pop']],
        sq: [[/[^\\']+/, 'string'], [/\\./, 'string.escape'], [/'/, 'string', '@pop']],
        tdq: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"""/, 'string', '@pop'], [/"/, 'string']],
        tsq: [[/[^\\']+/, 'string'], [/\\./, 'string.escape'], [/'''/, 'string', '@pop'], [/'/, 'string']]
      }
    });
    monaco.languages.register({ id: 'orjs', aliases: ['JavaScript'] }); /* own id: the built-in 'javascript' pulls in a worker-backed TypeScript service */
    monaco.languages.setMonarchTokensProvider('orjs', {
      defaultToken: '', tokenPostfix: '.js',
      keywords: JS_KW.filter(function (k) { return !/^(true|false|null|undefined)$/.test(k); }), constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'], builtins: ['Math', 'Map', 'Set', 'Array', 'Object', 'Number', 'String', 'JSON', 'console', 'parseInt', 'parseFloat', 'Promise', 'Symbol', 'BigInt'],
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'], [/\/\*/, 'comment', '@cmt'],
          [/"/, 'string', '@dq'], [/'/, 'string', '@sq'], [/`/, 'string', '@tpl'],
          [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b|\b0[xX][\da-fA-F]+\b/, 'number'],
          [/\b(function)(\s+)([A-Za-z_$][\w$]*)/, ['keyword', '', 'entity.function']], [/\b(class)(\s+)([A-Za-z_$][\w$]*)/, ['keyword', '', 'type']],
          [/\bthis\b/, 'variable.language'],
          [/[A-Za-z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '[A-Z][\\w$]*': 'type', '@default': 'entity.function' } }],
          [/[A-Za-z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@constants': 'constant', '@builtins': 'support.function', '[A-Z][A-Za-z0-9$]*': 'type', '@default': 'variable' } }],
          [/[{}()[\]]/, '@brackets'], [/=>|[-+*/%=<>!&|^~?:;,.]+/, 'operator']
        ],
        cmt: [[/[^/*]+/, 'comment'], [/\*\//, 'comment', '@pop'], [/[/*]/, 'comment']],
        dq: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"/, 'string', '@pop']],
        sq: [[/[^\\']+/, 'string'], [/\\./, 'string.escape'], [/'/, 'string', '@pop']],
        tpl: [[/\$\{/, 'delimiter', '@interp'], [/[^\\`$]+/, 'string'], [/\\./, 'string.escape'], [/\$/, 'string'], [/`/, 'string', '@pop']],
        interp: [[/\}/, 'delimiter', '@pop'], { include: 'root' }]
      }
    });

    /* ----- Themes (VS Code Light+ / Dark+ palettes) ----- */
    function rules(c) {
      return [
        { token: 'comment', foreground: c.comment, fontStyle: 'italic' }, { token: 'string', foreground: c.string }, { token: 'string.escape', foreground: c.escape }, { token: 'number', foreground: c.number },
        { token: 'keyword', foreground: c.keyword }, { token: 'constant', foreground: c.constant }, { token: 'type', foreground: c.type }, { token: 'entity.function', foreground: c.fn }, { token: 'support.function', foreground: c.builtin },
        { token: 'variable', foreground: c.variable }, { token: 'variable.language', foreground: c.keyword2, fontStyle: 'italic' }, { token: 'tag', foreground: c.fn }, { token: 'operator', foreground: c.operator }, { token: 'delimiter', foreground: c.operator }
      ];
    }
    monaco.editor.defineTheme('or-light', { base: 'vs', inherit: true, rules: rules({ comment: '008000', string: 'A31515', escape: 'EE0000', number: '098658', keyword: 'AF00DB', constant: '0000FF', type: '267F99', fn: '795E26', builtin: '795E26', variable: '001080', keyword2: '0000FF', operator: '444444' }), colors: { 'editor.background': '#00000000', 'editorGutter.background': '#00000000', 'editor.lineHighlightBackground': '#00000008', 'editorLineNumber.foreground': '#8a8a8a' } });
    monaco.editor.defineTheme('or-dark', { base: 'vs-dark', inherit: true, rules: rules({ comment: '6A9955', string: 'CE9178', escape: 'D7BA7D', number: 'B5CEA8', keyword: 'C586C0', constant: '569CD6', type: '4EC9B0', fn: 'DCDCAA', builtin: 'DCDCAA', variable: '9CDCFE', keyword2: '569CD6', operator: 'D4D4D4' }), colors: { 'editor.background': '#00000000', 'editorGutter.background': '#00000000', 'editor.lineHighlightBackground': '#ffffff0a', 'editorLineNumber.foreground': '#7a7a7a' } });

    /* ----- Completion providers ----- */
    function provider(lang) {
      monaco.languages.registerCompletionItemProvider(lang, {
        triggerCharacters: ['.'],
        provideCompletionItems: function (model, pos) {
          var word = model.getWordUntilPosition(pos), range = { startLineNumber: pos.lineNumber, endLineNumber: pos.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
          var line = model.getLineContent(pos.lineNumber), before = line.slice(0, word.startColumn - 1), dot = /([A-Za-z_$][\w$]*)\s*\.\s*$/.exec(before);
          if (/^\s*(#|\/\/)/.test(line)) return { suggestions: [] };
          var out = [];
          if (dot) { /* member access: methods for the guessed receiver, otherwise the likely ones */
            var recv = dot[1], g = guess(model, pos, recv, lang);
            if (lang === 'python') {
              if (g && g.indexOf('module:') === 0) out = items(0, PY_MODULES[g.slice(7)], K.Function, range);
              else if (g === 'list') out = items(0, LIST_M, K.Method, range);
              else if (g === 'str') out = items(0, STR_M, K.Method, range);
              else if (g === 'dict') out = items(0, DICT_M, K.Method, range);
              else if (g === 'set') out = items(0, SET_M, K.Method, range);
              else if (g === 'deque') out = items(0, DEQUE_M, K.Method, range);
              else out = [].concat(items(0, LIST_M, K.Method, range, '1'), items(0, DICT_M, K.Method, range, '2'), items(0, STR_M, K.Method, range, '3'), items(0, SET_M, K.Method, range, '4'), items(0, DEQUE_M, K.Method, range, '5'));
            } else {
              if (g === 'math') out = items(0, JSMATH_M, K.Method, range);
              else if (g === 'array') out = items(0, ARR_M, K.Method, range);
              else if (g === 'string') out = items(0, JSSTR_M, K.Method, range);
              else if (g === 'map') out = items(0, JSMAP_M, K.Method, range);
              else out = [].concat(items(0, ARR_M, K.Method, range, '1'), items(0, JSSTR_M, K.Method, range, '2'), items(0, JSMAP_M, K.Method, range, '3'));
            }
            var seen = Object.create(null);
            out = out.filter(function (s) { return seen[s.label] ? false : (seen[s.label] = 1); });
            return { suggestions: out };
          }
          var kw = lang === 'python' ? PY_KW : JS_KW, snips = lang === 'python' ? PY_SNIPPETS : JS_SNIPPETS, bi = lang === 'python' ? PY_BUILTINS : JS_GLOBALS;
          out = out.concat(kw.map(function (k) { return { label: k, kind: K.Keyword, insertText: k, range: range, sortText: '3' + k }; }));
          out = out.concat(items(0, bi, K.Function, range, '2'));
          out = out.concat(snips.map(function (s) { return { label: s[0], kind: K.Snippet, insertText: s[1], insertTextRules: SN, detail: s[2], documentation: 'Snippet', range: range, sortText: '4' + s[0] }; }));
          if (lang === 'python') { /* `import x` and `from x import …` */
            var imp = /^\s*(?:from|import)\s+(\w*)$/.exec(before);
            if (imp) return { suggestions: Object.keys(PY_MODULES).map(function (m) { return { label: m, kind: K.Module, insertText: m, range: range, sortText: '0' + m }; }) };
            var fi = /^\s*from\s+(\w+)\s+import\s+[\w, ]*$/.exec(before);
            if (fi && PY_MODULES[fi[1]]) return { suggestions: PY_MODULES[fi[1]].map(function (e) { return { label: e[0], kind: K.Function, insertText: e[0], detail: e[1], documentation: e[2], range: range }; }) };
          }
          var local = localNames(model, lang), known = Object.create(null);
          out.forEach(function (s) { known[s.label] = 1; });
          local.forEach(function (w) { if (!known[w] && w !== word.word) out.push({ label: w, kind: K.Variable, insertText: w, detail: 'in this file', range: range, sortText: '1' + w }); });
          return { suggestions: out };
        }
      });
      /* Parameter help for builtins and methods */
      var sigs = Object.create(null);
      (lang === 'python' ? PY_BUILTINS.concat(LIST_M, STR_M, DICT_M, SET_M, DEQUE_M, [].concat.apply([], Object.keys(PY_MODULES).map(function (k) { return PY_MODULES[k]; }))) : ARR_M.concat(JSSTR_M, JSMAP_M, JSMATH_M)).forEach(function (e) { sigs[e[0]] = e; });
      monaco.languages.registerSignatureHelpProvider(lang, {
        signatureHelpTriggerCharacters: ['(', ','],
        provideSignatureHelp: function (model, pos) {
          var text = model.getValueInRange({ startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: pos.column }), depth = 0, i, commas = 0;
          for (i = text.length - 1; i >= 0; i--) { var c = text[i]; if (c === ')' || c === ']' || c === '}') depth++; else if (c === '(' || c === '[' || c === '{') { if (depth === 0) break; depth--; } else if (c === ',' && depth === 0) commas++; }
          if (i < 0 || text[i] !== '(') return null;
          var nm = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(0, i)); if (!nm || !sigs[nm[1]]) return null;
          var e = sigs[nm[1]], inner = /\((.*)\)/.exec(e[1]), params = inner ? inner[1].split(/,\s*/).map(function (p) { return { label: p }; }) : [];
          return { value: { signatures: [{ label: e[1], documentation: e[2], parameters: params }], activeSignature: 0, activeParameter: Math.min(commas, Math.max(params.length - 1, 0)) }, dispose: function () {} };
        }
      });
      /* Rename every occurrence of an identifier (F2), skipping strings and comments */
      monaco.languages.registerRenameProvider(lang, {
        resolveRenameLocation: function (model, pos) {
          var w = model.getWordAtPosition(pos);
          if (!w || /^\d/.test(w.word) || kw_has(lang, w.word)) return { rejectReason: 'Pick a variable, function, or class name to rename.', text: '', range: new monaco.Range(1, 1, 1, 1) };
          return { range: new monaco.Range(pos.lineNumber, w.startColumn, pos.lineNumber, w.endColumn), text: w.word };
        },
        provideRenameEdits: function (model, pos, newName) {
          var w = model.getWordAtPosition(pos); if (!w) return { edits: [] };
          if (!/^[A-Za-z_$][\w$]*$/.test(newName) || kw_has(lang, newName)) return { edits: [], rejectReason: '“' + newName + '” isn’t a valid name here.' };
          var edits = [], re = new RegExp('(^|[^\\w$])(' + w.word.replace(/[$]/g, '\\$') + ')(?![\\w$])', 'g');
          for (var ln = 1; ln <= model.getLineCount(); ln++) {
            var text = model.getLineContent(ln), live = liveMask(text, lang), m;
            re.lastIndex = 0;
            while ((m = re.exec(text))) {
              var col = m.index + m[1].length;
              if (live[col]) edits.push({ resource: model.uri, textEdit: { range: new monaco.Range(ln, col + 1, ln, col + 1 + w.word.length), text: newName }, versionId: undefined });
              if (m[0].length === 0) re.lastIndex++;
            }
          }
          return { edits: edits };
        }
      });
    }
    provider('python'); provider('orjs');
  }
  function kw_has(lang, w) { return (lang === 'python' ? PY_KW : JS_KW).indexOf(w) >= 0; }
  /* live[i] is true when character i of a line is code, not inside a string or a comment. */
  function liveMask(text, lang) {
    var live = new Array(text.length + 1), q = null, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { live[i] = false; if (c === '\\') { live[i + 1] = false; i++; } else if (c === q) q = null; continue; }
      if ((lang === 'python' && c === '#') || (lang !== 'python' && c === '/' && text[i + 1] === '/')) { for (; i < text.length; i++) live[i] = false; break; }
      if (c === '"' || c === "'" || (lang !== 'python' && c === '`')) { q = c; live[i] = false; continue; }
      live[i] = true;
    }
    live[text.length] = true; return live;
  }

  /* ---------- An editor instance ---------- */
  var LANG_ID = { py: 'python', js: 'orjs', java: 'java', cpp: 'cpp' };
  function isDark() { var t = document.documentElement.getAttribute('data-theme'); return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); }

  /* create(host, { onChange, onRun, label }) -> { setModel(lang, value), value, focus, layout, dispose } */
  function create(host, o) {
    var monaco = window.monaco, models = {}, cur = null;
    host.classList.add('ide');
    var ed = monaco.editor.create(host, {
      value: '', language: 'python', theme: isDark() ? 'or-dark' : 'or-light', automaticLayout: true,
      fontFamily: '"Martian Mono", ui-monospace, Consolas, monospace', fontSize: 13, lineHeight: 22, fontLigatures: false,
      minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, insertSpaces: true, detectIndentation: false,
      renderWhitespace: 'none', bracketPairColorization: { enabled: true }, guides: { indentation: true, bracketPairs: false },
      autoClosingBrackets: 'always', autoClosingQuotes: 'always', autoIndent: 'full', formatOnType: false,
      quickSuggestions: { other: true, comments: false, strings: false }, suggestOnTriggerCharacters: true, snippetSuggestions: 'inline', wordBasedSuggestions: 'currentDocument',
      parameterHints: { enabled: true }, occurrencesHighlight: 'singleFile', selectionHighlight: true, matchBrackets: 'always', folding: true, smoothScrolling: true,
      padding: { top: 12, bottom: 12 }, overviewRulerLanes: 0, hideCursorInOverviewRuler: true, renderLineHighlight: 'line', contextmenu: true, ariaLabel: o.label || 'Code editor',
      fixedOverflowWidgets: true, accessibilitySupport: 'auto', lineNumbersMinChars: 3, glyphMargin: false
    });
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () { if (o.onRun) o.onRun(); });
    ed.onDidChangeModelContent(function () { if (o.onChange && cur) o.onChange(cur, ed.getValue()); });
    function theme() { monaco.editor.setTheme(isDark() ? 'or-dark' : 'or-light'); }
    var off = OR.on('theme', theme);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { monaco.editor.remeasureFonts(); });
    return {
      setModel: function (lang, value) {
        if (!models[lang]) models[lang] = monaco.editor.createModel(value, LANG_ID[lang] || 'plaintext');
        else if (models[lang].getValue() !== value) models[lang].setValue(value);
        cur = null; ed.setModel(models[lang]); cur = lang;
      },
      getValue: function () { return ed.getValue(); },
      reset: function (lang, value) { if (models[lang]) models[lang].setValue(value); },
      focus: function () { ed.focus(); },
      dispose: function () { if (typeof off === 'function') off(); ed.dispose(); Object.keys(models).forEach(function (k) { models[k].dispose(); }); }
    };
  }
})();
