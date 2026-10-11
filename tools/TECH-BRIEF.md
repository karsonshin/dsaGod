# Brief: the Tech Pulse digest for Offer Ready

Offer Ready (D:\Projects\dsaGod) is a study app for a new-grad software engineer preparing for interviews. A page called "Tech pulse" shows short, accurate summaries of CURRENT tech articles so the learner stays up to date on what is happening in the industry. Today is 2026-10-11. You research one area and write one data file.

## How to work

1. Use WebSearch (standard mode is fine, run several queries) and WebFetch to find 8-10 significant developments in your area published in roughly the last 45 days (since late August 2026). Prefer primary or reputable sources: official release notes and engineering blogs, research lab posts, standards bodies, and established tech press. Skip rumours, listicles, product marketing with no substance, paywalled pages you cannot read, and anything older than ~60 days.
2. For EVERY item you include, actually fetch and read the article (WebFetch with a prompt asking for the key facts, numbers, dates and caveats). Write the summary ONLY from what you read. If the page cannot be fetched or does not support a claim, drop the claim or the item. Never fill gaps from memory or guess numbers, versions, prices or dates.
3. Write in your own words. Do not copy sentences; no quote longer than a few words. Be neutral and precise; no hype. Say what is announced vs what is still a plan or a claim by the company.
4. Write ONLY the file assigned to you: `D:\Projects\dsaGod\data\tech\<area>.js`:

```js
(function () {
  var OR = (window.OR = window.OR || {}); OR.tech = OR.tech || { items: [] };
  OR.tech.items.push(
    {
      id: 'ai-2026-10-claude-example',            // unique, kebab-case, prefix with your area
      area: 'AI',                                  // exactly your assigned area label
      date: '2026-10-02',                          // publication date of the article (YYYY-MM-DD) as stated on the page
      title: 'Short, plain headline in your words',
      source: 'Publisher or site name',
      url: 'https://exact-article-url',            // the page you read
      summary: 'Three to five sentences: what happened, the key facts and numbers, and any caveat the article states.',
      why: 'One or two sentences on why a software engineer should care.',
      terms: [ ['Term', 'one-line definition a beginner can follow'], ['Another term', '...'] ],   // 2-4 terms the article uses that a new grad may not know
      interview: 'One sentence linking it to a concept that comes up in interviews or in the lessons (for example: consistency vs availability, caching, indexing, concurrency).'
    }
  );
})();
```

5. Quality rules: accuracy over volume (8 solid items beat 10 shaky ones); every URL must be one you fetched; dates must match the page; keep `summary` under ~90 words; do not include personal data; no affiliate or tracking parameters in URLs.
6. Verify: `node --check data/tech/<area>.js`, then `node tools/check_tech.js data/tech/<area>.js` must print "tech OK".

## Final message

Under 100 words: the file, the number of items, anything you could not verify and dropped.
