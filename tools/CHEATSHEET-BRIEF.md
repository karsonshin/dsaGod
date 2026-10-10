# Brief: writing cheat sheets for Offer Ready

Offer Ready is a personal interview-prep app at D:\Projects\dsaGod (static HTML/JS). The learner is a new-grad software engineer whose main language is **Python**, studying fast for coding, system design and behavioral interviews. Cheat sheets are printable, dense, accurate quick references. Read these first:

- `js/views/cheatsheets.js`: the helper kit `h` your `render(h)` receives: `h.m(text)` inline markup (`code`, **bold**, `[[topic-id]]` and `[[topic-id|label]]` link to lessons, `{{lc}}` links to problems, `<br>`), `h.T(head, rows, {cls,label})` table, `h.list(items)`, `h.sec(title, body)`, `h.code(src)` monospace snippet block (plain text, no markup), `h.cols(a, b, ...)` side-by-side blocks. Topic ids are in `data/curriculum.js`; problem numbers must exist in `data/problems.js`.
- `data/cheatsheets/s1-bigo.js` and `s3-patterns.js`: finished examples of the format (`OR.cheatsheets.push({ n, id, title, blurb, keywords, pages?, render })`).
- `css/cheatsheets.css`: screen and print styles. Sheets print black on white. A sheet with `pages: N` (N > 1) prints across N pages; a sheet without `pages` must fit ONE page when printed, so be dense and economical (small tables, short phrases).

Write ONLY the sheet file(s) assigned to you in `data/cheatsheets/` (a stub file with the right name exists; replace it). Do not edit any other file. The order number `n` must be the one assigned.

## Rules

- **Accuracy over volume.** Wrong complexities or non-working code are worse than missing items. Distinguish average vs worst case. Say "amortized" only where it is true.
- **Every Python snippet must actually run** on Python 3.11. Collect the snippets, run them with asserts, fix any that fail, before you finish. Show outputs in comments only when you ran them.
- **Original wording.** Do not copy text from other sites or books.
- **Scannable.** Tables, short bullets, one idea per line. Put the "gotcha" next to the thing it bites.
- Use `h.T` for dense reference tables and `h.code` for snippets; wrap code lines at about 70 characters.
- Link to lessons with `[[topic-id]]` where it helps (ids must exist).
- Test in the browser if you can (open file:///D:/Projects/dsaGod/index.html#/cheatsheets/<id> after setting `OR.store.update(s=>{s.settings.onboarded=true})`; Playwright for Python is installed at C:\Users\karso\AppData\Local\Temp\claude\d--Projects-dsaGod\0c152e04-8023-49a2-ab43-6048e352fb51\scratchpad\pylibs, use `PYTHONPATH=<that path>`, Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe). Check there are no console errors, no sideways page scroll at 390px width, and for one-page sheets print to PDF with page.pdf(format='Letter') and confirm the page count equals what you declared.
- Run `node --check` on every file you write.

## Final message

Under 120 words: files written, page counts you verified, anything you were unsure about.
