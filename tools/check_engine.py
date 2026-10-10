"""Engine and lesson check: drives the real app from file:// (no special browser flags) and asserts that
the problem browser, problem page, hint ladder, runner, review queue, flashcards, quiz and topic
renderer work, with no console errors and no horizontal scroll at phone width.

A complete test topic (every schema section) is injected before the app loads; it never ships. A second
pass runs without it against the real lessons in data/topics/.
Run:  python tools/check_engine.py [screenshot-dir]
Needs the playwright Python package and Google Chrome.
"""
import os, sys, json, tempfile
from playwright.sync_api import sync_playwright

ROOT = "file:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "index.html")).replace("\\", "/")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(tempfile.gettempdir(), "offer-ready-shots")

FIXTURE = r"""
window.OR = window.OR || {};
OR.viz = { 'test-viz': { mount: function (host, o) { host.innerHTML = '<p id="viz-ok">Visualizer mounted.</p>'; o.mark('expand'); return { destroy: function () {} }; } } };
OR.topics = [{
  id: 'sliding-window',
  hook: 'Test hook: the window that grows and shrinks.',
  cues: ['A **contiguous** subarray or substring', 'A condition on its sum, length or contents'],
  intuition: 'Test intuition paragraph.\n\n- point one\n- point two',
  viz: 'test-viz',
  template: { title: 'Variable window', code: {
    py: 'def longest(s):\n    seen, left, best = set(), 0, 0  #> state for the window\n    for right, ch in enumerate(s):  #@expand > grow by one\n        while ch in seen:  #@shrink\n            seen.remove(s[left]); left += 1\n        seen.add(ch)\n        best = max(best, right - left + 1)\n    return best',
    js: 'function longest(s) {\n  const seen = new Set(); let left = 0, best = 0; //> state for the window\n  for (let right = 0; right < s.length; right++) { //@expand\n    while (seen.has(s[right])) seen.delete(s[left++]); //@shrink\n    seen.add(s[right]);\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}' } },
  complexity: { time: 'O(n)', space: 'O(k)', why: 'Each index enters and leaves once.', trap: 'The inner while loop is still O(n) total.' },
  variations: [{ name: 'Fixed window', body: 'Slide a window of size k.' }],
  worked: [{ lc: 3, restate: 'Restated.', examples: 'Examples.', brute: 'Brute.', insight: 'Insight.', code: { py: 'def f():\n    return 1' }, complexity: 'O(n).', say: 'Say this.', followups: [{ q: 'What if Unicode?', a: 'Use a map.' }] }],
  practice: [
    { lc: 3, hints: ['Track what is inside the window.', 'Shrink from the left on a repeat.'],
      solution: { explain: 'Grow right, shrink left.', code: { py: 'class Solution:\n    def lengthOfLongestSubstring(self, s):\n        return 0' } },
      starter: { js: 'function lengthOfLongestSubstring(s) {\n  \n}', py: 'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ' },
      tests: { fn: 'lengthOfLongestSubstring', cases: [{ args: ['abcabcbb'], out: 3 }, { args: ['bbbbb'], out: 1 }, { args: [''], out: 0 }] } },
    { lc: 424 }, { lc: 76 }],
  mistakes: ['Forgetting to shrink.', 'Off by one on the length.'],
  quiz: [
    { kind: 'complexity', q: 'Time for the variable window?', choices: ['O(n)', 'O(n^2)', 'O(log n)'], answer: 0, explain: 'Amortized.' },
    { kind: 'pattern', q: 'Which apply?', choices: ['Contiguous', 'Sorted pairs', 'Window condition'], answer: [0, 2], explain: 'Both cues.' },
    { kind: 'bug', q: 'What is wrong?', code: 'best = right - left', choices: ['Missing + 1', 'Nothing'], answer: 0, explain: 'Length is inclusive.' }],
  flashcards: [{ id: 'a', front: 'Front A', back: 'Back A' }, { id: 'b', front: 'Front B', back: 'Back B' }, { id: 'c', front: 'Front C', back: 'Back C' }],
  deeper: [{ title: 'Good link', url: 'https://example.com/', note: 'Note.', time: '10 min' }, { title: 'Bad link', url: 'javascript:alert(1)' }]
}];
OR.topics.push = function () { return this.length; }; // real lesson files (data/topics/*.js) stay out of the engine checks
"""

