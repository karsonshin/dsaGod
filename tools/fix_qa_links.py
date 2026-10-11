"""Removes #/problem/N links from data/qa/*.js when N is not in the problem bank (those pages would be empty).
Run:  python tools/fix_qa_links.py [files...]"""
import re, sys, glob, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
bank = set(re.findall(r'"lc": (\d+)', open(os.path.join(root, 'data', 'problems.js'), encoding='utf-8').read()))
files = sys.argv[1:] or glob.glob(os.path.join(root, 'data', 'qa', '*.js'))
total = 0
for f in files:
    s = open(f, encoding='utf-8').read(); n = 0
    def drop(m):
        global total
        if m.group(2) in bank: return m.group(0)
        return ''
    # a link with its trailing comma, or a leading comma when it is last in the list
    pat1 = re.compile(r"""(['"]#/problem/(\d+)['"]),\s*""")
    pat2 = re.compile(r"""(,\s*['"]#/problem/(\d+)['"])""")
    new = pat1.sub(lambda m: m.group(0) if m.group(2) in bank else '', s)
    new = pat2.sub(lambda m: m.group(0) if m.group(2) in bank else '', new)
    # a list that held only one missing link: see: ['#/problem/N'] -> see: []
    new = re.compile(r"""(['"]#/problem/(\d+)['"])""").sub(lambda m: m.group(0) if m.group(2) in bank else '', new)
    removed = len(re.findall(r"""['"]#/problem/\d+['"]""", s)) - len(re.findall(r"""['"]#/problem/\d+['"]""", new))
    if removed: open(f, 'w', encoding='utf-8').write(new); print(os.path.basename(f), 'removed', removed); total += removed
print('total removed', total)
