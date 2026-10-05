/* System design: the interview framework page (OR.sd.framework). Minutes must add up to the round length. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.framework = {
    intro: 'A fixed order for a 45-minute round so you never stall on "where do I start". Each step has a time box, a goal, and the sentence that shows the interviewer what you are doing.',
    steps: [
      { id: 'requirements', name: 'Requirements', minutes: 5,
        goal: 'Agree on what you are building and what "good" means before drawing anything.',
        do: ['Ask who the users are and the two or three core actions.', 'Split **functional** needs from **non-functional** ones: scale, latency, availability, consistency, durability.', 'Name what is **out of scope** and get a nod.', 'Ask which matters more when they conflict: consistency or availability, latency or cost.'],
        say: ['"Before I design, can I confirm the core use cases? I will take reads and writes as in scope and leave analytics out unless you want it."', '"I will assume we favour availability over strict consistency here. Tell me if that is wrong."'],
        avoid: ['Starting with boxes and arrows.', 'Asking ten questions with no pause; stop at the point where the answers would change the design.'] },
      { id: 'estimates', name: 'Estimates', minutes: 4,
        goal: 'Get orders of magnitude that decide the design: QPS, storage, bandwidth, and whether one machine could do it.',
        do: ['State assumptions out loud (DAU, actions per user, record size).', 'Compute average and peak QPS, storage over the retention period, and egress.', 'Round hard: 86,400 s per day is about 10^5.', 'Say what the numbers imply: read-heavy or write-heavy, does it fit on one node, is a cache worth it.'],
        say: ['"Assume 100 million new items a month. That is roughly 40 writes a second on average, and with a 100 to 1 read ratio about 4,000 reads a second."', '"Five years of 500-byte records is about 3 TB before replication, so a single database node is borderline and we should plan for sharding."'],
        avoid: ['False precision. 11,574 QPS is worse than "about 12K".', 'Doing the math silently or skipping the conclusion.'] },
      { id: 'api', name: 'API', minutes: 4,
        goal: 'Pin down the contract between clients and your system, so the data model has something to serve.',
        do: ['List the few endpoints for the core use cases, with method, path, key parameters, response.', 'Decide on pagination, idempotency and auth in one line each.', 'Choose REST, gRPC or events only if it matters to the design.'],
        say: ['"Two endpoints carry the product: create and read. Create is idempotent through a client-supplied key so retries are safe."'],
        avoid: ['Designing every CRUD endpoint.', 'Forgetting pagination on any list.'] },
      { id: 'data-model', name: 'Data model', minutes: 5,
        goal: 'Choose what is stored, how it is keyed, and which kind of store fits the access pattern.',
        do: ['Name the entities, their keys and the main relationships.', 'Write down the **access patterns**: what is looked up by what.', 'Pick SQL or NoSQL because of those patterns, not by habit.', 'Say how you would partition: by which key, and what makes a hot key.'],
        say: ['"The hot path is a point lookup by key with no joins, so a key-value or wide-column store fits and I would shard by hash of the key."'],
        avoid: ['Naming a database without tying it to an access pattern.', 'Ignoring indexes for the second query you will obviously need.'] },
      { id: 'high-level', name: 'High-level design', minutes: 10,
        goal: 'Draw the smallest set of boxes that satisfies the requirements, then trace the main paths through it.',
        do: ['Start with client, load balancer, stateless service, store. Add components only when a requirement or a number demands one.', 'Trace the write path and the read path out loud.', 'Mark where data is cached, queued, replicated.', 'Check the design against each requirement you wrote down.'],
        say: ['"Here is the write path: client, load balancer, service, ID generator, database. I am adding a cache on the read path because reads are 100 times writes."'],
        avoid: ['A diagram of every technology you know.', 'Drawing a component you cannot justify when asked "why is that there?".'] },
      { id: 'deep-dives', name: 'Deep dives', minutes: 12,
        goal: 'Go deep on the two or three hardest parts. This is where the level of the answer is judged.',
        do: ['Let the interviewer steer, and propose candidates yourself: ID generation, hot keys, fan-out, consistency.', 'For each: the problem, two or more options, a pick, and the cost of the pick.', 'Say what you would measure to know the choice was right.', 'Handle a failure: what happens when this node, queue or region dies?'],
        say: ['"There are two ways to do this. Option one is simple but has a single point of failure. Option two spreads the load but needs coordination. I would pick two because..."'],
        avoid: ['One option presented as the only option.', 'Hand-waving "we use Kafka" with no delivery or ordering story.'] },
      { id: 'tradeoffs', name: 'Bottlenecks and trade-offs', minutes: 5,
        goal: 'Show you can see your own design from the outside: what fails first, what you gave up, what you would do with more time.',
        do: ['Walk the diagram and say what breaks first at 10x load.', 'Name single points of failure and how you would remove them.', 'List what you chose not to build and why.', 'Mention monitoring: the two or three signals that tell you it is unhealthy.'],
        say: ['"At ten times the traffic the database write path breaks first. I would shard by key and put a queue in front of writes that can tolerate delay."'],
        avoid: ['Declaring the design perfect.', 'Ending with no summary; take 20 seconds to recap the main choices.'] }
    ],
    closing: '## If time runs short\n\nCut deep dives to one and keep the final five minutes. A complete, honestly-bounded design beats a perfect half. If you are behind at minute 20 with no diagram, say so, draw the simplest version, and ask which part the interviewer wants to go into.'
  };
})();
