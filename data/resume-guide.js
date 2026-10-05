/* Offer Ready: resume guide content and cover-letter templates (all original wording).
   Rendered by js/views/resume.js. Prose strings go through OR.md / OR.inline. */
(function () {
  'use strict';
  window.OR = window.OR || {};
  OR.resumeGuide = {
    formula: {
      lead: 'Every bullet answers one question for the reader: what changed because you were there? Use one sentence in this shape.',
      pattern: 'Accomplished [X] as measured by [Y] by doing [Z]',
      parts: [
        ['X', 'The outcome', 'What got better, faster, cheaper, safer or possible.'],
        ['Y', 'The measure', 'A number: percent, time, count, users, dollars, test coverage, requests per second.'],
        ['Z', 'The how', 'The thing you did, with the tool or method named (this is where keywords live).']
      ],
      note: 'You don’t have to keep the order. “Cut p95 latency 480 ms to 120 ms by adding a Redis cache” is the same sentence, reordered so the result comes first. Start with a past-tense verb for past roles and a present-tense verb for the job you hold now.',
      noNumbers: 'No hard numbers? Estimate honestly and say so (“about 30 users”, “roughly 2 hours a week”), count things (files, endpoints, tests, teammates, reviews), or measure scope (3 services, 12 repos). Never invent a figure you can’t explain in an interview: every number is a question they will ask.'
    },
    examples: [
      { ctx: 'Internship, backend', before: 'Worked on the backend API for the team’s dashboard.', after: 'Cut dashboard load time from 4.2 s to 1.1 s by paginating the reports endpoint and adding indexed queries in PostgreSQL.', why: 'The outcome and the measure are now the sentence; the tools are named.' },
      { ctx: 'Internship, testing', before: 'Responsible for writing tests.', after: 'Raised unit-test coverage of the billing module from 38% to 81% by writing 140 pytest cases, catching 3 rounding bugs before release.', why: 'Responsible for hides the verb; this one shows count, before, after and a payoff.' },
      { ctx: 'Course project, web', before: 'Made a web app for a class using React and Node.', after: 'Built a study-group scheduler in React and Node.js used by 40 classmates, with conflict detection that removed double-booked rooms.', why: 'A class project can still have users, scope and a design decision.' },
      { ctx: 'Hackathon', before: 'Participated in a hackathon and built an app.', after: 'Shipped a campus food-waste tracker in 24 hours with a 4-person team; placed 2nd of 63 teams and demoed to 5 judges.', why: 'Rank, field size and time box turn participation into a result.' },
      { ctx: 'Research assistant', before: 'Helped with data analysis for a professor.', after: 'Automated cleaning of 12,000 survey rows in pandas, saving the lab about 6 hours a week and removing manual copy errors.', why: 'Helped says nothing; the automation and the hours saved say everything.' },
      { ctx: 'Teaching assistant', before: 'Held office hours and graded assignments.', after: 'Tutored 60 students in data structures across 2 semesters and wrote an autograder in Python that cut grading from 10 hours to 1 per assignment.', why: 'Two achievements, each with a number. Lead with the stronger one.' },
      { ctx: 'Open source', before: 'Contributed to an open source project.', after: 'Fixed a race condition in a 2k-star CLI library (merged PR #214) by adding a mutex around cache writes; the flaky test now passes 500 of 500 runs.', why: 'A link or PR number is proof. Name the bug, the fix and the check.' },
      { ctx: 'Club leadership', before: 'Led the programming club.', after: 'Grew the programming club from 12 to 55 members in one year by running weekly interview-prep sessions and a 6-week project sprint.', why: 'Leadership is a result about other people, so measure them.' },
      { ctx: 'Part-time job, tooling', before: 'Used Python to automate tasks at work.', after: 'Automated the weekly inventory report with a 90-line Python script, replacing 3 hours of manual spreadsheet work with a 2-minute run.', why: 'Used shows nothing. Size of the script and the time saved show judgment.' },
      { ctx: 'Systems course project', before: 'Implemented a key-value store.', after: 'Implemented a replicated key-value store in Go with Raft consensus; survived 100 randomized partition tests with no lost writes.', why: 'The hard part (consensus) and the verification (randomized tests) appear in the same line.' }
    ],
    ats: [
      '**One column, no tables, text boxes, icons or images.** Many parsers read across columns and scramble the order.',
      '**Standard headings:** Education, Experience, Projects, Skills. Clever titles (“My Journey”) are skipped or misfiled.',
      '**A plain font** such as Arial, Calibri or Helvetica at 10 to 11 pt, with real text, not text drawn as an image.',
      '**Dates and places in a consistent format** (Jun 2026 to Aug 2026). Parsers build your timeline from them.',
      '**Spell skills the way the posting does** (JavaScript, not JS only; Kubernetes alongside k8s) and put them in the Skills section and in bullets that show use.',
      '**Save and send a PDF** unless the form asks for Word. A PDF exported from text (like this builder’s Print, Save as PDF) stays selectable.',
      '**Contact details in the body**, not the page header or footer, where some parsers never look.',
      '**File name:** FirstName-LastName-Resume.pdf. Not resume-final-v7.pdf.',
      '**Don’t keyword-stuff.** A human reads it next. List only what you can discuss for five minutes.'
    ],
    onePage: [
      '**One page, always, as a new grad.** Two pages tells the reader you can’t prioritize.',
      '**Margins 0.5 to 0.75 inch.** Below that it looks crammed and some printers clip it.',
      '**Body 10 to 11 pt, name 16 to 20 pt, section headings 11 to 12 pt bold in caps with a rule.** Nothing smaller than 10 pt.',
      '**Order of attention:** top third carries your name, education and strongest experience. People skim for about 10 seconds.',
      '**2 to 4 bullets per role, 2 to 3 per project.** Cut the weakest bullet before shrinking the font.',
      '**Aim for 2 lines or fewer per bullet.** A bullet that wraps to 3 lines is two bullets.',
      '**White space is a feature.** Spacing between sections matters more than one more line of content.',
      '**Check by printing to PDF.** What you see in the preview must be what the PDF holds, on exactly one page.'
    ],
    checklist: [
      'Every bullet starts with a strong past-tense verb.',
      'At least half of the bullets contain a number.',
      'No “responsible for”, “worked on”, “helped with” or “various”.',
      'Name, email, phone, city, and links (GitHub, LinkedIn, portfolio) at the top; links open.',
      'A professional email address (not a nickname).',
      'Education has school, degree, graduation date; GPA only if 3.5 or higher.',
      'Skills match the postings you are applying to (use the keyword matcher).',
      'Projects have a link or a clear description of what shipped.',
      'No photo, age, marital status, street address or references line.',
      'One page, one column, a PDF that selects as text.',
      'Tense is consistent, and no typos (read it aloud once).',
      'Someone else read it for ten seconds and told you what they remember.'
    ],
    newGrad: [
      { h: 'Projects carry weight you don’t yet have in jobs', p: 'Put 2 or 3 projects right after Experience (or above it, if you have no real experience). Pick ones with a live link or repo, a real user (even a few classmates), and one decision you can defend in an interview: a trade-off, a bug you chased, a number you measured.' },
      { h: 'Education order', p: 'As a student or recent grad, Education goes first: school, degree, expected graduation month, GPA if 3.5 or higher, and 3 to 5 relevant courses (data structures, algorithms, operating systems, databases). After about 2 years of full-time work, move it to the bottom.' },
      { h: 'No photo, and leave out what shouldn’t decide it', p: 'No photo, birth date, marital status or full street address, because they invite bias and parsers don’t need them. City and state are enough.' },
      { h: 'Links that earn the click', p: 'A GitHub with pinned repos that have README files, a LinkedIn that matches the resume, and (optionally) a portfolio. Remove a link rather than send someone to an empty profile. Write them as plain text so they survive printing.' },
      { h: 'Skills section', p: 'Group by type (Languages, Frameworks, Tools) and list only what you could answer questions about. Mirror the posting’s spelling. Skip skill bars and “proficiency” ratings: they say nothing and break parsers.' },
      { h: 'Extras that count', p: 'Hackathons, open-source merges, teaching-assistant roles, competitive programming ratings, and leadership in clubs all show initiative. One line each. Cut jobs unrelated to the role unless they show a result or responsibility.' },
      { h: 'Tailor lightly', p: 'Keep one master resume and, for each application, reorder bullets and adjust the Skills line to the posting. Ten minutes beats a rewrite.' }
    ]
  };

  /* Cover-letter templates. Placeholders in [brackets] are filled automatically when known; the rest are yours to fill. */
  OR.coverTemplates = [
    {
      id: 'short', name: 'Short and direct',
      body: 'Dear [Hiring manager],\n\nI’m applying for the [Role] position at [Company]. I’m a [Degree] student at [School] graduating in [Graduation], and the work your team does on [Something specific about the team or product] is the kind of problem I want to spend my first years on.\n\nIn [Project or internship], I [Strongest result with a number]. That taught me [One lesson that applies to this role], which I’d bring to [Company] from the first week.\n\nI’d welcome the chance to talk about how I can help. My resume is attached, and I can be reached at [Email] or [Phone].\n\nThank you for your time,\n[Your name]\n'
    },
    {
      id: 'project', name: 'Lead with a project',
      body: 'Dear [Hiring manager],\n\nLast [Month], I built [Project name]: [One sentence on what it does and who used it]. [A measured result, for example “It handled 2,000 requests a minute with a p95 of 90 ms”]. I’m writing because [Company]’s [Role] role asks for the same skills: [Skill from the posting] and [Another skill from the posting].\n\nWhat I’m most proud of in that project is [A decision you defended or a bug you chased]. I’d like to bring that same habit of measuring before changing to [Company].\n\nI’m finishing my [Degree] at [School] in [Graduation] and would love to talk. Thank you for considering me.\n\nSincerely,\n[Your name]\n[Email] | [Links]\n'
    },
    {
      id: 'referral', name: 'Referral or conversation',
      body: 'Dear [Hiring manager],\n\n[Referrer name] suggested I reach out about the [Role] position at [Company]. We talked about [Topic of the conversation], and what stood out to me was [Something specific you learned about the team].\n\nA bit about me: I’m a [Degree] student at [School] graduating in [Graduation]. At [Internship or project], I [Result with a number], and I’ve been going deeper on [A skill the team uses] in [A course or personal project].\n\nI’d be grateful for a conversation, and my resume is attached. Thank you for your time.\n\nBest,\n[Your name]\n[Email]\n'
    },
    {
      id: 'career-fair', name: 'After a career fair or event',
      body: 'Dear [Recruiter name],\n\nThank you for speaking with me at [Event] on [Date]. I enjoyed hearing about [Something they said], and I’m following up to apply for the [Role] position at [Company].\n\nI’m a [Degree] student at [School] (graduating [Graduation]). Two things I mentioned that may be relevant: [Project] and [Experience], where I [Result with a number].\n\nMy resume is attached. I’d appreciate any next steps you can share. Thank you again.\n\nBest regards,\n[Your name]\n[Email] | [Phone]\n'
    }
  ];
})();
