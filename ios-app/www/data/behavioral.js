/* Offer Ready: behavioral studio content (OR.behavioral).
   Original wording throughout. Competencies, STAR(L) method with strong and weak pairs, 60 questions,
   the 16 Amazon Leadership Principles paraphrased, interviewer-question sets, and a flashcard deck. */
(function () {
  'use strict';
  var OR = (window.OR = window.OR || {});
  var B = (OR.behavioral = {});

  // Competencies. `kw` are loose keywords used only to suggest a mapping; the owner confirms with checkboxes.
  B.competencies = [
    { id: 'leadership', name: 'Leadership', kw: ['led', 'lead', 'owned the', 'drove', 'rallied', 'organized', 'steered', 'convinced', 'team of'] },
    { id: 'conflict', name: 'Conflict', kw: ['conflict', 'disagree', 'tension', 'clash', 'argu', 'friction', 'difficult teammate', 'frustrat'] },
    { id: 'failure', name: 'Failure', kw: ['failed', 'failure', 'mistake', 'outage', 'missed', 'rollback', 'broke', 'wrong', 'postmortem', 'regret'] },
    { id: 'ambiguity', name: 'Ambiguity', kw: ['unclear', 'ambigu', 'no spec', 'vague', 'undefined', 'unknown', 'figured out', 'from scratch'] },
    { id: 'impact', name: 'Impact', kw: ['reduced', 'increased', 'improved', 'saved', 'grew', 'revenue', 'latency', 'faster', 'cut', '%'] },
    { id: 'mentoring', name: 'Mentoring', kw: ['mentor', 'coached', 'onboard', 'taught', 'junior', 'intern', 'pairing', 'grew a teammate'] },
    { id: 'disagree', name: 'Disagreeing with a manager', kw: ['manager', 'boss', 'pushed back', 'my lead', 'director', 'disagreed with', 'escalat'] },
    { id: 'deadline', name: 'Tight deadline', kw: ['deadline', 'launch', 'ship', 'cut scope', 'crunch', 'in a week', 'on-call', 'tight'] },
    { id: 'ownership', name: 'Ownership', kw: ['nobody owned', 'took ownership', 'not my job', 'stepped up', 'end to end', 'followed through', 'on call'] },
    { id: 'collaboration', name: 'Collaboration', kw: ['cross-team', 'partner', 'stakeholder', 'design', 'product', 'together', 'aligned', 'handoff'] },
    { id: 'growth', name: 'Learning and feedback', kw: ['feedback', 'learned', 'new language', 'ramped', 'unfamiliar', 'review comment', 'improved at', 'course'] },
    { id: 'judgment', name: 'Judgment and tradeoffs', kw: ['tradeoff', 'trade-off', 'decided', 'chose', 'prioritiz', 'risk', 'data to decide', 'incomplete'] }
  ];

  // STAR(L) method.
  B.star = [
    { k: 'S', name: 'Situation', share: '10%', body: 'One or two sentences of context: where, when, what was at stake. Skip the history lesson. If the listener could not repeat the setup back, it is too long or too vague.' },
    { k: 'T', name: 'Task', share: '10%', body: 'What was yours to do. This is where you separate your job from the team’s. If you had no formal responsibility, say what you chose to take on and why.' },
    { k: 'A', name: 'Action', share: '50%', body: 'The steps you took, in order, with the reasoning behind the hard choices. This is the part they are scoring. Say “I”, name the specific things you did, and mention the alternatives you rejected.' },
    { k: 'R', name: 'Result', share: '20%', body: 'What changed, with a number if one exists (time saved, errors cut, users affected, days earlier). If the result was mixed or bad, say so plainly. Credit others where it is due.' },
    { k: 'L', name: 'Learning', share: '10%', body: 'What you do differently now, with one concrete example of using it again. Essential for failure and conflict questions; a good closer for all of them.' }
  ];

  B.tips = [
    { h: 'Aim for 1.5 to 2 minutes', b: 'Under a minute sounds thin; over three loses people. Practice with a timer. Have a 60-second cut of each story ready for when the interviewer is short on time.' },
    { h: 'Say “I”, not “we”', b: '“We” hides your contribution. Use “we” for the team’s outcome, then “I” for every decision and action you personally made. If you led, say what you decided; if you supported, say what you built.' },
    { h: 'Quantify, honestly', b: 'Use real numbers you can defend: before and after, how many users, how many hours. If you have no hard number, give scale (a team of five, a three-week project) rather than inventing a percentage.' },
    { h: 'Pick the story to fit the question', b: 'Eight to ten stories cover almost everything. Each story should work for two or three competencies by changing which part you emphasize.' },
    { h: 'Expect follow-ups', b: 'Interviewers probe: “What did you personally do?”, “What would you do differently?”, “What did your manager say?”. Know your story well enough to go three levels deep.' },
    { h: 'Do not badmouth', b: 'Describe disagreements by the problem, not the person. Show you tried to understand the other side. Nobody wants to work next to someone who narrates colleagues as villains.' },
    { h: 'Pause before answering', b: 'Two seconds of silence to choose a story reads as thoughtful. Starting with the wrong story and swerving halfway does not.' }
  ];

  // Strong vs weak pairs (a short, original illustration per competency).
  B.examples = [
    { comp: 'conflict', q: 'Tell me about a time you disagreed with a teammate.',
      weak: 'We had a disagreement about the database. It was stressful, but eventually we talked and sorted it out and the project went fine. I learned communication is important.',
      strong: 'Situation: my teammate and I split on using a queue or a cron job for nightly exports. Task: I owned the design doc, so I had to get us to one decision before sprint planning. Action: I asked her to walk me through her failure cases, wrote both options into a one-page table with cost, retry behavior and on-call load, and suggested we try each on a copy of last month’s data. The queue handled retries better; her point about operational overhead was right, so I proposed a managed queue instead of running our own. Result: we decided in two days, and the export failure rate dropped from about weekly incidents to none in the next quarter. Learning: I now bring the evidence to the first conversation instead of the second.',
      why: 'The weak version has no specifics, no personal action, no result and a vague learning. The strong one shows listening, a method, a concession and a measurable outcome.' },
    { comp: 'failure', q: 'Tell me about a time you failed.',
      weak: 'My biggest weakness is I work too hard and care too much. Once a release was late because I wanted it to be perfect.',
      strong: 'Situation: I shipped a config change on a Friday afternoon without a staged rollout. Task: it was my change, so the incident was mine to fix. Action: I noticed error rates climbing within ten minutes, rolled back, wrote the timeline, and ran the postmortem myself. Result: 25 minutes of degraded checkout for a subset of users; no data loss. Learning: I added a staged rollout step and a pre-merge checklist to the runbook, and the team has used both on every change since.',
      why: 'The weak one is a disguised brag. The strong one owns a real mistake, shows recovery, and ends with a change that outlasted the incident.' },
    { comp: 'ambiguity', q: 'Tell me about a time you had to deliver with unclear requirements.',
      weak: 'The requirements were vague, so I just built what I thought was best and the team liked it.',
      strong: 'Situation: product asked for “better search” with no definition. Task: I was the only engineer on it for six weeks. Action: I pulled two weeks of search logs, found that a large share of queries returned nothing because of spelling and plurals, and proposed a narrow goal: cut zero-result queries. I wrote that down, got the PM to agree to it, and shipped fuzzy matching behind a flag. Result: zero-result queries fell from 18% to 7% in the first month. Learning: when the goal is fuzzy, I turn it into one measurable question before writing code.',
      why: 'The strong version shows how the candidate created clarity, not only that they tolerated vagueness.' },
    { comp: 'disagree', q: 'Tell me about a time you disagreed with your manager.',
      weak: 'My manager wanted to ship something I thought was wrong, so I told him it was a bad idea. In the end he did it his way and I just went along.',
      strong: 'Situation: my manager wanted to skip load testing to hit a launch date. Task: I was the engineer responsible for the service’s capacity. Action: I did not argue in the meeting; I asked for an hour, ran a quick test against staging, and showed that the service fell over at about a third of expected traffic. I brought two options: a two-day test-and-fix, or launch to ten percent first. He chose the staged launch. Result: we hit the date for the first cohort, and the fix landed before full rollout. Learning: disagreement lands better with a small piece of evidence and a way forward than with an opinion.',
      why: 'Shows respect, evidence, alternatives and commitment to the final decision, with no blame.' },
    { comp: 'deadline', q: 'Describe a time you had to deliver under a tight deadline.',
      weak: 'We had a tough deadline so we all worked late and got it done. It was a lot of pressure but we pulled through.',
      strong: 'Situation: a partner integration was due in nine days and the estimate was fifteen. Task: I led the work and had to decide what not to build. Action: I listed every requirement with the PM, marked what the partner would notice on day one, and cut reporting and bulk import to a follow-up. I split the rest into daily slices, paired on the riskiest part, and told the partner on day three that the dashboard would come two weeks later. Result: shipped on day nine, the partner accepted it, and the cut features went out the next sprint. Learning: scope is the lever; I raise it early rather than absorbing it with hours.',
      why: 'Late nights are not a strategy. The strong answer shows prioritization and honest communication.' }
  ];
  // Question bank: [competency, question, what they are really testing, good-answer outline]
  var RAW = [
    ['leadership', 'Tell me about a time you led a project without having formal authority.', 'Whether you can create direction and buy-in using trust and clarity rather than rank.', 'Name the goal and why nobody else was driving it. Show how you built agreement (a short proposal, one-to-ones, early wins). Say what you personally decided, how you handled a person who resisted, and the outcome.'],
    ['leadership', 'Describe a time you set a direction for a team that was unsure what to do next.', 'Your ability to turn a pile of options into a plan others will follow.', 'Context of the confusion, how you framed the choice (criteria, tradeoffs), who you consulted, the call you made, how you communicated it, and what happened.'],
    ['leadership', 'Give an example of motivating a team through a long or unglamorous task.', 'Whether you keep people engaged when the work is dull but necessary.', 'Why the work mattered, how you made progress visible, how you shared the load fairly, and one concrete thing that kept morale up. Include the result for the product or team.'],
    ['leadership', 'Tell me about a time you had to make an unpopular decision.', 'Courage plus empathy: can you decide, explain and carry the cost?', 'The decision and why it was necessary, who disliked it, how you listened to them, how you explained the reasoning, and how things looked a few weeks later.'],
    ['leadership', 'Describe a time you stepped back and let someone else lead.', 'Maturity: leadership is sometimes about making room.', 'Why someone else was better placed, how you supported them without hovering, what you did instead, and the outcome for the project and the other person.'],

    ['conflict', 'Tell me about a conflict with a coworker and how you resolved it.', 'Emotional maturity and whether you go toward problems instead of around them.', 'Describe the disagreement neutrally, what you did to understand their view, the concrete step that moved things forward, the result, and what you do now earlier in similar situations.'],
    ['conflict', 'Describe working with someone whose style was very different from yours.', 'Adaptability and respect for different working styles.', 'The difference and where it caused friction, what you changed on your side, how you agreed ways of working, and what the collaboration produced.'],
    ['conflict', 'Tell me about a time two teams wanted different things from you.', 'Prioritization under competing stakeholders and how openly you negotiate.', 'Both asks and their real needs, how you surfaced the conflict instead of quietly picking, the tradeoff you proposed, who made the final call, and the outcome.'],
    ['conflict', 'Tell me about a time you received a harsh code review or criticism you disagreed with.', 'Whether you separate ego from the work and respond with curiosity.', 'The comment, your first reaction honestly, what you did to understand it (a conversation, an example), whether you changed your mind, and what shifted afterwards.'],
    ['conflict', 'Describe a time you had to work with a difficult or unresponsive stakeholder.', 'Persistence and creative communication without escalating too early.', 'What made it hard, the different approaches you tried (format, timing, channel), when and how you involved others, and how the work got unblocked.'],

    ['failure', 'Tell me about your biggest professional mistake.', 'Honesty, accountability and whether you improve systems, not just feelings.', 'A real mistake of meaningful size, your role in it, how you found and contained it, what you told others, the lasting fix, and one concrete later moment where it paid off.'],
    ['failure', 'Describe a project that did not meet its goals.', 'How you handle a miss: analysis, not defensiveness.', 'The goal and the miss in numbers, the main causes including your own, what you did to salvage or stop, and the practice you changed after.'],
    ['failure', 'Tell me about a time you underestimated a task.', 'Estimation judgement and how you communicate bad news.', 'What you assumed, when you noticed the slip, how soon you raised it, the options you offered, and how you estimate differently now.'],
    ['failure', 'Tell me about a time you shipped a bug to production.', 'Calm incident handling and blameless learning.', 'What broke and the impact, how you detected and fixed it, the postmortem, the guardrail you added (test, alert, rollout), and the effect on later releases.'],
    ['failure', 'Have you ever had to abandon something you worked hard on?', 'Whether you can let go of sunk costs for the right reasons.', 'What you built and why stopping was correct, the evidence that convinced you, how you told the team, what you salvaged, and what you took forward.'],

    ['ambiguity', 'Tell me about a time you had to make progress with very little information.', 'Comfort with uncertainty and how you structure it.', 'What was missing, the assumptions you wrote down, the smallest experiment or conversation that cut uncertainty, the decision you made, and how it held up.'],
    ['ambiguity', 'Describe starting a project with no clear owner or spec.', 'Initiative and the ability to create scope.', 'How you discovered what was needed, how you defined a first deliverable, who you aligned with, how you handled changes, and what shipped.'],
    ['ambiguity', 'Tell me about a time priorities changed in the middle of your work.', 'Flexibility without losing track of commitments.', 'The change and its cause, how you assessed what to keep, who you told and when, what you dropped or delayed, and how you protected quality.'],
    ['ambiguity', 'Describe a time you had to learn a domain you knew nothing about to deliver.', 'Speed of learning and humility.', 'The gap, your plan (people, docs, small prototypes), how you checked your understanding, what you delivered, and how you now ramp on unfamiliar areas.'],
    ['ambiguity', 'How did you handle a project where the goal kept shifting?', 'Whether you manage change or just endure it.', 'Why it kept shifting, how you made the cost of change visible, what you did to lock a stable core, and the result.'],

    ['impact', 'Tell me about the accomplishment you are most proud of.', 'What you value, and whether your work moves things that matter.', 'The problem and why it mattered, your specific contribution, the obstacles, a number for the result, and what it unlocked for others.'],
    ['impact', 'Describe a time you made something significantly faster, cheaper or more reliable.', 'Technical depth tied to measurable results.', 'The baseline measurement, how you found the bottleneck, options you weighed, what you changed, the before and after numbers, and any risk you managed.'],
    ['impact', 'Tell me about a time you went well beyond what was asked.', 'Initiative with judgement: did the extra work matter?', 'What was asked, what you noticed was really needed, how you checked it was worth doing, what you built, and what difference it made.'],
    ['impact', 'How have you measured the success of your work?', 'Whether you think in outcomes rather than activity.', 'Pick one project, name the metric you chose and why, how you collected it, what it showed, and one decision it changed.'],
    ['impact', 'Tell me about a time you improved a process for your team.', 'Seeing friction and fixing it for others.', 'The pain and its cost in time, how you proposed the change, how you got adoption, and the measured improvement.'],

    ['mentoring', 'Tell me about a time you helped a teammate grow.', 'Generosity with knowledge and the ability to teach.', 'Who they were and what they needed, how you adapted your approach, specific things you did (pairing, reviews, stretch tasks), and what they could do later.'],
    ['mentoring', 'Describe how you onboard a new engineer.', 'Whether you build systems for learning, not only answer questions.', 'A first-week plan, a small real task, who they meet, how you check in, how you gather feedback on the process, and one example of it working.'],
    ['mentoring', 'Tell me about giving difficult feedback to a peer.', 'Candor with care.', 'The behavior and its effect, how you prepared, how you delivered it (private, specific, kind), their reaction, and what changed.'],
    ['mentoring', 'Have you coached someone who was struggling?', 'Patience and whether you diagnose before prescribing.', 'What the struggle looked like, how you found the root cause, the support you set up, how you measured progress, and the outcome, including if it only partly worked.'],
    ['mentoring', 'Tell me about a time you taught something to a group.', 'Communication and the impact of spreading knowledge.', 'The topic and why it mattered, how you shaped it for the audience, how you checked understanding, and what changed afterwards.'],

    ['disagree', 'Tell me about a time you disagreed with your manager and what you did.', 'Whether you speak up respectfully and then commit.', 'The issue, how you raised it privately with evidence, the alternatives you offered, the decision, how you committed to it, and how it turned out.'],
    ['disagree', 'Describe a time you pushed back on a deadline or scope from leadership.', 'Honest negotiation instead of silent compliance or silent resistance.', 'The ask, your analysis of what was realistic, the options you brought, how you framed the tradeoff, the outcome.'],
    ['disagree', 'Tell me about a decision from above that you did not agree with but carried out.', 'Disagree and commit, without sulking.', 'What the decision was and why you doubted it, how you said so, how you then supported it fully, and what you learned about whether you were right.'],
    ['disagree', 'Have you ever been proven wrong after arguing strongly?', 'Humility and learning from being wrong.', 'The position you held, the evidence that changed things, how you acknowledged it, and how you argue differently now.'],
    ['disagree', 'Tell me about a time you escalated a concern.', 'Judgement about when and how to escalate.', 'What you tried first, why that was not enough, whom you told and how you framed it, and the resolution. Avoid casting anyone as the villain.'],

    ['deadline', 'Tell me about a time you had to deliver something quickly.', 'Prioritization and keeping quality under time pressure.', 'The deadline and why it was fixed, what you cut or deferred, how you de-risked, the delivery, and any debt you recorded to pay later.'],
    ['deadline', 'How do you handle several urgent tasks at once?', 'A real system for prioritization.', 'A concrete example: how you listed tasks, the criteria you used (impact, urgency, dependency), who you negotiated with, and what you did not do.'],
    ['deadline', 'Describe a time you missed a deadline.', 'Accountability and early communication.', 'What happened, when you flagged it, how you offered options, what you delivered when, and how you forecast differently now.'],
    ['deadline', 'Tell me about working under intense pressure.', 'Composure and sustainable behavior.', 'The situation, how you stayed organized, what you did for the team, what you refused to compromise on, and how you recovered after.'],
    ['deadline', 'Tell me about a time you had to cut scope.', 'Judgement about what matters most to users.', 'The constraint, the criteria you used to cut, how you sold the cut to stakeholders, what shipped, and how the cut items fared later.'],

    ['ownership', 'Tell me about a time you took ownership of something that was not your job.', 'Whether you act on gaps instead of waiting for assignment.', 'The gap and why it mattered, what you did to claim it responsibly, how you balanced your regular work, and what changed.'],
    ['ownership', 'Describe a time you saw a problem nobody was fixing.', 'Initiative and follow-through.', 'How you noticed it, how you decided it was worth your time, what you did, who you brought in, and the lasting result.'],
    ['ownership', 'Tell me about a time you owned a project end to end.', 'Breadth of responsibility beyond writing code.', 'From problem framing through launch and aftercare: key decisions, who you coordinated, how you handled setbacks, the outcome, and what you maintained afterwards.'],
    ['ownership', 'Describe a time you went back to fix something after it was already shipped.', 'Pride in quality and not walking away at launch.', 'What you noticed after launch, how you decided to reopen it, the fix, communication with stakeholders, and the improvement.'],
    ['ownership', 'Tell me about an on-call or incident experience.', 'Calm ownership when things are on fire.', 'The page, how you triaged, who you communicated with, the fix and the follow-up actions, and what the team changed in response.'],

    ['collaboration', 'Tell me about working on a cross-functional project.', 'Working with product, design and other roles in good faith.', 'The goal and roles, how you learned others’ constraints, a moment you compromised or translated, and the shared result.'],
    ['collaboration', 'Describe a time you had to rely on someone else to finish your work.', 'Managing dependencies and trust.', 'The dependency, how you set expectations, how you tracked progress, what you did when it slipped, and the outcome.'],
    ['collaboration', 'Tell me about a time you helped a team that was not your own.', 'Generosity and a company-first mindset.', 'Why you helped, what you did, how it affected your own commitments, and what both teams gained.'],
    ['collaboration', 'How do you give and receive feedback on design or code?', 'Habits that keep a team healthy.', 'Your practices in review (specific, kind, focused on the code), one example where feedback changed your design, and one where you gave feedback that landed well.'],
    ['collaboration', 'Describe a time you built consensus among people with different priorities.', 'Facilitation and influence.', 'The groups and their incentives, how you found common ground, the option you proposed, and the agreed result.'],

    ['growth', 'Tell me about a skill you taught yourself recently.', 'Learning habits and curiosity.', 'Why you needed it, your learning plan, how you tested your understanding, how you applied it, and what you would do again.'],
    ['growth', 'Describe a time you got feedback that changed how you work.', 'Coachability.', 'The feedback and who gave it, how you reacted, what you changed, and evidence it stuck.'],
    ['growth', 'What is a weakness you are actively working on?', 'Self-awareness and effort that is real, not staged.', 'A true weakness that does not disqualify you, how it showed up, the steps you are taking, and visible progress. No humblebrags.'],
    ['growth', 'Tell me about a time you were the least experienced person on a team.', 'Humility and speed of ramp.', 'What you did to learn fast, how you asked questions, how you contributed despite the gap, and what the team got from your fresh eyes.'],
    ['growth', 'Where do you want to grow in the next two years?', 'Ambition that matches the role and a realistic plan.', 'A direction (technical depth, scope, leadership), why it fits this team, what you have already done toward it, and what support you want.'],

    ['judgment', 'Tell me about a difficult technical tradeoff you made.', 'Structured thinking about cost, risk and reversibility.', 'The options, the criteria, what data you had, the choice, what you gave up knowingly, and how it played out.'],
    ['judgment', 'Describe a decision you made with incomplete data.', 'Calibrated risk-taking.', 'What you knew and did not, how you reduced risk, the decision rule you used, how you planned to revisit it, and the result.'],
    ['judgment', 'Tell me about a time you chose speed over perfection, or the reverse.', 'Whether you adapt your standard to the stakes.', 'The stakes, why you chose, what safeguards you kept, and how it turned out.'],
    ['judgment', 'Tell me about a time you used data to change someone’s mind.', 'Evidence-based influence.', 'The claim, what data you gathered, how you presented it without making it personal, and the changed decision.'],
    ['judgment', 'Describe prioritizing between technical debt and new features.', 'Long-term thinking without ignoring the business.', 'The pressure from both sides, how you quantified the debt, the plan you negotiated, and what happened.']
  ];
  var counter = {};
  B.questions = RAW.map(function (r) {
    counter[r[0]] = (counter[r[0]] || 0) + 1;
    return { id: r[0] + '-' + counter[r[0]], comp: r[0], q: r[1], tests: r[2], outline: r[3] };
  });
  // Amazon Leadership Principles: names are Amazon's; the descriptions are paraphrased.
  B.alp = [
    { id: 'customer', name: 'Customer Obsession', gist: 'Start from what the customer needs and work backwards. Earn trust and keep it, even when competitors are in your head.', qs: ['Tell me about a time you made a decision that was right for the customer but costly for you or your team.', 'Describe a time you found out customers were having a problem nobody had asked you to fix.'] },
    { id: 'ownership', name: 'Ownership', gist: 'Think long term, act for the whole company, and never say “that is not my job”.', qs: ['Tell me about a time you took on something outside your responsibility because it needed doing.', 'Describe a time you sacrificed a short-term win for a long-term outcome.'] },
    { id: 'invent', name: 'Invent and Simplify', gist: 'Look for new ideas and simpler ways to do things, and be comfortable being misunderstood while you try.', qs: ['Tell me about a time you simplified a complicated process or system.', 'Describe an idea you pushed that others did not initially understand.'] },
    { id: 'right', name: 'Are Right, A Lot', gist: 'Good judgement and instinct, built by seeking different views and testing your own beliefs.', qs: ['Tell me about a decision you made with limited data and how you checked yourself.', 'Describe a time you changed your mind because someone brought a better argument.'] },
    { id: 'learn', name: 'Learn and Be Curious', gist: 'Never finished learning. Explore new possibilities and act on them.', qs: ['Tell me about something you taught yourself that changed how you work.', 'Describe a time curiosity led you to a better solution.'] },
    { id: 'hire', name: 'Hire and Develop the Best', gist: 'Raise the bar with every hire and promotion, and coach people so they grow.', qs: ['Tell me about a time you helped someone become noticeably better at their job.', 'Describe how you judged whether a candidate or teammate was a strong addition.'] },
    { id: 'standards', name: 'Insist on the Highest Standards', gist: 'Hold standards that others may think are unreasonable high, and fix defects before they spread.', qs: ['Tell me about a time you refused to ship something that was not good enough.', 'Describe how you raised the quality bar for your team.'] },
    { id: 'think-big', name: 'Think Big', gist: 'Set bold directions that inspire results, and look beyond the obvious way.', qs: ['Tell me about a time you proposed something much bigger than what was asked.', 'Describe a goal you set that others thought was out of reach.'] },
    { id: 'action', name: 'Bias for Action', gist: 'Speed matters. Many decisions are reversible and do not need exhaustive study; calculated risk is fine.', qs: ['Tell me about a time you made a quick decision without all the facts.', 'Describe a time you moved ahead while others were still debating.'] },
    { id: 'frugal', name: 'Frugality', gist: 'Do more with less. Limits push resourcefulness and invention.', qs: ['Tell me about a time you delivered a result with far fewer resources than you wanted.', 'Describe a time you cut cost without hurting quality.'] },
    { id: 'trust', name: 'Earn Trust', gist: 'Listen carefully, speak candidly, treat others with respect, and hold yourself to your own mistakes.', qs: ['Tell me about a time you had to admit a mistake to your team.', 'Describe a time you earned the trust of someone sceptical of you.'] },
    { id: 'dive', name: 'Dive Deep', gist: 'Stay close to the details, audit often, and be sceptical when numbers and stories disagree.', qs: ['Tell me about a time a metric looked wrong and what you did about it.', 'Describe a time you dug into the details and found something others missed.'] },
    { id: 'backbone', name: 'Have Backbone; Disagree and Commit', gist: 'Challenge decisions respectfully even when it is uncomfortable, then commit fully once a decision is made.', qs: ['Tell me about a time you disagreed with a decision and what you did next.', 'Describe a time you committed to a plan you had argued against.'] },
    { id: 'results', name: 'Deliver Results', gist: 'Focus on the key inputs, deliver on time with quality, and rise to the occasion despite setbacks.', qs: ['Tell me about a time you delivered despite a major obstacle.', 'Describe the most important goal you hit and how you tracked it.'] },
    { id: 'env', name: 'Strive to be Earth’s Best Employer', gist: 'Make the workplace safe, productive and fair; lead with empathy and think about how people work.', qs: ['Tell me about a time you made your team’s environment better.', 'Describe how you supported a teammate who was going through a hard period.'] },
    { id: 'society', name: 'Success and Scale Bring Broad Responsibility', gist: 'Think about the wider effects of what you build on communities and the world, and aim to be better every day.', qs: ['Tell me about a time you considered the wider impact of a technical decision.', 'Describe a time you raised a concern about the side effects of a feature.'] }
  ];
  B.alp.forEach(function (p) { p.questions = p.qs.map(function (q, i) { return { id: 'alp-' + p.id + '-' + (i + 1), q: q }; }); });

  // Questions to ask your interviewer, by who is on the other side.
  B.ask = [
    { id: 'recruiter', name: 'Recruiter', note: 'Logistics, process and fit. They can tell you more than people expect.', items: [
      { q: 'What does the interview process look like from here, and how long does each step usually take?', good: 'A clear list of rounds, who runs them, what each covers, and typical timing. They offer to share prep material.', red: 'Vague answers, a process that changes every week, or no one can say how decisions are made.' },
      { q: 'How is the team structured, and what level is this role scoped at?', good: 'A specific team, a named level, and what that level is expected to deliver.', red: 'The level is “flexible” and nobody can say what is expected at it.' },
      { q: 'What is the compensation structure for this role and how are levels decided?', good: 'A range or a clear explanation of the components (base, equity, bonus) and how leveling works.', red: 'Refusal to share any range, or pressure to name your number first without context.' },
      { q: 'Why is this role open?', good: 'Growth, a new initiative or a backfill with a plain explanation.', red: 'Evasive answers or a role that has been open and rotating for a long time.' }
    ] },
    { id: 'manager', name: 'Hiring manager', note: 'They decide what your day-to-day looks like. Probe how they lead.', items: [
      { q: 'What would success look like in the first six months for this role?', good: 'Concrete outcomes tied to the team’s goals, with a plan for onboarding and early wins.', red: 'No clear expectations, or a list that clearly needs three people.' },
      { q: 'How do you give feedback and how often do you check in with your reports?', good: 'A regular cadence, examples of feedback, and a willingness to hear it in return.', red: 'Feedback only at review time, or “my door is always open” with nothing behind it.' },
      { q: 'What is the biggest challenge the team is facing right now?', good: 'Honest, specific and not catastrophic, with a view on how the team is handling it.', red: 'Defensive, or “nothing really”, or an issue that sounds like constant firefighting.' },
      { q: 'How do you decide what the team works on, and how does that change when plans shift?', good: 'A visible process, some stability, and a way for engineers to influence priorities.', red: 'Priorities set by whoever shouted last.' },
      { q: 'How does someone grow here, and who on your team has been promoted recently?', good: 'Named paths and real examples with timelines.', red: 'No recent promotions and no explanation.' }
    ] },
    { id: 'peer', name: 'Peer engineer', note: 'The best source for what it is actually like to work there.', items: [
      { q: 'What does a normal week look like for you?', good: 'A mix of focused work, meetings and reviews that sounds sustainable and specific.', red: 'Constant interruptions, unclear work, or heavy after-hours work described as normal.' },
      { q: 'How does code get from idea to production, and how long does it take?', good: 'A clear path: review, automated tests, deploys that are routine. A number of hours or days.', red: 'Manual steps, fear of deploys, or weeks to ship small changes.' },
      { q: 'What do you wish you had known before you joined?', good: 'A real, mild surprise and an honest explanation.', red: 'A long pause, a forced smile or “nothing”.' },
      { q: 'How are on-call and incidents handled?', good: 'A fair rotation, runbooks, blameless reviews, and time to recover after a bad night.', red: 'Constant pages, a single hero everyone depends on, or blame-heavy reviews.' },
      { q: 'What is your favorite and least favorite part of the codebase?', good: 'Candid technical detail and curiosity about improving it.', red: 'Nothing is ever allowed to change, or no one understands part of the system.' }
    ] },
    { id: 'staff', name: 'Senior or staff engineer', note: 'Ask about technical direction, quality bar and how decisions get made.', items: [
      { q: 'What technical decision from the last year do you most want to revisit?', good: 'A thoughtful retrospective on a real tradeoff with a view of what they learned.', red: 'Claims of no regrets, or blaming others.' },
      { q: 'How are major technical decisions made and documented here?', good: 'Design docs or similar, review by affected teams, and a record of the reasoning.', red: 'Decisions by the loudest voice or by whoever has the highest title.' },
      { q: 'How do you balance paying down technical debt with feature work?', good: 'Dedicated time or an explicit policy, backed by an example.', red: '“We will fix it later” with nothing ever scheduled.' },
      { q: 'What does good engineering look like on this team?', good: 'Specific practices (tests, reviews, ownership) that line up with how they actually work.', red: 'A cliché list with no examples.' }
    ] },
    { id: 'vp', name: 'VP or director', note: 'Strategy, bets and how the org sees this team. Keep it short and thoughtful.', items: [
      { q: 'What are the two or three bets this organization is making this year?', good: 'Clear priorities with reasons, and how this team connects to them.', red: 'Too many priorities, or priorities that changed twice in the last quarter.' },
      { q: 'How do you know when the team is succeeding, beyond shipping features?', good: 'A few outcome metrics and a habit of reviewing them.', red: 'Only activity metrics, or none.' },
      { q: 'What would make you change direction?', good: 'Named signals and evidence of a time they did.', red: 'No example of ever changing course.' },
      { q: 'What kind of engineer thrives in your organization?', good: 'A specific, honest profile you can compare yourself against.', red: 'A description that fits only people who never push back.' }
    ] },
    { id: 'bar', name: 'Bar raiser', note: 'A trained, independent interviewer. Ask about standards and decision quality.', items: [
      { q: 'What do the strongest hires have in common?', good: 'Specific behaviors, not credentials, with examples.', red: 'A vague list of buzzwords.' },
      { q: 'How does the company keep the hiring bar consistent across teams?', good: 'A described process with independent evaluators and a written rubric.', red: 'Standards that depend on who is hiring.' },
      { q: 'What is something you changed your mind about in your time here?', good: 'A candid example and the reason it changed.', red: 'Cannot think of one, or a canned answer.' },
      { q: 'How do you handle disagreement between interviewers on a candidate?', good: 'A structured debrief, written feedback and a clear decision rule.', red: 'Whoever is most senior wins.' }
    ] }
  ];
  // Flashcard deck, registered in the global OR.flashcards (deck 'behavioral').
  var CARDS = [
    ['What does STAR(L) stand for, and where should most of your time go?', 'Situation, Task, Action, Result, Learning. About half the answer should be Action: what **you** did and why.'],
    ['How long should a behavioral answer be?', 'About 1.5 to 2 minutes. Keep a 60-second version of each story for rushed interviews.'],
    ['Why say “I” instead of “we”?', 'The interviewer is scoring **you**. “We” hides your contribution. Use “we” for team results, “I” for decisions and actions.'],
    ['How do you quantify a result when you have no hard numbers?', 'Give scale and honest context: team size, duration, users affected, time saved. Never invent a percentage.'],
    ['What makes a failure story good?', 'A real mistake you owned, calm recovery, and a lasting change (a guardrail, a process), not a disguised strength.'],
    ['How many stories should you prepare, and why?', 'Eight to ten. Each can cover two or three competencies by changing the emphasis.'],
    ['How do you answer “tell me about a time you disagreed with your manager”?', 'Raise it privately with evidence, bring alternatives, then **commit** to the decision. Describe the problem, not the person.'],
    ['What is the “L” in STAR(L) for?', 'Learning: what you do differently now, with one concrete later example. It matters most for failure and conflict.'],
    ['What are interviewers really testing in conflict questions?', 'Whether you move toward problems with curiosity, can see the other view, and keep relationships intact.'],
    ['How do you handle a story that does not fit the question exactly?', 'Choose the closest one and say which part you are emphasizing, or briefly state the link before you begin.'],
    ['What does “disagree and commit” mean?', 'Challenge a decision openly while it is being made. Once it is made, support it fully, without undermining it.'],
    ['What should you do before answering a behavioral question?', 'Pause for two seconds, pick the story, and open with a one-sentence situation. Do not start and swerve.'],
    ['How should you handle a follow-up like “what did you personally do?”', 'Answer with specifics: the three or four actions that were yours, the choice you made, and what you would do differently.'],
    ['Name three good questions to ask a hiring manager.', 'What does success look like in six months? How do you give feedback? What is the team’s biggest challenge right now?']
  ];
  CARDS.forEach(function (c, i) { OR.flashcards.push({ id: 'behavioral:' + (i + 1), deck: 'behavioral', front: c[0], back: c[1] }); });
})();