errors, checks = [], []
def ok(cond, what):
    checks.append(what)
    if not cond: raise AssertionError(what)

def set_code(pg, text):
    """Type code into the editor: Monaco once it has loaded (the textarea is hidden then), else the textarea."""
    try: pg.wait_for_selector(".ide-box .monaco-editor", timeout=15000)
    except Exception: pg.fill(".editor-text", text); return
    pg.evaluate("t => monaco.editor.getEditors()[0].setValue(t)", text)

def no_overflow(pg, label):
    w = pg.evaluate("document.documentElement.scrollWidth"); v = pg.evaluate("innerWidth")
    ok(w <= v, f"{label}: no horizontal scroll ({w} <= {v})")

def onboard(pg):
    pg.goto(ROOT + "#/onboarding"); pg.wait_for_selector("#ob-form"); pg.click("button[type=submit]"); pg.wait_for_selector(".today")
    pg.evaluate("document.querySelectorAll('.toast').forEach(t => t.remove())")

def go(pg, hash, sel):
    pg.goto(ROOT + hash); pg.wait_for_selector(sel); pg.wait_for_timeout(250)
    pg.evaluate("document.querySelectorAll('.toast').forEach(t => t.remove())")

def functional(pg):
    # Problem browser
    go(pg, "#/problems", "#pb-rows tr")
    total = pg.evaluate("OR.problems.length")
    ok(pg.locator("#pb-rows tr").count() == total, f"problems: all {total} rows")
    pg.click('[data-f="diff"][data-v="Hard"]'); pg.wait_for_timeout(150)
    hard = pg.locator("#pb-rows tr").count()
    ok(0 < hard < total and all(pg.locator("#pb-rows .diff").nth(i).inner_text() == "Hard" for i in range(hard)), "problems: difficulty filter")
    pg.click('[data-f="diff"][data-v=""]'); pg.fill('input[name="q"]', "window"); pg.wait_for_timeout(300)
    ok(set(pg.eval_on_selector_all("#pb-rows tr", "rs => rs.map(r => +r.dataset.lc)")) >= {76, 239}, "problems: text search")
    pg.reload(); pg.wait_for_selector("#pb-rows tr")
    ok(pg.input_value('input[name="q"]') == "window", "problems: filters survive reload")
    pg.select_option('[data-status-for="76"]', "attempted")
    ok(pg.evaluate("OR.store.problem(76).status") == "attempted", "problems: inline status change saves")

    # Problem page: ladder, solution, notes, timer, runner
    go(pg, "#/problem/3", ".ladder")
    ok(pg.locator(".rung").count() == 3, "problem: ladder = pattern + 2 written hints")
    pg.click("[data-hint]"); pg.click("[data-hint]")
    ok(pg.locator(".rung[data-open]").count() == 2 and pg.evaluate("OR.store.problem(3).hints") == 2, "problem: hints open one at a time and are logged")
    pg.click("[data-solution]"); ok(pg.locator("#pd-solution .code").count() == 1, "problem: solution shows on request")
    pg.fill("#pd-note-text", "remember the left pointer"); pg.wait_for_timeout(700)
    ok(pg.evaluate("OR.store.problem(3).notes") == "remember the left pointer", "problem: notes autosave")
    pg.click('[data-t="toggle"]'); pg.wait_for_timeout(1200); pg.click('[data-t="toggle"]')
    ok(pg.evaluate("OR.store.problem(3).minutes") > 0, "problem: timer logs time")
    pg.click('[data-run-lang="js"]')
    set_code(pg, "function lengthOfLongestSubstring(s) {\n  const seen = new Map(); let left = 0, best = 0;\n  for (let r = 0; r < s.length; r++) {\n    if (seen.has(s[r]) && seen.get(s[r]) >= left) left = seen.get(s[r]) + 1;\n    seen.set(s[r], r); best = Math.max(best, r - left + 1);\n  }\n  return best;\n}")
    pg.click('[data-c="run"]'); pg.wait_for_selector(".out-sum", timeout=8000)
    ok("3 of 3 passed" in pg.inner_text(".out-sum"), "problem: JS solution passes its tests")
    pg.click('[data-status="solved"]')
    rv = pg.evaluate("OR.store.problem(3).review")
    ok(rv and rv["stage"] == 0, "problem: solved with hints starts review at the 1-day step")

    # Review queue
    pg.evaluate("OR.store.update(s => { s.problems[3].review.due = OR.today(); })")
    go(pg, "#/review", ".page")
    ok(pg.locator('[data-rv="ok"]').count() == 1, "review: due problem listed")
    pg.click('[data-rv="ok"]'); pg.wait_for_timeout(200)
    ok(pg.evaluate("OR.store.problem(3).review.stage") == 1, "review: cold solve moves it up a step")

    # Topic lesson with every section
    go(pg, "#/topic/sliding-window", ".tp-body")
    secs = pg.eval_on_selector_all(".tp-sec", "s => s.map(x => x.dataset.sec)")
    ok(secs == ["cues", "intuition", "breakdown", "think", "visual", "template", "complexity", "variations", "worked", "practice", "drills", "mistakes", "quiz", "cards", "deeper", "next"], "topic: all 16 sections in order (the fixture shares an id with a real topic, so data/extras merges into it)")
    ok(pg.locator("#viz-ok").count() == 1 and pg.locator('#tp-template .ln.cur[data-mark="expand"]').count() == 2, "topic: visualizer mounts and lights the template line")
    ok(pg.locator(".deeper li").count() == 1, "topic: non-http links are dropped")
    ok(pg.locator('#tp-template .code-pane[data-l="py"]').is_visible(), "code: Python pane shows by default")
    pg.click('#lang-seg [data-lang="js"]')
    ok(pg.locator('#tp-template .code-pane[data-l="js"]').is_visible() and not pg.locator('#tp-template .code-pane[data-l="py"]').is_visible(), "code: global toggle switches panes")
    pg.click('#lang-seg [data-lang="java"]')
    ok(pg.locator('#tp-template .code-fb[data-l="java"]').is_visible() and pg.locator('#tp-template .code-pane[data-l="py"]').is_visible(), "code: missing language falls back with a note")
    pg.click('#lang-seg [data-lang="py"]')
    pg.hover('#tp-template .ln[data-note]')
    ok("state for the window" in pg.inner_text("#tp-template .code-note"), "code: line notes show on hover")
    ok("#>" not in pg.inner_text("#tp-template .code-body"), "code: note markers are stripped")
    # Quiz
    pg.check('.quiz-q[data-i="0"] input[value="0"]'); pg.click('.quiz-q[data-i="0"] [data-qz="check"]')
    ok(pg.get_attribute('.quiz-q[data-i="0"]', "data-state") == "right", "quiz: right answer graded right")
    pg.check('.quiz-q[data-i="1"] input[value="0"]'); pg.click('.quiz-q[data-i="1"] [data-qz="check"]')
    ok(pg.get_attribute('.quiz-q[data-i="1"]', "data-state") == "wrong", "quiz: partial multi-answer graded wrong")
    pg.check('.quiz-q[data-i="2"] input[value="0"]'); pg.click('.quiz-q[data-i="2"] [data-qz="check"]')
    best = pg.evaluate("OR.store.get().topics['sliding-window'].quiz.best")
    ok(abs(best - 2 / 3) < 1e-9 and "2/3" in pg.inner_text(".quiz-score"), "quiz: score recorded as topic best")
    pg.reload(); pg.wait_for_selector(".quiz-score")
    ok(pg.locator('.quiz-q[data-state]').count() == 3, "quiz: answers survive reload")

    # Flashcards
    go(pg, "#/flashcards/sliding-window", ".fc-card")
    pg.keyboard.press("Space"); ok(pg.locator("#fc-back").count() == 1, "cards: Space flips")
    pg.keyboard.press("1"); pg.wait_for_timeout(100)
    pg.keyboard.press("Space"); pg.keyboard.press("3"); pg.wait_for_timeout(100)
    pg.keyboard.press("Space"); pg.keyboard.press("4"); pg.wait_for_timeout(100)
    ok("4 / 4" in pg.inner_text(".fc-meta"), "cards: Again re-queues the card this session")
    pg.keyboard.press("Space"); pg.keyboard.press("3"); pg.wait_for_timeout(100)
    ok(pg.locator(".fc-done").count() == 1 and pg.evaluate("OR.store.get().activity[OR.today()].newCards") == 3, "cards: session ends, new cards counted")

    # Topic with no lesson yet
    go(pg, "#/topic/two-pointers", ".tp")
    ok(pg.locator(".tp > .banner").count() == 1 and pg.locator(".tp-practice tbody tr").count() == pg.evaluate("OR.problems.filter(p => p.topic === 'two-pointers').length"), "topic: lesson-less topic shows bank problems")

    # Playground (JS; Python is covered by the runner smoke test because it needs the network)
    go(pg, "#/playground", ".cpanel")
    pg.click('[data-run-lang="js"]'); pg.click('[data-c="run"]'); pg.wait_for_selector(".out-logs", timeout=8000)
    ok('"s",4' in pg.inner_text(".out-logs"), "playground: JS starter runs")

