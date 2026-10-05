/* Offer Ready: Wellbeing. Short and practical: session length, rest days, sleep, burnout, after a rejection. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function restBlock() {
    var s = OR.store.get().settings, day = DAYS[s.restDay] || 'Sunday';
    var today = OR.plan && OR.plan.isRestDay && OR.plan.isRestDay(OR.today());
    return '<div class="banner">' + OR.icon('leaf') + '<div>Your rest day is <strong>' + esc(day) + '</strong>' + (today ? ', which is today. Nothing is due. Close the laptop.' : '.') +
      ' <a href="#/settings">Change it in Settings</a>.</div></div>';
  }

  var MD = `## Session length
Learning that sticks needs focus, and focus runs out. A simple rhythm that works for many people:

- **50 minutes on, 10 off.** Stand up, drink water, look at something far away. Do not check your phone in the break; it is not rest.
- **Two to four of these blocks a day is a good day.** Past about four hours of hard problem-solving, most people are retyping the same mistakes. If you have more time, spend it on lighter work: reading a lesson, reviewing flashcards, or sleeping.
- **Set a daily cap.** Pick the number of hours you will stop at, and stop. A plan you can sustain for ten weeks beats a plan you can sustain for ten days.
- **Start with the hardest thing** while your head is fresh, and end with something easy so the day finishes on a win.

These are starting points, not rules. Notice what works for you and adjust. Use the stopwatch in the top bar to see what you actually do, not what you hoped to.

## Rest days are part of the plan
The plan leaves one day a week free of required work. Your streak skips that day, so resting never costs you anything. Memory consolidates while you rest, and the weeks after a full day off are usually the sharper ones.

If you want to do something on your rest day, make it something that is not interview prep. If you are tempted to "catch up" there, that is a sign the plan has too many hours for your life: lower the weekly hours in Settings instead, and let the plan rebalance.

## Sleep and the night before
- **Protect sleep in the week before a loop**, even more than you protect study time. A tired mind misses the edge case you would normally spot.
- **The night before:** stop new material by early evening. Do one light thing: skim your story notes and your templates. Prepare your setup (charger, water, ID, a quiet room, a working camera and mic). Go to bed at your normal time, not an early one you cannot fall asleep at.
- **The morning of:** eat, move for ten minutes, and warm up with one easy problem you have already solved. Leave 15 minutes of slack so a late link does not become a crisis.
- **If you cannot sleep,** rest anyway. Lying calm still helps, and one bad night rarely wrecks an interview.

## Signs of burnout
Hard weeks are normal. These signs, lasting more than a week or two, mean it is time to change something:

- Dread about opening a problem, and procrastinating on things you used to enjoy.
- Reading the same problem over and over without understanding it.
- Sleep going badly, or snapping at people around you.
- Everything feels pointless, or you feel you are not good enough, however much you do.
- Practice stops improving, or gets worse, even though you are doing more of it.

**What to do:** take a full day off now, not "after this week". Cut the weekly hours for two weeks. Do easier problems and re-solve ones you like. Tell one person how you are. If it comes with low mood that does not lift, or thoughts of harming yourself, talk to a doctor, a counselor or someone you trust. Interview prep is not worth your health, and help is available.

Two good reads, both short: [Avoiding Interview Burnout (HN discussion)](https://news.ycombinator.com/item?id=5630445) and [The Long Game: Why Patience Beats Hustle](https://fs.blog/long-game/).

## After a rejection
Almost everyone who gets offers also collects rejections. A single no tells you very little: how the loop went on a given day, how the team was feeling, what the budget was. It does not measure you. Here is a plan that treats it that way.

### In the first 24 hours
1. **Feel it.** Be disappointed for an evening. Do not study, and do not rewrite your resume.
2. **Write down what you remember** while it is fresh: which questions, where you got stuck, what you would do differently. Ten minutes. Then close the notes.
3. **Do something physical and something social**: a walk, a meal with someone, a game.
4. **Reply politely** to the recruiter. Thank them and ask whether they can share any feedback. Many cannot; some will.
5. **Sleep.**

### In the first week
1. **Day 2:** read your notes. Sort the causes into three piles: *a gap I can close* (a pattern I had not practiced), *execution* (I knew it, I froze or rushed), and *not in my control* (the bar moved, the role was filled).
2. **Day 3:** pick one gap and put two problems on it into the [Plan](#/plan). Add one mock in the [Mock room](#/mock) for execution problems.
3. **Day 4 to 5:** go back to your normal schedule at a normal pace. Do not double hours to "make up" for it.
4. **Day 6:** check the [Pipeline](#/pipeline). Other processes are still alive. Send one follow-up or one new application.
5. **Day 7:** take your rest day. Many companies let you reapply after a cooling-off period that differs by company, so note the date in the Pipeline and move on.

Patience beats hustle. The people who get the offer are very often the ones who kept going at a pace they could hold.`;

  OR.views.wellbeing = {
    title: function () { return 'Wellbeing'; },
    render: function (main) {
      main.innerHTML = '<div class="page-narrow wb-page"><div class="page-head"><div><h1 class="page-title display">Wellbeing</h1>' +
        '<p class="page-lede">Short and practical. You will do better work if you are rested.</p></div></div>' +
        restBlock() + '<div class="prose wb-prose">' + OR.md(MD) + '</div></div>';
    }
  };

  OR.addSearch(function () {
    return [
      { group: 'Wellbeing', title: 'Wellbeing', icon: 'leaf', href: '#/wellbeing', keywords: 'rest sleep burnout break' },
      { group: 'Wellbeing', title: 'After a rejection: a 24-hour and one-week plan', icon: 'leaf', href: '#/wellbeing', keywords: 'rejected rejection burnout recover' }
    ];
  });
})();
