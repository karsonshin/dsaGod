/* Offer Ready: career content and the total-comp maths. Original text. Facts that vary by company or year say so.
   Block types: md (mini-markdown), scripts (copyable templates with {{Field}} placeholders), check (persisted checklist),
   links (outbound), calc (the comparison calculator). Loads in node too (tools/test_comp.js). */
(function (root) {
  'use strict';
  var OR = (root.OR = root.OR || {});

  /* ---------- Total-comp maths ----------
     Per year t = 1..4:  base + base * bonus% + (t === 1 ? signOn : 0) + equity(t)
     equity(t) = sum over grants of vested share in that year, times (1 + growth)^(t - 1)
       - the initial grant (total value) vests by SCHEDULES[schedule] starting in year 1;
       - a refresher grant of (refresh% x initial grant) is made at the start of years 2, 3 and 4,
         vests on the same schedule starting in its own year, and is cut off after year 4.
     Base is held flat (no raises assumed); growth 0 means stock is valued at grant price. Pre-tax. */
  var SCHEDULES = {
    even:  { label: 'Even, 25% a year', pct: [25, 25, 25, 25], note: 'Common: one-year cliff, then monthly or quarterly. By year it is the same as 25 a year.' },
    back:  { label: 'Back-loaded, 5/15/40/40', pct: [5, 15, 40, 40], note: 'Used by at least one very large employer. Year one looks small on paper.' },
    front: { label: 'Front-loaded, 33/33/22/12', pct: [33, 33, 22, 12], note: 'Used by some large employers. Year one looks big, and it tapers.' }
  };
  var n = function (v) { v = parseFloat(v); return isFinite(v) ? v : 0; };

  function comp(o) {
    o = o || {};
    var sch = (SCHEDULES[o.schedule] || SCHEDULES.even).pct;
    var base = n(o.base), bonus = n(o.bonusPct) / 100, sign = n(o.signOn), grant = n(o.equity);
    var refresh = n(o.refreshPct) / 100 * grant, g = 1 + n(o.growthPct) / 100;
    var years = [], total = 0, t, k;
    for (t = 1; t <= 4; t++) {
      var eq = grant * sch[t - 1] / 100;
      for (k = 2; k <= t; k++) eq += refresh * sch[t - k] / 100;
      eq *= Math.pow(g, t - 1);
      var y = { year: t, base: base, bonus: base * bonus, sign: t === 1 ? sign : 0, equity: eq };
      y.total = y.base + y.bonus + y.sign + y.equity;
      total += y.total; years.push(y);
    }
    return { years: years, total: total, avg: total / 4 };
  }

  OR.career = { SCHEDULES: SCHEDULES, comp: comp, pages: [], links: {} };
  if (typeof module !== 'undefined' && module.exports) module.exports = OR.career;

  var L = OR.career.links;
  L.levels = 'https://www.levels.fyi/';
  L.companyTags = 'https://leetcode.com/company/';
  L.gfg = 'https://www.geeksforgeeks.org/company-interview-corner/';
  L.glassdoor = 'https://www.glassdoor.com/Interview/index.htm';
  L.handbook = 'https://www.techinterviewhandbook.org/';
  L.burnout = 'https://news.ycombinator.com/item?id=5630445';
  L.longGame = 'https://fs.blog/long-game/';

  var P = OR.career.pages;

  /* ---------- (a) Job-search strategy ---------- */
  P.push({
    id: 'strategy', title: 'Job-search strategy', icon: 'target',
    lede: 'Referrals, recruiter outreach, LinkedIn, which companies to aim at, and how to line the offers up so they land in the same fortnight.',
    blocks: [
      { t: 'md', v: `## Referrals first
A referral does not pass the interview for you. What it does is get a human to look at your resume before a filter does, and it often moves you to the front of a recruiter's queue. How much weight it carries differs by company and by year, so treat it as a strong nudge, not a guarantee.

**Who to ask, in order:** people you have worked or studied with, then people one step away (a friend of a friend, a senior from your college, an alumni group), then people you have never met who share something concrete with you. Strangers reply less often, but a short, specific, easy-to-answer message works more than you would expect.

**Make it cheap to say yes.** Attach your resume, name the exact role, and say what you are asking for in one line. Never ask someone to vouch for skills they have not seen; ask them to submit the referral or point you to the right recruiter.` },
      { t: 'scripts', items: [
        { id: 'ref-warm', title: 'Referral request, someone you know', note: 'Send it after a short catch-up, not as the first message in two years.',
          text: `Hi {{Name}},

I'm applying for {{Role}} at {{Company}} and I'd love to be considered. I've attached my resume. Would you be open to referring me? The posting is here: {{Link}}.

No pressure at all if it doesn't feel right. If you can't, I'd still value a quick pointer to the right recruiter.

Thanks,
{{My name}}` },
        { id: 'ref-cold', title: 'Referral request, a stranger with a shared link', note: 'Lead with the specific thing you share. Ask for 15 minutes, not a referral, in the first message.',
          text: `Hi {{Name}},

I'm {{My name}}, a {{My background}}. I noticed we both {{Shared thing}}, and I've been reading about the {{Team}} team at {{Company}}.

I'm preparing to apply for {{Role}}. Would you have 15 minutes in the next couple of weeks to tell me what the work is really like? I'll come with two specific questions so I don't waste your time.

Thanks either way,
{{My name}}` },
        { id: 'ref-thanks', title: 'Following up after a referral', note: 'Send once, a week or two later, whatever the outcome.',
          text: `Hi {{Name}},

A quick update: the recruiter reached out and we've {{Update}}. Thank you for submitting the referral, it made a real difference. I'll let you know how it ends up.

{{My name}}` }
      ] },
      { t: 'md', v: `## Recruiter outreach
Recruiters are the other door. Many contact you first, so keep LinkedIn current (checklist below). For outbound, look for recruiters whose title mentions university, early-career or engineering hiring at that company, and write two or three lines. Do not paste your life story.` },
      { t: 'scripts', items: [
        { id: 'rec-out', title: 'Outbound note to a recruiter', note: 'Short. One concrete credential, one clear ask.',
          text: `Hi {{Name}},

I'm a {{Background}} with {{One concrete credential}}, and I'm interested in {{Role}} roles at {{Company}}. I've applied through the careers site ({{Req ID}}) and attached my resume here.

If there is a better role for my profile, or a next step I should know about, I'd be glad to hear it.

Thanks,
{{My name}}` },
        { id: 'rec-reply', title: 'Replying to a recruiter when you are not ready yet', note: 'Keep the door open. Do not ignore it.',
          text: `Hi {{Name}},

Thanks for reaching out. I'm interested, but I'm mid-way through prep and would do better in about {{Weeks}} weeks. Could we talk then? In the meantime, could you tell me the level and location of the role, and roughly how the process works?

{{My name}}` }
      ] },
      { t: 'md', v: `## LinkedIn, a short checklist
Recruiters search it with filters, so it needs the same words as the roles you want. Tick these off; your ticks are saved on this computer.` },
      { t: 'check', id: 'linkedin', items: [
        'A headline that says what you do and what you want, with the role keywords in it (not just "Student")',
        'A clear photo and a custom profile URL',
        'An About section: three or four lines on what you build and what you are looking for',
        'Each experience or project names the stack in words recruiters search for, plus one result with a number you can defend',
        'Skills section matches the languages and tools on your resume',
        'Location and "open to work" are set (you can show it to recruiters only)',
        'Links to GitHub or a project that actually runs',
        'Resume and LinkedIn tell the same story, with the same dates'
      ] },
      { t: 'md', v: `## Target companies by tier
These tiers describe how to *choose*, not who will hire. Whether a company is hiring, at what level, and in which team changes month to month. Check each careers page and recent news, and do not trust a list that is a year old, including this one.

| Tier | What it is | Why it is on your list | Prep depth |
|---|---|---|---|
| Reach | Companies with the hardest, most competitive loops and the strongest brand | A good outcome would change your trajectory, and practice for them lifts everything else | Full DSA, system design at your level, polished stories |
| Target | Strong employers where your profile is a realistic match for an open role | Your best odds. Most of your offers should come from here | Same prep, tuned to the company |
| Safety | Companies with a lighter process or less competition, where you would still be glad to work | Gives you practice loops, a real fallback, and leverage | Lighter; keep the basics warm |

**How to choose, honestly:** the role fits the work you want, the team is hiring now (a live posting, not a hope), you can name a reason you would be glad to go, the level matches your experience, and you have at least one route in (referral, recruiter, campus). Aim for a few in each tier, and put your real first choices later in the sequence so you arrive warm.` },
      { t: 'md', v: `## Sequencing so the offers land together
Offers expire, and a slow company can leave you deciding on a deadline while the others are still mid-loop. The fix is to start the slow processes first and the fast ones last. Pace varies hugely by company, so ask each recruiter for their usual timeline when you first speak.

The week numbers count up to the week you want offers in hand (week 10).

| Week | What to do |
|---|---|
| 1 to 2 | Referrals and outreach out for every tier. Apply to the slow, large processes. Resume final. |
| 3 | Take safety-tier phone screens as practice. Debrief each one. |
| 4 to 5 | Target-tier phone screens and online assessments. Ask recruiters what the whole timeline looks like. |
| 6 | Schedule onsite loops so reach and target companies fall within one or two weeks of each other. Say plainly that you have other processes running. |
| 7 to 8 | Onsite loops. Keep a day between loops when you can, and never stack two on the same day. |
| 9 | Offers and team-matching calls. Tell each company where you are with the others (see Negotiation). |
| 10 | Decision week. Ask for more time on any deadline that falls before your last loop has answered. |

Dates will slip. The principle holds: do not accept or reject early just because one company is fast. Track every stage and deadline in the [Pipeline tracker](#/pipeline), and build your resume in the [Resume studio](#/resume).` }
    ]
  });

  /* ---------- (b) The interview process ---------- */
  P.push({
    id: 'process', title: 'The interview process', icon: 'flag',
    lede: 'What happens between "applied" and "offer" at typical big-tech and high-growth companies, and what each stage is actually scoring.',
    blocks: [
      { t: 'md', v: `Every company runs this differently, and the same company changes it from year to year and team to team. Use this as a map of the usual stages, then ask your recruiter, in your first call, exactly which of them you will face and how long each takes. Recruiters expect the question.

## The stages
| Stage | Typical form | What it is looking for |
|---|---|---|
| Resume screen | A recruiter or a tool reads for role fit, level and recent work | Does your experience match the role well enough to spend an hour on? |
| Online assessment (OA) | Timed coding problems, sometimes with a debugging or multiple-choice part. Often auto-graded | Can you finish working code under a clock? Tests passed and speed usually matter more than style |
| Recruiter screen | A short call: your background, why this company, timeline, expectations | Motivation, communication, logistics. This is also where you learn the process and the target level |
| Phone or video screen | One or two engineers, a shared editor, one or two problems | Problem solving out loud, correct and tested code, complexity |
| Onsite loop (often virtual) | Several back-to-back rounds, commonly coding, system design (more weight at higher levels), and behavioral | A consistent signal across interviewers, not one brilliant round |
| Team matching | Calls with hiring managers of teams that have an open slot. At some companies this comes after you pass; at others before | Mutual fit. It is also a chance for you to choose |
| Hiring committee or review | A group reads every interviewer's written feedback and decides, sometimes on the level too | A pattern of evidence. Weak notes or a vague round can hurt even a good performance |
| Offer | Verbal, then a written offer with a deadline | See the Compensation and Negotiation pages |

## What each round scores
Interviewers usually write feedback against a short rubric. The names differ, but the ideas are common:

- **Problem solving.** Do you clarify, break it down, try an approach, notice when it is wrong and adjust? Silence is the most expensive habit.
- **Coding.** Is the code correct, readable and tested by you before the interviewer asks? Do you pick sensible names and data structures?
- **Complexity and trade-offs.** Can you state time and space cost and say what you would change if the input grew?
- **Communication.** Can the interviewer follow your thinking, and do you take hints well?
- **System design** (more weight as the level goes up). Requirements, a workable high-level design, depth on the hard part, honest trade-offs.
- **Behavioral.** Specific stories with your own contribution, what you learned, and how you work with others.

A "hire" usually needs strength in more than one area and no clear red flag. One round can be forgiven; a pattern cannot.

## How leveling works
Your level sets your pay band, your scope and the bar you are held to. It is decided from your experience and, at many companies, from how you perform in the loop. People are sometimes offered a level above or below the one they applied for. If a down-level surprises you, ask what evidence drove it and whether a re-evaluation is possible.

Level names differ from company to company and do not map one to one, so a title like "SDE II" at one place may be a different band to "L4" or "E4" elsewhere. Use the [Compensation](#/career/compensation) page and levels.fyi to compare like with like.

## What to do in each stage
1. **Resume screen:** one page, the role's keywords where true, results with numbers.
2. **OA:** do it in one sitting with a quiet room and a timer. Practice timed problems, not just untimed ones.
3. **Recruiter screen:** have a 60-second story and a reason for this company ready, and ask about the process and the level.
4. **Phone screen:** talk the whole time. Write the test cases yourself before you are asked.
5. **Onsite:** eat, hydrate, and treat each round as a fresh start. A bad round is over once it ends.
6. **Team matching:** read about the team, and ask what the first 6 months look like.
7. **After:** send a one-line thanks, then work on the next process. Waiting is not a strategy.

Practice these with the [Mock room](#/mock). The [Tech Interview Handbook](https://www.techinterviewhandbook.org/) is a good external read on the same stages.` }
    ]
  });

  /* ---------- (c) Compensation ---------- */
  P.push({
    id: 'compensation', title: 'Compensation', icon: 'star',
    lede: 'How an offer is built, how equity vests, how to read a level, and a calculator to compare up to four offers year by year.',
    blocks: [
      { t: 'md', v: `## The parts of an offer
- **Base salary.** Fixed, paid regularly. The number most negotiations start from.
- **Bonus.** Usually a *target* percentage of base. The payout can be below or above it, depending on company results and your rating. Ask how often it paid out at target in recent years.
- **Sign-on bonus.** A one-time amount, often in year one. Many companies repay clauses apply if you leave early; read the terms.
- **Equity.** Usually RSUs (restricted stock units) at larger and public companies, and stock options at many startups. An RSU is a promise of shares that become yours as they vest.
- **Refreshers.** Additional equity grants made later, often yearly. Policies vary a lot and are rarely guaranteed.
- **Everything else.** Relocation, benefits, retirement matching, learning budget, remote policy. Worth something, rarely worth most of the decision.

## How vesting works
Equity does not arrive at once. It vests on a schedule, and you only get what has vested when you leave.

- **Cliff.** Nothing vests until a date, commonly one year in. At the cliff, the first chunk (often a quarter of the grant) vests at once.
- **Even.** The same share each year after that (25, 25, 25, 25), often vesting monthly or quarterly once past the cliff.
- **Back-loaded.** Small early, large late. A pattern like 5, 15, 40, 40 is used by at least one very large employer. It makes year one look much smaller than the headline number.
- **Front-loaded.** More early than late, for example 33, 33, 22, 12, used by some large employers.

These patterns are examples. Schedules and grant structures change, so read the schedule in *your* offer letter. If it does not say, ask in writing.

## Reading a level
Levels are the company's own ladder. The same job can have a different name in different places, so compare by scope and by pay band, not by title. Use [levels.fyi](https://www.levels.fyi/) to see how companies' levels line up and what ranges people report. Treat its numbers as reported data points, not as a guarantee. Which of them applies to you depends on your location, team and timing.

Ask the recruiter: what is the level, what is the pay band for it, and what does promotion to the next level usually involve?

## Compare your offers
Enter up to four offers. Everything is saved on this computer. The model is deliberately plain, and it is **pre-tax**.` },
      { t: 'calc' },
      { t: 'md', v: `### How the calculator reads your numbers
- Base is flat for four years (no raises assumed). Bonus is the target percentage of base.
- Sign-on counts in year 1 only.
- Equity is the **total** value of the initial grant over its whole vesting period. If your offer states a per-year figure, multiply it by 4 and enter that. The schedule splits it across years.
- Equity growth is a yearly change in stock price, applied from year 2 on. The default of 0% values shares at today's price. It is not a forecast; try it at -20% and +20% to see the spread.
- Refresher percent is a yearly grant of that share of your initial grant, made at the start of years 2, 3 and 4 on the same schedule. The default is 0%, because refreshers are rarely promised.
- Taxes, cost of living and equity that is not yet liquid are left out. Use the note field to record them, because they can move the decision more than a few thousand on the headline.` },
      { t: 'links', items: [
        { label: 'levels.fyi', url: 'https://www.levels.fyi/', note: 'Compare levels and reported pay. Treat it as a guide, not a price list.' }
      ] }
    ]
  });

  /* ---------- (d) Negotiation ---------- */
  P.push({
    id: 'negotiation', title: 'Negotiation', icon: 'edit',
    lede: 'Principles, then the exact words for the four moments that matter: the salary question, the counter, asking for time, and an exploding offer.',
    blocks: [
      { t: 'md', v: `## Principles
- **Negotiating is normal and expected.** A polite, reasoned counter rarely ends an offer. If a company would withdraw over a courteous question, that tells you something too.
- **Be warm, specific and short.** You are asking the recruiter to help you win an internal argument, so give them reasons they can repeat.
- **Never lie.** Do not invent offers, deadlines or numbers. Everything below is true or it does not work.
- **Never give a number first if you can avoid it, but never dodge forever.** Learn their range, then answer with a range whose low end you would happily accept.
- **Talk about the whole package.** Base, bonus, sign-on, equity, level, start date and review timing are all levers. Level matters most, because it sets future bands.
- **Do not accept on the call.** Say thank you, say you are excited, and ask for the offer in writing. Decide with the numbers in front of you.
- **Competing offers are leverage only when real.** Be honest about stage and timing, and do not leak confidential terms or documents.

## What are your salary expectations?
Recruiters often ask this early. A good answer is polite, anchors high enough to leave room, and shows you are flexible on the whole package. Research the level on [levels.fyi](https://www.levels.fyi/) first.` },
      { t: 'scripts', items: [
        { id: 'neg-exp-deflect', title: 'Salary expectations, early in the process', note: 'First choice. Turn the question around politely.',
          text: `I'm still learning about the role, and I'd like to be sure we're talking about the right level before I name a number. Could you share the range you've budgeted for this position? I'm confident we'll find something that works, and I'm flexible on how the package is put together.` },
        { id: 'neg-exp-number', title: 'Salary expectations, when they insist', note: 'Give a range, with a floor you would be glad to accept. Never say "anything works".',
          text: `Based on what I've seen for {{Level}} roles in {{Location}}, and on my experience with {{Strength}}, I'm looking at a total package in the range of {{Low}} to {{High}}. That said, the whole package matters to me, including equity and growth, so I'm open to discussing how it fits together.` },
        { id: 'neg-counter', title: 'The counter-offer email', note: 'Send it within a day or two of the written offer. Fill in only what is true.',
          text: `Subject: {{Role}} offer, thank you

Hi {{Recruiter name}},

Thank you again for the offer. I'm genuinely excited about {{Company}} and about working on {{Team or product}}, and I'd like to make this work.

After reviewing the details, I'd like to ask whether there is flexibility on the compensation. Based on {{Reason, e.g. the level, my other process, market ranges I've seen}}, I was hoping for {{Ask, e.g. a base of X and equity of Y}}. {{Optional: I'm also weighing another offer at a total of Z, and your team is my first choice.}}

If you can get there, I'm ready to move forward quickly. I'm happy to talk by phone if that's easier.

Thanks again,
{{My name}}` },
        { id: 'neg-time', title: 'Asking for more time', note: 'Ask early, give a date, and say why. A reasonable request is often granted.',
          text: `Hi {{Recruiter name}},

Thank you for the offer. I'm very interested in joining {{Company}}. I have one process still in progress that finishes on {{Date}}, and I want to make a decision I'm fully confident in. Would it be possible to extend my deadline to {{New date}}? I'm happy to give you an answer the same day if I can.

Thanks for understanding,
{{My name}}` },
        { id: 'neg-explode', title: 'An exploding offer (a very short deadline)', note: 'Stay calm. You are asking a question, not making a threat.',
          text: `Hi {{Recruiter name}},

Thank you, I'm excited about this offer. The deadline of {{Deadline}} is tighter than I expected, because I'm mid-way through other conversations, and I don't want to answer before I can give you a considered yes or no. Is there any flexibility on the date? If it is firm, could you help me understand why, so I can plan around it?

I'm keen to make this work.
{{My name}}` },
        { id: 'neg-others', title: 'Telling your other companies you hold an offer', note: 'Sent to a process that is still in progress. It often speeds things up.',
          text: `Hi {{Recruiter name}},

I wanted to let you know I've received an offer from another company with a decision deadline of {{Deadline}}. {{Company}} is a top choice for me, and I'd like to complete the process with you before then. Is there anything you can do to move my timeline up?

Thanks,
{{My name}}` }
      ] },
      { t: 'md', v: `## Handling an exploding offer
1. **Ask for time, politely** (script above). Most recruiters can extend by days, sometimes more.
2. **If the deadline is firm,** decide with what you know. A short deadline is information about how the company treats candidates, and also about how much they want you.
3. **Ask the other companies to speed up** (script above). They often can.
4. **Never accept something you would not take** to buy time. Reneging damages your reputation and the next person's offer.
5. **If it is a strong offer from a company you would be glad to join,** the best answer to a deadline can be a yes.

## After you have a verbal yes
Get every number in writing: base, bonus target, sign-on and any repayment terms, equity amount, vesting schedule, start date, level and location. Ask what happens if the stock price changes before you start. Then reply with a clear thank-you and a date by which you will confirm.` }
    ]
  });

  /* ---------- (e) Company-specific prep ---------- */
  P.push({
    id: 'company-prep', title: 'Company-specific prep', icon: 'building',
    lede: 'Once you have an interview scheduled, how to tune your practice to it without trusting a single source too much.',
    blocks: [
      { t: 'md', v: `## The principle
Core skills win interviews: patterns, clean code, clear talk. Company tuning is the last 10 to 20 percent, in the final week or two before a loop. It is not a substitute for the rest.

## LeetCode company tags
[LeetCode company tags](https://leetcode.com/company/) list problems that candidates have reported seeing from a company. Some of the lists are behind a paid plan. How to use them:

- **Treat them as a theme, not a leak.** The company has probably changed its question bank since the tag was written. The useful signal is which *patterns* show up most, such as graphs, intervals or design questions.
- **Sort by recent frequency** where the site lets you, and prefer the last six to twelve months.
- **Solve for the pattern.** Do the first ten or twenty from the tag under a timer, and note which patterns repeat. Then use [Problems](#/problems) here to drill those patterns.
- **Do not memorize answers.** Interviewers change details, and follow-ups test understanding.

## Interview experiences
Candidates post what they were asked on [Glassdoor](https://www.glassdoor.com/Interview/index.htm) and the [GFG company interview corner](https://www.geeksforgeeks.org/company-interview-corner/). These are useful for the *shape* of a loop: how many rounds, what format, how the recruiter described the process.

Read them with care. They are self-reported, often old, unverified and skewed toward people with strong feelings. A single post proves little; ten posts that agree are worth something. Use them to prepare questions, not to predict yours.

## A one-hour company brief
1. Read the job posting twice and highlight the skills it repeats.
2. Read the team's engineering blog or recent talks, if any, and find one real system or problem you can ask about.
3. Skim the last year of news. You should know what the company does and who it competes with.
4. Skim interview experiences for format and difficulty (see the links above).
5. Pick the two company-tagged problems in your weakest pattern and solve them under a timer.
6. Prepare two questions about the team, and write down your "why this company" in three sentences.

## Your notes
Keep what you learn for each company in the [Pipeline](#/pipeline), with the dates and stages, so the information is in one place when the call comes.` },
      { t: 'links', items: [
        { label: 'LeetCode company tags', url: 'https://leetcode.com/company/', note: 'Problems reported by candidates, by company.' },
        { label: 'GFG company interview experiences', url: 'https://www.geeksforgeeks.org/company-interview-corner/', note: 'Experiences and company-wise problem sheets.' },
        { label: 'Glassdoor interview questions', url: 'https://www.glassdoor.com/Interview/index.htm', note: 'Reported questions and process descriptions.' }
      ] }
    ]
  });

  root.OR = OR;
})(typeof window !== 'undefined' ? window : globalThis);