def lesson(pg):
    """The real sliding-window lesson (no fixture): sections, visualizer frames, template sync, custom input."""
    go(pg, "#/topic/sliding-window", ".player")
    secs = pg.eval_on_selector_all(".tp-sec", "s => s.map(x => x.dataset.sec)")
    ok(len(secs) == 16 and secs[4] == "visual", "lesson: sliding window renders all 16 sections (13 core plus breakdown, think and drills)")
    bad = pg.evaluate("""() => {
      const brute = s => { let b = 0; for (let i = 0; i < s.length; i++) for (let j = i; j < s.length; j++) { if (new Set(s.slice(i, j + 1)).size === j - i + 1) b = Math.max(b, j - i + 1); } return b; };
      const bad = [];
      for (let k = 0; k < 400; k++) {
        let s = ''; const n = k % 13; for (let i = 0; i < n; i++) s += 'abcd '[Math.floor(Math.random() * 5)];
        const F = OR.viz['sliding-window'].frames(s), f = F[F.length - 1];
        if (f.best !== brute(s) || f.br - f.bl + 1 !== f.best) bad.push(s);
      }
      return bad; }""")
    ok(not bad, f"lesson: visualizer best matches brute force on 400 strings {bad[:3]}")
    pg.focus(".player"); pg.keyboard.press("ArrowRight")
    ok(pg.locator('#tp-template .ln.cur[data-mark="expand"]').count() >= 1, "lesson: stepping lights the template's expand line")
    while "Rule broke" not in pg.inner_text(".player-note"): pg.click('.player [data-c="fwd"]')
    ok(pg.locator(".va-cell.dup").count() == 2 and pg.locator('#tp-template .ln.cur[data-mark="check"]').count() >= 1, "lesson: a repeat marks both copies and the check line")
    pg.click('.player [data-c="reset"]')
    ok(pg.inner_text(".player-count").startswith("1 /"), "lesson: Reset returns to the first frame")
    pg.fill("#sw-in", "dvdf"); pg.click(".va-input [type=submit]")
    pg.focus(".player-track"); pg.keyboard.press("End")
    ok(pg.inner_text(".sw-best").startswith("3") and pg.locator(".va-cell.ok").count() == 3, "lesson: custom input reruns (dvdf -> 3)")
    pg.keyboard.press("Home"); pg.keyboard.press("ArrowRight")  # the last frame has no active step, so check mid-run
    ok(pg.locator('#tp-visual .ln.cur').count() >= 1 and pg.locator('#tp-visual .ln.cur').count() == pg.locator('#tp-template .ln.cur').count(), "lesson: the template copy under the visualizer lights in step")

