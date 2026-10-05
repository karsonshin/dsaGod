/* System design case study: payment system. Schema: data/sd/schema.md. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'payment-system',
    title: 'Design a payment system',
    short: 'Charge customers exactly once. Idempotency, a double-entry ledger, a payment state machine, PSP webhooks, retries and reconciliation.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Idempotency', 'Ledger', 'Webhooks'],
    prompt: 'Design the payment backend for an e-commerce or marketplace platform. Customers pay for orders by card; you integrate with an external payment service provider (PSP), keep an accurate record of money movement, and handle failures without ever charging twice or losing a payment.',

    requirements: {
      functional: [
        'Accept a payment for an order: authorise and capture a card through an external PSP.',
        'Return a definitive status (succeeded, failed, pending) and keep it queryable.',
        'Record every money movement in a **double-entry ledger** for accounting and audit.',
        'Refund a payment, fully or partially.',
        'Receive PSP **webhooks** (asynchronous status changes, refunds, chargebacks) and apply them.',
        'Daily **reconciliation** against the PSP\'s settlement reports.'
      ],
      nonFunctional: [
        '**Correctness over everything**: never charge twice, never lose a successful payment, never let the ledger go out of balance.',
        '**Exactly-once effects** end to end, built from at-least-once delivery plus idempotency.',
        '**Durability and auditability**: every state change is recorded and can be explained later.',
        '**Availability** of the checkout path matters, but a clear failure is better than an ambiguous charge.',
        '**Security**: card numbers never touch our servers; reduce PCI scope by tokenization.',
        '**Scale** (stated assumption): about 2 million payments a day, with sharp peaks during sales events.'
      ],
      outOfScope: ['Building a card network or acquiring bank connection (we use a PSP).', 'Tax, invoicing and payouts to sellers in detail.', 'Subscription billing and dunning.', 'Multi-currency settlement and FX.', 'Fraud models, beyond a rules hook (a stretch topic below).'],
      assumptions: ['One primary region with a standby; a single PSP at first, with the design allowing more than one.', 'Amounts are stored as integers in the smallest currency unit.'],
      clarify: [
        { q: 'Which payment methods are in scope?', a: 'Cards through a PSP. Wallets and bank transfers follow the same shape (create, confirm, async result) so the design extends, but each has its own states.' },
        { q: 'Do we hold customer funds (a marketplace or wallet), or just pass payments through?', a: 'It decides whether the ledger needs customer or seller balance accounts. Assume a marketplace: the ledger tracks money owed to sellers as liabilities.' },
        { q: 'What should the user see if the PSP does not answer?', a: 'A "processing" state, not a failure. The outcome is unknown, so the system queries the PSP by our reference and the webhook settles it. Never guess and retry a charge without an idempotency key.' },
        { q: 'What is the reconciliation tolerance?', a: 'Zero unexplained differences. Mismatches go to an exceptions queue for a human, with a daily target for clearing it.' }
      ]
    },

    estimates: {
      intro: 'Assume 10 million daily active users on the platform. One in five pays on an average day, so there are 2 million payments a day. Each user also checks payment or order status about five times a day. Each payment produces a payment record, several ledger entries, an idempotency record and events, which we size at about 2 KB per payment. Financial records are kept 7 years.',
      inputs: { dau: 10e6, writesPerUser: 0.2, readsPerUser: 5, peakFactor: 5, bytesPerWrite: 2000, bytesPerRead: 1000, years: 7, replication: 3, hotFraction: 0.1, serverQps: 500, utilization: 0.5 },
      assumptions: [
        '**2 KB per payment** covers the payment row, attempts, about four ledger entries, the idempotency record and audit events.',
        'Peak is **5 times** average because flash sales and paydays create sharp bursts.',
        'A server handles only **500 requests a second** because most requests wait on the PSP\'s response (hundreds of milliseconds to seconds).',
        '**7 years** of retention for financial and audit records.',
        'Reads are status and history lookups of about 1 KB.'
      ],
      extra: [
        { label: 'Ledger entries per day', formula: '2M payments x ~4 entries', result: '~8 million rows a day (~93 a second)' },
        { label: 'PSP calls per payment', formula: '1 authorise + 1 capture (or 1 combined) + webhooks', result: '~2 to 3 external calls each' },
        { label: 'Duplicate delivery', formula: 'at-least-once webhooks and client retries', result: 'assume every operation will arrive 2+ times sometimes' },
        { label: 'Idempotency record lifetime', formula: 'longest retry window (for example 24 hours to 7 days)', result: 'keep keys at least that long' }
      ],
      notes: [
        'Throughput is **small**: about 23 payments a second on average and about 116 at peak. A single well-tuned relational primary can handle this. The challenge is correctness, not scale.',
        'Reads are about 580 a second on average and under 3,000 at peak, which a replica or small cache serves easily.',
        'Storage over 7 years is about 10 TB raw (about 31 TB replicated), modest and mostly cold. Partition the ledger by time for cheap archiving.',
        'Servers are limited by **waiting on the PSP**, not by CPU. Size the connection pools and timeouts, and use asynchronous handling so slow PSP calls do not tie up the whole fleet.'
      ]
    },

    api: [
      { method: 'POST', path: '/v1/payments', desc: 'Create and confirm a payment for an order.',
        request: '{\n  "orderId": "o_1042",\n  "amount": 4999,\n  "currency": "USD",\n  "paymentMethodToken": "pm_tok_9fk2",\n  "customerId": "c_77"\n}',
        response: '{\n  "paymentId": "pay_5a1c",\n  "status": "PROCESSING"\n}',
        notes: ['**Requires an `Idempotency-Key` header** (a client-generated UUID). The server stores the key with a hash of the request and the response, and replays the stored response for a retry. The same key with a different body returns **422**.', '`paymentMethodToken` comes from the PSP\'s hosted fields or SDK: the raw card number never reaches this API.', 'Amount is an **integer in minor units** (cents).'] },
      { method: 'GET', path: '/v1/payments/{paymentId}', desc: 'Current status and history of a payment.',
        response: '{\n  "paymentId": "pay_5a1c",\n  "status": "CAPTURED",\n  "amount": 4999,\n  "currency": "USD",\n  "refunded": 0\n}',
        notes: ['Clients poll this or receive a callback. Return the true state even if it is still `PROCESSING`.'] },
      { method: 'POST', path: '/v1/payments/{paymentId}/refunds', desc: 'Refund all or part of a captured payment.',
        request: '{ "amount": 1500, "reason": "damaged item" }',
        response: '{ "refundId": "re_90", "status": "PENDING" }',
        notes: ['Also needs an `Idempotency-Key`. Validate that the total refunded never exceeds the captured amount, inside the same transaction that records the refund.'] },
      { method: 'POST', path: '/v1/webhooks/psp', desc: 'Receive asynchronous events from the PSP.',
        request: '{ "id": "evt_31", "type": "charge.succeeded", "data": { "reference": "pay_5a1c", "amount": 4999 } }',
        response: '200 OK',
        notes: ['**Verify the signature** (an HMAC over the raw body with a shared secret) before parsing.', 'Respond **200 quickly** after durably recording the event, and process it afterwards. Deduplicate by event `id`.'] }
    ],
    apiNotes: ['Never return card data. Return only a token and the last four digits plus brand for display.', 'Use a PSP-side reference (our `paymentId`) on every PSP call so the PSP can also deduplicate and so we can look up any charge whose response we never received.'],

    data: {
      intro: 'This is a system of record for money, so use a **relational database with ACID transactions** and design the tables so that wrong states are hard to write: unique constraints for idempotency, an append-only ledger, and state transitions guarded by conditions.',
      entities: [
        { name: 'payment', purpose: 'One row per customer payment intent. Holds the state machine.', fields: [
          ['payment_id', 'string, primary key', 'Our reference; also sent to the PSP.'],
          ['order_id', 'string', 'Unique per successful payment, so an order cannot be paid twice.'],
          ['amount, currency', 'bigint, char(3)', 'Integer minor units. Never floating point.'],
          ['status', 'enum', '`CREATED, PROCESSING, AUTHORIZED, CAPTURED, FAILED, CANCELLED, PARTIALLY_REFUNDED, REFUNDED, DISPUTED`.'],
          ['version', 'int', 'Incremented on each transition; updates are conditional on the current status.'],
          ['psp, psp_ref', 'string', 'Which provider and its id for the charge, once known.'],
          ['created_at, updated_at', 'timestamp', '']
        ] },
        { name: 'idempotency_key', purpose: 'Makes a retried request return the original result instead of repeating the work.', fields: [
          ['key', 'string', 'Client-supplied, scoped per merchant or per user.'],
          ['request_hash', 'string', 'Hash of the body: same key with a different body is an error.'],
          ['status', 'enum', '`IN_PROGRESS` or `DONE`.'],
          ['response', 'json, nullable', 'Stored once the work finishes, replayed on retry.'],
          ['expires_at', 'timestamp', 'Kept at least as long as the longest retry window.']
        ] },
        { name: 'ledger_entry', purpose: 'Append-only double-entry postings. Never updated or deleted; mistakes are fixed by a new reversing entry.', fields: [
          ['entry_id', 'bigint, primary key', ''],
          ['txn_id', 'string', 'Groups the postings of one business event. Within a txn, debits equal credits.'],
          ['account_id', 'string', 'For example `customer_funds`, `psp_receivable`, `merchant_payable`, `fees_revenue`.'],
          ['direction', 'enum', '`DEBIT` or `CREDIT`.'],
          ['amount, currency', 'bigint, char(3)', 'Always positive; direction gives the sign.'],
          ['payment_id', 'string', 'Link back to the business object.'],
          ['created_at', 'timestamp', '']
        ] },
        { name: 'webhook_event', purpose: 'Inbox for PSP events: store first, process after, dedupe by the provider\'s event id.', fields: [
          ['psp_event_id', 'string, unique', 'The dedupe key.'], ['type, payload', 'string, json', ''],
          ['received_at, processed_at', 'timestamp', 'A null `processed_at` means retry.']
        ] },
        { name: 'outbox', purpose: 'Events to publish, written in the same transaction as the state change.', fields: [
          ['id', 'bigint', ''], ['topic, payload', 'string, json', ''], ['published_at', 'timestamp, nullable', 'A relay publishes unsent rows to the queue, at least once.']
        ] }
      ],
      storage: [
        { title: 'PostgreSQL or MySQL (relational, ACID)', verdict: 'Pick this',
          body: 'Transactions let a payment transition, its ledger postings and its outbox event commit together or not at all. Unique constraints enforce idempotency and one-payment-per-order. At 116 writes a second peak, a single primary with a synchronous standby is enough; shard by merchant or customer only if volume grows by orders of magnitude.\n\n```\nCREATE TABLE idempotency_key (\n  key          TEXT PRIMARY KEY,\n  request_hash TEXT NOT NULL,\n  status       TEXT NOT NULL,          -- IN_PROGRESS | DONE\n  response     JSONB,\n  expires_at   TIMESTAMPTZ NOT NULL\n);\nCREATE TABLE ledger_entry (\n  entry_id   BIGSERIAL PRIMARY KEY,\n  txn_id     TEXT   NOT NULL,\n  account_id TEXT   NOT NULL,\n  direction  TEXT   NOT NULL CHECK (direction IN (\'DEBIT\',\'CREDIT\')),\n  amount     BIGINT NOT NULL CHECK (amount > 0),\n  payment_id TEXT   NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n-- per txn, SUM(debit) must equal SUM(credit): checked in code before commit and by a periodic audit query\n```\n\nBalances are **derived** from entries (or maintained as a cached running balance updated in the same transaction). Use synchronous replication to a standby so a committed payment survives a primary loss.' },
        { title: 'NoSQL key-value or document store', verdict: 'Poor default',
          body: 'Scales writes horizontally, but money needs multi-row atomicity (state change plus balanced postings plus outbox) and uniqueness checks. Some stores offer limited transactions, but you give up joins for reporting and reconciliation queries, and you take on more of the correctness burden yourself. Defensible only for the idempotency cache or the webhook inbox, not for the ledger.' }
      ],
      decisions: [
        { title: 'How to record balances', question: 'How should the system track how much money each account holds or is owed?',
          options: [
            { name: 'A mutable balance column per account', pros: 'Cheap to read. One row to update.', cons: 'History is lost: you cannot explain a balance. A bug or a race overwrites it silently, and a hot account row is a contention point.' },
            { name: 'An append-only double-entry ledger', pros: 'Every movement is two or more immutable postings that sum to zero, so errors are detectable by checking totals, and every balance is explainable. Corrections are new reversing entries, so history is never rewritten.', cons: 'Balances need summing (or a maintained cache). More rows. Needs discipline to post complete transactions only.' },
            { name: 'Event sourcing for everything', pros: 'Full history and replay.', cons: 'Heavy machinery for a bounded domain; the ledger already gives the audit trail where it matters.' }
          ],
          pick: '**Append-only double-entry ledger**, with a derived or cached balance updated in the same transaction. Explain the invariant: for every transaction, total debits equal total credits, so money is never created or destroyed by a bug without a visible imbalance.' },
        { title: 'How to implement idempotency', question: 'A client retries after a timeout. The first request may have succeeded, failed, or still be running.',
          options: [
            { name: 'Check then act (SELECT, then INSERT if absent)', pros: 'Easy to read.', cons: 'A race: two concurrent retries both see "absent" and both charge.' },
            { name: 'Insert the key first under a unique constraint', pros: 'The database serialises concurrent requests: exactly one inserts the key and does the work; the others see the existing row and either wait, return the stored response, or return a "in progress" conflict.', cons: 'You must handle the crashed-mid-flight case: an `IN_PROGRESS` key with no result needs a timeout and a safe way to resume or query the PSP.' },
            { name: 'Rely on the PSP\'s own idempotency alone', pros: 'Less code.', cons: 'Covers only the PSP call, not your own state, ledger postings and order updates. Use it in addition, with the same key, not instead.' }
          ],
          pick: '**Insert the idempotency key first with a unique constraint**, store the request hash, run the work, and save the response with the final state. Pass a derived key to the PSP too, so a retry of the external call is also safe.' }
      ]
    },

    design: {
      intro: 'One service owns the payment lifecycle and one relational database holds payments, idempotency keys, the ledger, the webhook inbox and the outbox, so a state change and its ledger postings commit atomically. The PSP is an unreliable external dependency: calls may time out and results arrive again later by webhook. Everything downstream consumes events at least once and is idempotent. **Click any box** for the reasoning, or pick a scenario.',
      diagram: {
        title: 'Payment system high-level design',
        nodes: [
          { id: 'client', label: 'Checkout app (hosted card fields)', kind: 'client',
            detail: { why: 'The customer enters card details into fields served by the PSP (an iframe or SDK), which returns a **token**. Our page and servers only ever see the token, which keeps raw card data out of our systems.', tradeoffs: ['Tokenization takes most of our systems out of the highest PCI scope, at the cost of depending on the PSP\'s UI components and limiting customisation.', 'The client generates the `Idempotency-Key` once per checkout attempt and reuses it on every retry.'], scale: 'Double-clicks and retries on flaky mobile networks are normal traffic, not edge cases.' } },
          { id: 'api', label: 'API gateway', kind: 'lb',
            detail: { why: 'Authenticates the caller, rate limits, enforces the `Idempotency-Key` header, and routes to the payment service. Terminates TLS.', tradeoffs: ['Rate limit per customer and per IP to slow card-testing attacks.', 'Keep it thin: business rules belong in the payment service so they apply to every entry point.'], alternatives: ['Managed API gateway', 'Service mesh ingress'], scale: 'Not a throughput limit at about 116 requests a second at peak; protection and auth are its job.' } },
          { id: 'pay', label: 'Payment service', kind: 'service',
            detail: { why: 'Owns the payment state machine. On a request it claims the idempotency key, creates the payment, runs the risk check, calls the PSP with our reference, and records the result. All transitions are conditional updates.', tradeoffs: ['Calls the PSP **outside** any database transaction: never hold a lock while waiting on the network. Record intent first (`PROCESSING`), call, then record the outcome.', 'On a PSP timeout the outcome is **unknown**: leave the payment `PROCESSING` and resolve it by querying the PSP and by webhook.', 'Stateless, so any instance can finish another\'s work after a crash.'], alternatives: ['Orchestrator workflow engine for multi-step payment flows', 'Synchronous only (no webhooks): not possible for methods with async results'], scale: 'Concurrency waiting on PSP latency: size pools and timeouts, and put a circuit breaker on the PSP client.' } },
          { id: 'fraud', label: 'Risk and fraud check', kind: 'service',
            detail: { why: 'A synchronous rules check before charging: velocity limits per card and customer, amount thresholds, mismatches between country signals. Can decline, flag for review, or require extra authentication.', tradeoffs: ['Adds latency to every payment, so keep it fast with a strict timeout and a defined behaviour when it is slow (fail open for low risk amounts, fail closed for high).', 'False positives lose sales; false negatives cost chargebacks. It is a business trade-off tuned over time.'], alternatives: ['Machine-learning scoring service', 'The PSP\'s built-in risk tools'], scale: 'Feature lookups per request; cache velocity counters in a fast store.' } },
          { id: 'db', label: 'Payments and ledger DB', kind: 'db',
            detail: { why: 'One ACID relational database for payments, idempotency keys, the append-only ledger, the webhook inbox and the outbox. A transition, its postings and its outbox event commit in one transaction.', tradeoffs: ['Synchronous replication to a standby: a committed payment must survive a primary loss, at a small latency cost.', 'At about 116 writes a second peak, one primary suffices; partition the ledger by time to archive old data cheaply.', 'Unique constraints do real work: one idempotency key, one webhook event id, one successful payment per order.'], alternatives: ['Distributed SQL for multi-region writes', 'Separate ledger database (adds a distributed-transaction problem)'], scale: 'Hot account rows (a merchant\'s balance) become contention points; derive balances from entries or batch updates.' } },
          { id: 'psp', label: 'External PSP', kind: 'external',
            detail: { why: 'The payment service provider talks to card networks and banks. We send it a charge request with our reference and idempotency key, and it answers synchronously when it can and sends webhooks for later changes.', tradeoffs: ['Treat it as unreliable: timeouts, duplicates, out-of-order webhooks and partial outages happen.', 'Use the PSP\'s idempotency feature with a key derived from ours, so a retried call cannot create a second charge.', 'A second PSP behind an adapter interface gives failover, but the ledger and states must be PSP-neutral.'], alternatives: ['Multiple PSPs with routing by cost or success rate', 'Direct acquirer integration (large compliance burden)'], scale: 'Latency (hundreds of milliseconds to seconds) and rate limits, which dominate our server sizing.' } },
          { id: 'hook', label: 'Webhook receiver', kind: 'service',
            detail: { why: 'Accepts PSP callbacks. It verifies the HMAC signature over the raw body, writes the event to the inbox table (unique on event id), and returns 200 immediately. Processing happens after, so slow handling never makes the PSP retry.', tradeoffs: ['Store first, process second: if processing fails the event is still on disk and can be retried.', 'Events can arrive duplicated and out of order: apply them with the state machine, ignoring a transition that does not apply from the current state.', 'Accept only from the PSP\'s published addresses where possible, in addition to signature checks.'], scale: 'Webhook bursts after a PSP incident; the inbox absorbs them.' } },
          { id: 'queue', label: 'Event queue (outbox relay)', kind: 'queue',
            detail: { why: 'A relay reads unpublished rows from the outbox and publishes them to the queue. This guarantees that "payment succeeded" is published if and only if the transaction committed, without a distributed transaction.', tradeoffs: ['Delivery is **at least once**: the relay may publish a row twice after a crash, so consumers must be idempotent.', 'Per-payment ordering by partition key (payment id) keeps events in order for each payment.'], alternatives: ['Change data capture from the database log', 'Polling the outbox table directly'], scale: 'Consumer lag after an incident; monitor it and alert.' } },
          { id: 'worker', label: 'Idempotent consumers', kind: 'service',
            detail: { why: 'Consumers update the order service, send receipts, update analytics and run retries for stuck payments. Each tracks processed event ids (or applies state changes that are naturally idempotent), so a duplicate delivery changes nothing.', tradeoffs: ['"Exactly once" is achieved as **at-least-once delivery plus idempotent handling**, not by the queue alone.', 'Failed events retry with exponential backoff, then land in a dead-letter queue for a human, so a poison message does not block the stream.'], alternatives: ['Workflow engine with durable timers', 'Transactional inbox per consumer'], scale: 'A backlog from one slow consumer; give each consumer its own subscription so they do not block each other.' } },
          { id: 'psprep', label: 'PSP settlement report', kind: 'storage', layer: 5,
            detail: { why: 'The PSP\'s own daily record of what it charged, refunded and settled. It is the external ground truth we compare against our ledger.', tradeoffs: ['Delivered as a file or an API pull, usually hours after the day closes, so reconciliation is a next-day control.', 'Formats differ per provider; normalise into one internal shape.'], scale: 'Millions of rows a day; process in batches keyed by PSP reference.' } },
          { id: 'recon', label: 'Reconciliation job', kind: 'service',
            detail: { why: 'Joins the PSP report to our payments and ledger by PSP reference and amount. It finds payments we think succeeded but the PSP never charged, charges we never recorded, and amount mismatches, and writes them to an exceptions queue.', tradeoffs: ['It is a **detective** control that catches bugs, outages and missed webhooks that the real-time path cannot.', 'Automatic fixes are limited to safe cases (apply a missing webhook); everything else goes to a human with the evidence attached.'], scale: 'Runs in batches; cost is proportional to daily volume and is not on the customer path.' } }
        ],
        edges: [
          { from: 'client', to: 'api', label: 'HTTPS' },
          { from: 'api', to: 'pay' },
          { from: 'pay', to: 'fraud', label: 'risk check' },
          { from: 'pay', to: 'db', label: 'txn' },
          { from: 'pay', to: 'psp', label: 'charge' },
          { from: 'psp', to: 'hook', label: 'webhook', style: 'async' },
          { from: 'hook', to: 'db', label: 'inbox' },
          { from: 'db', to: 'queue', label: 'outbox', style: 'async' },
          { from: 'queue', to: 'worker', style: 'async' },
          { from: 'db', to: 'recon', label: 'our books' },
          { from: 'psprep', to: 'recon', label: 'their books' }
        ],
        scenarios: [
          { id: 'pay', label: 'Pay (happy path)', steps: [
            { title: 'Submit with key', path: ['client', 'api', 'pay'], note: 'The client sends the token, amount and an `Idempotency-Key`. The gateway authenticates and forwards.' },
            { title: 'Claim the key', path: ['pay', 'db'], note: 'In one transaction: insert the idempotency key (unique), create the payment as `PROCESSING`. A concurrent duplicate hits the unique constraint and returns the same payment.' },
            { title: 'Risk check', path: ['pay', 'fraud'], note: 'Run the rules check with a short timeout. A decline marks the payment `FAILED` and stops here.' },
            { title: 'Charge the PSP', path: ['pay', 'psp'], note: 'Call the PSP with our `paymentId` as the reference and a derived idempotency key, outside any database transaction.' },
            { title: 'Record the outcome', path: ['pay', 'db'], tone: 'ok', note: 'On success, one transaction: payment to `CAPTURED` (conditional on `PROCESSING`), balanced ledger postings, an outbox event, and the stored idempotency response.' },
            { title: 'Publish', path: ['db', 'queue', 'worker'], note: 'The relay publishes the outbox event; consumers update the order and send a receipt, each idempotently.' }
          ] },
          { id: 'retry', label: 'Timeout and retry', steps: [
            { title: 'Charge call times out', path: ['pay', 'psp'], tone: 'hard', note: 'No answer from the PSP. The outcome is **unknown**: the charge may have succeeded. Do not mark the payment failed.' },
            { title: 'Leave it processing', path: ['pay', 'db'], note: 'The payment stays `PROCESSING` and the client gets a pending status. A retry with the same key finds the existing payment instead of creating another.' },
            { title: 'Resolve by query or webhook', path: ['psp', 'hook'], note: 'The PSP\'s webhook says what happened (or a retry job queries the PSP by our reference). Either way the answer is deterministic.' },
            { title: 'Apply once', path: ['hook', 'db'], tone: 'ok', note: 'The event goes into the inbox (unique on event id), then a conditional transition `PROCESSING` to `CAPTURED` with its ledger postings. A duplicate webhook finds the state already moved and does nothing.' }
          ] },
          { id: 'recon', label: 'Reconciliation', steps: [
            { title: 'Load PSP report', path: ['psprep', 'recon'], note: 'After the day closes, pull the PSP\'s settlement file and normalise it by PSP reference.' },
            { title: 'Load our books', path: ['db', 'recon'], note: 'Read the day\'s payments and ledger postings for the same references.' },
            { title: 'Match and flag', nodes: ['recon', 'db', 'psprep'], edges: ['db>recon', 'psprep>recon'], tone: 'hard', note: 'Match by reference and amount. Flag three classes: ours but not theirs, theirs but not ours, and amount mismatches. Safe cases are auto-fixed; the rest go to a human queue.' }
          ] }
        ]
      },
      walkthrough: [
        '**Idempotency first**: every mutating request carries a key; the database\'s unique constraint decides who does the work.',
        '**Intent, then effect**: record `PROCESSING`, call the PSP outside the transaction, then record the outcome and ledger postings atomically.',
        '**Unknown is a state**: a timeout is not a failure; resolve by webhook or by querying the PSP with our reference.',
        '**Events**: outbox plus relay gives at-least-once publishing; consumers are idempotent, so the effect happens once.',
        '**Trust but verify**: daily reconciliation compares our ledger with the PSP report and surfaces anything the real-time path missed.'
      ],
      notes: ['Draw the line between **what must be atomic** (state change, ledger postings, outbox row: one database transaction) and **what is only eventually consistent** (the order service, receipts, analytics).']
    },

    deepDives: [
      { id: 'idempotency', title: 'Idempotency keys',
        question: 'A mobile client times out and retries a payment request. How do you guarantee the customer is charged once?',
        answer: 'The client generates a unique **idempotency key** per user intent (one per checkout attempt) and sends it on every retry. The server treats the key as the identity of the operation.\n\nOn arrival, **insert the key first** with a unique constraint, together with a hash of the request and `status = IN_PROGRESS`:\n\n```\nINSERT INTO idempotency_key (key, request_hash, status, expires_at)\nVALUES (:key, :hash, \'IN_PROGRESS\', now() + interval \'7 days\')\nON CONFLICT (key) DO NOTHING;\n-- 1 row inserted: we own this request, do the work.\n-- 0 rows: someone already has it. Read the row:\n--    DONE         -> return the stored response unchanged\n--    IN_PROGRESS  -> return 409 or wait briefly (a concurrent duplicate)\n--    hash differs -> 422, the key was reused with a different request\n```\n\nWhen the work finishes, store the final response and set `DONE` in the same transaction as the state change. Because the check and the claim are one atomic statement, two concurrent retries cannot both proceed (a plain SELECT-then-INSERT would race).\n\nPass a **derived key to the PSP** too (for example `payment_id + attempt number`) so that a retried external call cannot create a second charge. Keep keys at least as long as the longest retry window.',
        followups: [
          { q: 'What if the server crashes after claiming the key but before finishing?', a: 'The key stays `IN_PROGRESS`. A retry sees it, and after a timeout the payment service resumes from the payment\'s state: if the payment is `PROCESSING`, query the PSP by our reference to learn the outcome, then complete. Never blindly charge again.' },
          { q: 'Where does the client get the key?', a: 'The client creates a UUID when the user starts the checkout and persists it for that attempt, so an app restart reuses it. A new attempt after a decline uses a new key.' },
          { q: 'Is a database unique constraint enough, or do you need a distributed lock?', a: 'The unique constraint is enough because the key lives in the same database as the payment. A lock service adds failure modes without adding safety.' }
        ] },
      { id: 'ledger', title: 'The double-entry ledger',
        question: 'How do you record money movement so that it is correct, auditable and fixable?',
        answer: 'In **double-entry bookkeeping** every business event is a transaction made of at least two postings, debits and credits, in which **total debits equal total credits**. Money is never created or destroyed, only moved between accounts.\n\nCapturing a 4,999-cent payment for a marketplace might post:\n\n| Account | Debit | Credit |\n|---|---|---|\n| `psp_receivable` (what the PSP owes us) | 4,999 | |\n| `merchant_payable` (what we owe the seller) | | 4,999 |\n\nLater, the PSP settlement moves money from receivable to cash; the payout moves it from payable to cash. Fees add postings to a revenue account.\n\nRules that make it trustworthy:\n\n- **Append-only**: never update or delete an entry. Mistakes are fixed with a **reversing transaction**, so history stays intact.\n- **Atomic**: all postings of a transaction commit together, with the payment state change and outbox event, in one database transaction.\n- **Integers** in minor units, with a currency on every posting; never floating point.\n- **Invariant check**: before commit, assert the transaction balances; periodically run an audit query that finds any unbalanced transaction.\n- **Balances are derived** by summing entries (or kept as a cached running total updated in the same transaction).\n\nThe ledger answers "why is this balance what it is" and makes reconciliation a comparison of two sets of records.',
        followups: [
          { q: 'Why not just keep a balance column?', a: 'A balance column cannot explain itself, hides bugs (a lost update just changes a number), and cannot be audited or replayed. The ledger makes errors visible as imbalances and keeps full history.' },
          { q: 'How do you avoid a hot row for a very busy account?', a: 'Because entries are appended, there is no row to contend on. If you keep a cached balance, update it in batches, or split a busy account into sub-accounts and sum them.' },
          { q: 'How do you correct a wrong posting?', a: 'Post a new transaction that reverses it (swap debit and credit) and a new correct one, both linked to the original and with a reason. Never edit the old entries.' }
        ] },
      { id: 'state-machine', title: 'The payment state machine',
        question: 'Describe the states of a payment and how you stop invalid or duplicate transitions.',
        answer: 'Main path: `CREATED -> PROCESSING -> AUTHORIZED -> CAPTURED`, with `PROCESSING -> FAILED` and `CREATED or AUTHORIZED -> CANCELLED` (a void). After capture: `PARTIALLY_REFUNDED`, `REFUNDED`, and `DISPUTED` for a chargeback. `FAILED`, `CANCELLED` and `REFUNDED` are terminal for the charge.\n\nA card flow often splits into **authorise** (reserve funds) and **capture** (take them); many shops do both at once. Keep the states even if you combine the calls.\n\nEnforce transitions with a table in code and a **conditional update**:\n\n`UPDATE payment SET status = \'CAPTURED\', version = version + 1 WHERE payment_id = :id AND status = \'PROCESSING\'`\n\nZero rows updated means the transition no longer applies (already done, or a competing event won), so the handler does nothing and returns the current state. That makes duplicate webhooks, retries and races harmless. Every transition appends to an audit log with its cause.\n\nBecause PSP events can arrive **out of order** (a "refunded" before a "captured"), the handler should buffer or re-fetch the PSP\'s current state rather than blindly trusting arrival order.',
        followups: [
          { q: 'What state do you show the user while waiting on the PSP?', a: '`PROCESSING`. It is honest: we do not know yet. The order page shows "payment in progress" and updates when the webhook or poll resolves it.' },
          { q: 'Why separate authorise and capture?', a: 'Authorise reserves funds and lets you decide later (when stock is confirmed or the item ships); capture takes the money. An authorisation that is not captured in time expires, so a capture job must track deadlines.' }
        ] },
      { id: 'psp', title: 'Integrating with the PSP: timeouts, webhooks and retries',
        question: 'The PSP call times out. What now? And how do you handle its webhooks and your retries safely?',
        answer: 'A timeout means the outcome is **unknown**, not "failed". The PSP may have charged the card. So never create a new charge. Instead:\n\n1. Leave the payment `PROCESSING` and return a pending status to the client.\n2. **Retry the same call with the same idempotency key** (the PSP returns the original result), or **query the PSP by our reference** to learn what happened.\n3. Let the webhook settle it too, whichever arrives first, applied once through the conditional state transition.\n\nRetry with **exponential backoff and jitter**, a cap on attempts, and a **circuit breaker** so a failing PSP does not exhaust threads. Distinguish **retryable** errors (timeout, 5xx, rate limit) from **definitive** ones (card declined, invalid card) that must not be retried.\n\n**Webhooks**: verify the HMAC signature on the raw body, store the event in an inbox table (unique on event id), return 200 immediately, and process afterwards. Expect duplicates and reordering. If processing fails, retry from the inbox; the PSP\'s own retries are a second line of defence.\n\nA sweeper job finds payments stuck in `PROCESSING` beyond a time limit and resolves them by querying the PSP.',
        followups: [
          { q: 'Why call the PSP outside a database transaction?', a: 'A transaction holding locks while waiting seconds on the network blocks other work and can time out in the middle, leaving the outcome unknown anyway. Record intent, release locks, call, then record the result.' },
          { q: 'Why verify webhook signatures?', a: 'The endpoint is public. Without verification anyone could post "charge succeeded" for an unpaid order. Verify an HMAC over the raw body with the shared secret, ideally with a timestamp to resist replays.' },
          { q: 'How do you use two PSPs?', a: 'Put each behind a common adapter interface and route by cost or success rate, with failover on definitive outages. Never fail over a payment whose outcome is unknown at PSP A, because the card may be charged twice; resolve it first.' }
        ] },
      { id: 'exactly-once', title: 'Exactly-once effects with idempotent consumers',
        question: 'How do you make sure "payment succeeded" updates the order exactly once when the queue delivers at least once?',
        answer: 'True exactly-once delivery across systems is not something you can assume. What you build is **exactly-once effects**: at-least-once delivery plus idempotent processing.\n\n**Producer side, the outbox pattern**: write the event to an `outbox` table in the **same transaction** as the payment change. A relay reads unpublished rows and publishes them, marking them sent. If it crashes after publishing but before marking, the event is published again: a duplicate, never a loss. This avoids the dual-write problem (updating the database and the queue as two separate steps, where one can fail).\n\n**Consumer side**: make handling idempotent. Options: record processed event ids in a table in the same transaction as the effect (insert fails on a duplicate, so skip), or design the effect so repeating it is harmless (`SET status = \'PAID\'` rather than `balance = balance + x`). Key the queue by payment id to keep per-payment ordering.\n\nFailures retry with backoff, and after a limit go to a **dead-letter queue** with alerts, so one poison message cannot block everything.',
        followups: [
          { q: 'Why not publish to the queue inside the database transaction?', a: 'A database and a queue cannot commit atomically without a distributed transaction. One can succeed and the other fail, so you either lose the event or announce a payment that was rolled back. The outbox turns it into a single local transaction.' },
          { q: 'Does a queue that claims exactly-once solve this?', a: 'It may give exactly-once within its own boundary (for example a stream processor), but your consumer\'s side effects (a database write, an email) are outside it. Idempotent handlers are still needed at the edges.' }
        ] },
      { id: 'consistency', title: 'Consistency requirements and what can be eventual',
        question: 'Which parts of the system need strong consistency and which can lag?',
        answer: '**Strong (inside one database transaction):** the payment state change, the ledger postings, the idempotency record, and the outbox row. These must agree or the books are wrong. This is why one relational database with synchronous replication to a standby is a good default.\n\n**Eventual (via events):** the order service learning of the payment, receipts, analytics, search, notifications. These can lag seconds and are idempotent consumers of the outbox.\n\n**Read-your-writes** for the paying user: read the payment from the primary (or the cache updated at commit) right after paying, not from a lagging replica, or the user sees "unpaid" after paying and pays again. Combined with the order-level uniqueness (one successful payment per order) a duplicate attempt is rejected anyway.\n\nAcross services avoid distributed transactions (two-phase commit). Use a **saga**: local transactions plus compensations (a refund as the compensation for a captured payment when the order cannot be fulfilled).',
        followups: [
          { q: 'Why not shard the ledger by account for scale?', a: 'A transaction touching two accounts on two shards then needs a cross-shard commit. At this volume a single primary is enough; if you must shard, partition so most transactions are local (by merchant or by payment) and treat cross-shard moves as sagas.' },
          { q: 'What if the primary fails?', a: 'Promote the synchronous standby: no committed payment is lost. In-flight requests retry with their idempotency keys and resolve against the new primary.' }
        ] },
      { id: 'pci', title: 'PCI scope reduction with tokenization',
        question: 'How do you avoid storing card numbers yet still charge returning customers?',
        answer: 'The card number is entered into **PSP-hosted fields** (an iframe or SDK element served by the PSP), so it travels from the customer\'s device to the PSP and never through our servers. The PSP returns a **token**, an opaque id that stands in for the card and is useless to an attacker outside that PSP account.\n\nWe store only the token plus **non-sensitive display data** (brand, last four digits, expiry). To charge, we send the token to the PSP. For returning customers the token is saved against the customer, with consent.\n\nThis **reduces PCI DSS scope**: systems that never store, process or transmit card data fall out of the most demanding requirements. Scope reduction is not scope elimination: the checkout page still needs to be secured (a script injected into it can tamper with the page around the hosted fields), and you still follow the PSP\'s rules and your own security practices. Check the exact requirements with a qualified assessor; do not claim to be "PCI compliant" because you use a token.\n\nNever log request bodies or card data, and keep secrets (API keys, webhook secrets) in a secrets manager.',
        followups: [
          { q: 'Where do you keep the PSP API key?', a: 'In a secrets manager with rotation, loaded at startup, never in source control or logs, and scoped to the minimum permissions.' },
          { q: 'What if you want to change PSPs and the tokens belong to the old one?', a: 'Tokens are usually not portable between providers. Plan for a secure card migration process between PSPs, or a token vault service that holds mappings, and treat it as a project, not a switch.' }
        ] },
      { id: 'refunds', title: 'Refunds, chargebacks and reconciliation',
        question: 'Cover refunds, chargebacks and daily reconciliation briefly.',
        answer: '**Refund**: an idempotent request against a captured payment. In one transaction check that `already_refunded + amount <= captured`, insert a refund row, and post the reversal (debit `merchant_payable`, credit `psp_receivable`). Call the PSP with our refund reference. A refund is asynchronous: it is `PENDING` until the PSP confirms by webhook, and can fail. Partial refunds move the payment to `PARTIALLY_REFUNDED`.\n\n**Chargeback (dispute)**: the cardholder disputes the charge with their bank. The PSP notifies us by webhook. Mark the payment `DISPUTED`, post provisional entries (money pulled back, plus a dispute fee), and open a case with a deadline to submit evidence (order, delivery proof). Outcome events then post the final entries: won (funds returned) or lost (loss stands). A chargeback can arrive weeks after the payment, so ledger and state history must be kept long.\n\n**Reconciliation**: each day, join the PSP settlement report to our payments and ledger by PSP reference and amount. Categories: matched; **ours only** (we recorded success the PSP never charged); **theirs only** (a charge we never recorded, a missed webhook); **amount differs** (fees, currency or partial refund). Auto-resolve the safe cases and queue the rest with evidence. Every unexplained difference is a bug until proven otherwise.',
        followups: [
          { q: 'Why is reconciliation needed if you already handle webhooks?', a: 'Webhooks can be lost, ignored or buggy, and our code can be wrong. Reconciliation is an independent check against the PSP\'s own records that catches what the real-time path missed.' },
          { q: 'How do you prevent over-refunding under concurrency?', a: 'Make the check and the insert atomic: lock the payment row (or use a conditional update on the refunded total) in the same transaction as the refund insert, and use an idempotency key so a retry does not refund twice.' }
        ] },
      { id: 'fraud', title: 'Stretch: fraud checks',
        question: 'Where do fraud checks fit, and what trade-offs come with them?',
        answer: 'Run a **synchronous risk check** before calling the PSP, with a strict timeout. Cheap signals: velocity (payments per card, device or IP in a window), amount and country mismatches, new account plus high value, previously disputed cards. Output: **approve**, **decline**, **review** (hold and queue for a person), or **step up** (ask for 3-D Secure or another extra authentication).\n\nBeyond that, do **asynchronous** analysis that can cancel an authorisation before capture or block a customer later.\n\nTrade-offs: stricter rules block more fraud and more good customers. Decide behaviour on a **slow or failed** risk service explicitly (fail open for small amounts, closed for large ones). Keep the decision and its inputs in the audit log; you will need them for disputes and for improving the rules.',
        followups: [
          { q: 'How do you keep velocity counters fast?', a: 'Sliding-window counters in an in-memory store keyed by card token, device and IP with expiry, updated on each attempt; the authoritative history stays in the database.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Waiting on the PSP', problem: 'Each payment holds a request open for the PSP\'s response (hundreds of milliseconds to seconds), so concurrency, not CPU, limits throughput, and a slow PSP exhausts the pool.', mitigation: 'Timeouts, a circuit breaker, bulkheaded connection pools, asynchronous handling with a pending status, and a second PSP behind an adapter if the business needs it.' },
      { title: 'The ambiguous outcome', problem: 'A timeout leaves you unsure whether the card was charged. Guessing either way causes a double charge or a lost payment.', mitigation: 'Keep an explicit `PROCESSING` state, pass an idempotency key and our reference to the PSP, resolve by query and webhook, and run a sweeper for stuck payments.' },
      { title: 'Hot rows in the ledger', problem: 'A very busy merchant account that is updated by every payment becomes a lock contention point if balances are kept in one mutable row.', mitigation: 'Append-only entries with derived balances, batched updates to cached balances, or splitting accounts into sub-accounts that are summed.' },
      { title: 'Peak load during sales', problem: 'Flash sales produce about 5 times average load for a short time, and every request hits the database and the PSP.', mitigation: 'Provision the primary for peak (116 writes a second is modest), queue non-critical work, rate limit per customer, and agree PSP rate limits in advance. Show a pending state instead of failing.' },
      { title: 'Webhook storms and duplicates', problem: 'After a PSP incident, thousands of delayed or repeated events arrive at once, out of order.', mitigation: 'Inbox with a unique event id, fast 200 responses, a processing queue with its own scaling, and state-machine conditional transitions that ignore events that no longer apply.' },
      { title: 'Reconciliation lag', problem: 'The PSP report arrives hours after the day closes, so errors are found the next day, and a mismatch can mean money is already wrong.', mitigation: 'Frequent intra-day checks by querying the PSP for stuck payments, alerts on mismatch counts, and an exceptions queue with a service-level target.' }
    ],

    mistakes: [
      'Treating a **PSP timeout as a failure** and retrying with a new charge.',
      'Check-then-insert for idempotency, which races, instead of insert-first with a unique constraint.',
      'Storing **balances only**, with no ledger entries, so nothing can be audited or explained.',
      'Using **floating point** for money.',
      'Calling the PSP **inside a long database transaction**, holding locks across the network.',
      'Writing to the database and publishing to the queue as two separate steps (the dual-write problem), instead of an outbox.',
      'Processing a webhook before **verifying its signature**, or not deduplicating by event id.',
      'Assuming events arrive **in order** and exactly once.',
      'Editing or deleting ledger entries instead of posting a reversing entry.',
      'Skipping reconciliation, or claiming "exactly once" without saying how (idempotent handlers).',
      'Logging full request bodies, which may include card or personal data.',
      'Not making refunds idempotent or not checking the refunded total against the captured amount in the same transaction.'
    ],

    pushes: [
      { q: 'How do you guarantee a customer is never charged twice?', why: 'This is the headline requirement; they want the layers, not one trick.', good: 'Client idempotency key with insert-first unique constraint, derived key to the PSP, one successful payment per order constraint, conditional state transitions, and reconciliation as the independent check.' },
      { q: 'The PSP times out. What do you tell the user and what do you do?', why: 'Tests the "unknown outcome" reasoning.', good: 'Show processing, not failure; retry the same call with the same key or query by reference; resolve via webhook; sweeper for stuck payments; never issue a new charge until the first is resolved.' },
      { q: 'Why double-entry accounting instead of a balance column?', why: 'Checks whether you can justify the heavier model.', good: 'Debits equal credits gives a checkable invariant, append-only gives an audit trail, reversing entries fix mistakes without rewriting history, balances are derived.' },
      { q: 'How do you get exactly-once processing?', why: 'A classic trap: exactly-once delivery is not available.', good: 'At-least-once delivery plus idempotent consumers, the outbox pattern on the producer side, dedupe by event id in the same transaction as the effect, and a dead-letter queue.' },
      { q: 'What would you reconcile and how often?', why: 'Operational thinking about money.', good: 'PSP settlement report against payments and ledger by reference and amount, daily at least, with ours-only, theirs-only and mismatch buckets, auto-fix for safe cases and a human queue for the rest.' },
      { q: 'How do you handle PCI?', why: 'Security and compliance awareness.', good: 'Hosted fields and tokenization so card data never reaches us, store only token and display data, no card data in logs, secrets in a vault, and a clear statement that scope is reduced, not removed.' }
    ],

    quiz: [
      { kind: 'concept', q: 'A charge request to the PSP times out. What is the correct handling?', choices: ['Leave the payment processing, then resolve by retrying with the same idempotency key, querying by reference, or the webhook', 'Mark it failed and let the customer try again', 'Immediately send a new charge with a new key', 'Refund the customer to be safe'], answer: 0, explain: 'The outcome is unknown. A new charge could double-charge, and marking failed could lose a successful payment. Resolve it using the same key or the PSP\'s record.' },
      { kind: 'concept', q: 'Why is "SELECT the key, then INSERT if missing" a bad way to implement idempotency?', choices: ['Two concurrent retries can both see it missing and both proceed', 'SELECT is slower than INSERT', 'It cannot store the response', 'Unique constraints do not exist in SQL'], answer: 0, explain: 'The check and the claim are separate steps, so they race. An INSERT under a unique constraint is atomic: exactly one request wins.' },
      { kind: 'concept', q: 'In a double-entry ledger, which statement holds for every transaction?', choices: ['Total debits equal total credits', 'There is exactly one posting per transaction', 'Entries are edited when a mistake is found', 'Balances are stored and entries are optional'], answer: 0, explain: 'That invariant makes errors detectable. Mistakes are corrected by posting reversing entries, never by editing history.' },
      { kind: 'concept', q: 'What does the outbox pattern solve?', choices: ['Updating the database and publishing an event as one atomic step, avoiding the dual-write problem', 'Making the queue deliver exactly once', 'Encrypting events', 'Avoiding the need for idempotent consumers'], answer: 0, explain: 'The event row commits with the state change, and a relay publishes it at least once. Consumers still need idempotency because duplicates can occur.' },
      { kind: 'concept', q: 'Pick every practice that makes a webhook endpoint safe.', choices: ['Verify an HMAC signature over the raw body', 'Deduplicate by the provider\'s event id', 'Store the event and return 200 before the slow processing', 'Assume events arrive in order, exactly once'], answer: [0, 1, 2], explain: 'Webhooks can be forged, repeated and reordered. Store-then-process keeps the provider from retrying because of your slow handler.' },
      { kind: 'concept', q: 'What does tokenization achieve for PCI scope?', choices: ['Card numbers never pass through or rest in your systems, so far less of your estate is in scope (reduced, not eliminated)', 'It removes all security obligations', 'It lets you store card numbers safely in your own database without controls', 'It makes payments faster'], answer: 0, explain: 'Hosted fields send card data straight to the PSP and return a token. You still have to secure the checkout page and follow your PSP\'s requirements.' },
      { kind: 'concept', q: 'What is the purpose of daily reconciliation?', choices: ['Independently compare our records with the PSP\'s to find missing, extra or mismatched charges', 'Speed up checkout', 'Replace the ledger', 'Retry failed payments automatically without review'], answer: 0, explain: 'It is a detective control against bugs, missed webhooks and outages that the real-time path cannot see.' }
    ],

    flashcards: [
      { id: 'pay-idem', front: 'How do idempotency keys prevent double charges?', back: 'The client sends a unique key per intent. The server inserts it under a unique constraint first; one request does the work and stores the response, retries get the stored response. Pass a derived key to the PSP too.' },
      { id: 'pay-unknown', front: 'PSP call timed out: what is the payment state?', back: 'Unknown, so keep it PROCESSING. Resolve by retrying with the same idempotency key, querying the PSP by our reference, or via webhook. Never send a fresh charge.' },
      { id: 'pay-ledger', front: 'Double-entry ledger rules?', back: 'Every transaction has debits equal to credits. Append-only: fix mistakes with reversing entries. Integers in minor units. Balances are derived. Postings commit with the state change.' },
      { id: 'pay-sm', front: 'Payment state machine, main path?', back: 'CREATED, PROCESSING, AUTHORIZED, CAPTURED; exits FAILED and CANCELLED; after capture PARTIALLY_REFUNDED, REFUNDED, DISPUTED. Transitions are conditional updates on the current status.' },
      { id: 'pay-outbox', front: 'What is the outbox pattern?', back: 'Write the event to an outbox table in the same transaction as the state change; a relay publishes it at least once. It avoids the dual-write problem; consumers must be idempotent.' },
      { id: 'pay-eo', front: 'How do you get exactly-once effects?', back: 'At-least-once delivery plus idempotent handling: dedupe by event id in the same transaction as the effect, or make the effect naturally repeatable. Exactly-once delivery is not assumed.' },
      { id: 'pay-webhook', front: 'Safe webhook handling?', back: 'Verify the HMAC signature, store the event (unique on event id), return 200 fast, process after, and expect duplicates and reordering.' },
      { id: 'pay-pci', front: 'How does tokenization reduce PCI scope?', back: 'PSP-hosted fields take the card number directly; we keep only a token and display data. Scope is reduced, not eliminated: checkout page security and PSP rules still apply.' },
      { id: 'pay-recon', front: 'What are the reconciliation buckets?', back: 'Matched; ours only; theirs only; amount differs. Auto-fix safe cases, queue the rest for a human. It catches what webhooks and code bugs miss.' }
    ]
  });
})();