def detective(pg):
    """Pattern Detective, fed by the lessons' detective cases."""
    go(pg, "#/detective", ".dt-case")
    ok(pg.locator(".dt-choice").count() == 4, "detective: a case with four choices")
    first = pg.inner_text(".dt-statement")
    pg.keyboard.press("1"); pg.wait_for_selector(".dt-verdict")
    tot = pg.evaluate("Object.values(OR.store.get().detective.byPattern).reduce((n, b) => n + b.total, 0)")
    ok(tot == 1 and pg.locator(".dt-choice.is-right").count() == 1 and pg.locator(".dt-table tbody tr").count() == 1, "detective: key 1 answers, scores and shows accuracy")
    pg.keyboard.press("n"); pg.wait_for_timeout(150)
    ok(pg.locator(".dt-verdict").count() == 0 and pg.inner_text(".dt-statement") != first, "detective: N moves to a new case")

SHOTS = [("problems", "#/problems", "#pb-rows tr"), ("problem", "#/problem/3", ".ladder"), ("topic", "#/topic/sliding-window", ".tp-body"),
         ("topic-empty", "#/topic/two-pointers", ".tp"), ("cards", "#/flashcards/sliding-window", "#fc-stage > *"), ("review", "#/review", ".page"), ("playground", "#/playground", ".cpanel")]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for theme in ("light", "dark"):
        for label, vp, mobile in [("desktop", {"width": 1440, "height": 900}, False), ("mobile", {"width": 390, "height": 844}, True)]:
            ctx = b.new_context(viewport=vp, color_scheme=theme, is_mobile=mobile, has_touch=mobile)
            ctx.add_init_script(FIXTURE)
            pg = ctx.new_page()
            pg.on("console", lambda m, t=f"{theme}/{label}": errors.append(f"[{t}] {m.type}: {m.text}") if m.type in ("error", "warning") else None)
            pg.on("pageerror", lambda e, t=f"{theme}/{label}": errors.append(f"[{t}] pageerror: {e}"))
            pg.on("requestfailed", lambda r, t=f"{theme}/{label}": errors.append(f"[{t}] requestfailed: {r.url}"))
            onboard(pg)
            if theme == "light" and label == "desktop":
                functional(pg)
            else:
                pg.evaluate("OR.store.update(s => { s.problems[3] = { status: 'solved', hints: 1, minutes: 22, notes: 'n', review: { stage: 0, due: OR.today(), log: [] } }; })")
            os.makedirs(os.path.join(OUT, theme), exist_ok=True)
            for name, hash, sel in SHOTS:
                go(pg, hash, sel)
                if mobile: no_overflow(pg, f"{theme}/{name}")
                pg.screenshot(path=os.path.join(OUT, theme, f"{label}-{name}.png"), full_page=True)
            ctx.close()
    for theme in ("light", "dark"):
        for label, vp, mobile in [("desktop", {"width": 1440, "height": 900}, False), ("mobile", {"width": 390, "height": 844}, True)]:
            ctx = b.new_context(viewport=vp, color_scheme=theme, is_mobile=mobile, has_touch=mobile)
            pg = ctx.new_page()
            pg.on("console", lambda m, t=f"lesson {theme}/{label}": errors.append(f"[{t}] {m.type}: {m.text}") if m.type in ("error", "warning") else None)
            pg.on("pageerror", lambda e, t=f"lesson {theme}/{label}": errors.append(f"[{t}] pageerror: {e}"))
            onboard(pg)
            lesson(pg)
            if mobile: no_overflow(pg, f"{theme}/lesson")
            pg.screenshot(path=os.path.join(OUT, theme, f"{label}-lesson.png"), full_page=True)
            pg.locator("#tp-visual").screenshot(path=os.path.join(OUT, theme, f"{label}-lesson-viz.png"))
            detective(pg); pg.keyboard.press("2"); pg.wait_for_selector(".dt-verdict")
            if mobile: no_overflow(pg, f"{theme}/detective")
            pg.screenshot(path=os.path.join(OUT, theme, f"{label}-detective.png"), full_page=True)
            ctx.close()
    b.close()

print(f"{len(checks)} checks passed")
print(json.dumps(errors, indent=1) if errors else "no console errors")
print("screenshots:", OUT)
sys.exit(1 if errors else 0)
