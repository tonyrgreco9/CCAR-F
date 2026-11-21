import type { Lesson } from '../types';

// Domain 5 — Context Management & Reliability.
// Original, app-authored lessons. Learning points were aligned on 2026-11-21 with the Knowledge/Skills
// bullets of task statements 5.1–5.6 in the CCAR-F Exam Guide v1.1 (see src/content/guide.ts and
// src/content/coverage/d5.ts). Wording is original; the guide wins on scope and named mechanisms.

const NOTE_DATE = '2026-11-21';

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------- 5.1
  {
    id: '5.1',
    title: 'Preserving critical facts across long conversations',
    outcome:
      'Given a long support or agent conversation, identify which facts must be pinned in a structured case-facts block, which tool output can be trimmed, and where to place key findings so they survive summarization.',
    minutes: 25,
    terms: [
      { term: 'Progressive summarization', definition: 'Repeatedly replacing older conversation turns with shorter summaries to save context. Each pass tends to round, merge, or drop exact values such as amounts, dates, and IDs.' },
      { term: 'Case facts block', definition: 'A structured, persistent record (often JSON or a fixed key/value list) of the exact facts a task depends on, kept outside the summarized history and re-injected verbatim on every turn.' },
      { term: 'Lost in the middle', definition: 'The tendency of models to use information near the start and end of a long context more reliably than information buried in the middle.' },
      { term: 'Tool-output trimming', definition: 'Reducing a verbose tool result to the fields relevant to the task before it enters context, for example with a post-processing hook or a wrapper.' },
      { term: 'Structured subagent return', definition: 'A subagent result that carries key facts, citations, relevance scores, and metadata (dates, source locations, methodology) in named fields rather than as free prose or reasoning chains, so the coordinator can preserve it exactly.' },
      { term: 'Complete conversation history', definition: 'Every prior user turn, assistant turn, tool call, and tool result, sent again with each Messages API request because the API keeps no conversation state between calls.' },
    ],
    learningPoints: [
      'Explain how progressive summarization turns exact amounts, percentages, dates, and customer-stated expectations into vague statements, and why the model handles the start and end of long inputs more reliably than the middle.',
      'Explain why each API request must carry the complete conversation history, and how tool results that stay in that history consume tokens far out of proportion to their relevance.',
      'Extract transactional facts (amounts, dates, order numbers, statuses) into a persistent case-facts block sent with every prompt, outside the summarized history, and keep a separate per-issue layer when one session covers several issues.',
      'Trim verbose tool outputs to the fields the task needs (for example, only the return-relevant fields of an order lookup) before they accumulate in context.',
      'Open aggregated inputs with a key-findings summary and organize the detailed results under explicit section headers to reduce position effects.',
      'Require subagents to return structured data (key facts, citations, relevance scores) with metadata such as dates, source locations, and methodological context, instead of verbose content and reasoning chains, when downstream agents have limited context.',
    ],
    concept: `A long conversation is like a long phone call where someone keeps taking notes and then throwing away the original recording. Each time the notes are rewritten to save space, small details blur: "$137.42 on invoice INV-88213, charged 3 March" becomes "a charge of around $140 last month." For chit-chat that does not matter. For a refund, a dispute, or a migration plan, the exact number, date, or ID *is* the task.

### Why details get lost

**Progressive summarization** compresses older turns into shorter summaries so the conversation fits the context window. Summaries are written for gist, so they round numbers and percentages ("a 12.5% fee" becomes "a fee"), blur dates, merge similar items, and drop identifiers that seemed incidental at the time. They also soften what the customer said they expect: "I need the credit before my 12 May bill" becomes "customer wants it soon". After two or three passes, the agent may confidently act on a value that was never in the source.

A second, independent problem is **lost in the middle**: in a long input, models reliably use material at the beginning and end but may skip findings buried in the middle. A crucial fact stated once, forty turns ago, inside a large tool result, is at risk even if it was never summarized.

### Every request carries the whole conversation

The Messages API is stateless: the model sees only what you send in that request. To keep a conversation coherent, each request must include the complete history so far: user turns, assistant turns, and every \`tool_use\` with its \`tool_result\`. Sending only the newest message to save tokens makes the agent re-ask for details, forget what it promised, and contradict itself. When history gets too long, compress it deliberately (summary plus a facts block); do not just drop it.

That is also why tool results are expensive. Each result stays in the history and is re-sent on every later request. An order lookup that returns 40+ fields when a return decision needs 5 keeps charging for the other 35 on every turn, and buries the 5 that matter.

### The core fixes

- **Keep a structured case-facts block.** Store the transactional facts the task depends on (customer ID, order numbers, amounts, dates, statuses, verification, what was promised or expected) in a fixed structure *outside* the summarized history. Include it verbatim near the top of every prompt, and update fields as facts change rather than appending prose.
- **Give each issue its own layer.** When one session covers several issues (a refund, a device return, a plan change), keep a separate structured record per issue (its order IDs, amounts, status) so values from one issue are never applied to another.
- **Trim tool outputs.** Reduce results to the relevant fields before they enter context, for example in a post-tool hook or a tool wrapper that keeps only the return-relevant fields of an order lookup.
- **Position and structure aggregated inputs.** When combining many results into one input, open with a short key-findings summary, then put the detailed results under explicit section headers (one per source or subagent) so nothing important sits unlabeled in the middle.
- **Structured, compact subagent returns.** Require named fields (key facts, citations, relevance scores) plus metadata: dates, source locations, and methodological context (survey, filing, model estimate). When the downstream agent has a limited context budget, change the upstream agent to return this structure *instead of* verbose content and reasoning chains ("first I searched for...").

### Terminology in one line each

A **case facts block** is the authoritative record; the **summarized history** is the lossy narrative. Summarize the narrative freely; never summarize the facts block.`,
    example: {
      intro: `A Lumen Mobile support agent has been chatting with a customer for 45 minutes about two disputed charges. The harness summarizes turns older than the last 20. Compare what survives in the summary with what the case-facts block preserves, and how a raw tool result is trimmed.`,
      artifacts: [
        {
          lang: 'text',
          caption: 'Summary produced after the second compression pass (lossy)',
          code: `Customer disputes a couple of charges from early this year, roughly $140 and
$60. Identity was checked. Agent said it would look into a refund for the larger one.
Customer is frustrated about repeated roaming fees.`,
        },
        {
          lang: 'json',
          caption: 'Case-facts block kept outside the summarized history and re-injected every turn',
          code: `{
  "case_facts": {
    "customer_id": "CUS-40917",
    "identity_verified": true,
    "verified_at": "2026-03-14T10:02:00Z",
    "refund_cap_remaining": 150.00,
    "customer_expectations": ["Credit visible before the 12 May bill"]
  },
  "issues": {
    "ISSUE-1 roaming charge": { "invoice_id": "INV-88213", "amount": 137.42, "currency": "USD", "charged_on": "2026-03-03", "status": "refund_offered",
      "commitment": "Refund if usage log shows no roaming sessions" },
    "ISSUE-2 data top-up": { "invoice_id": "INV-88213", "amount": 59.00, "currency": "USD", "charged_on": "2026-03-05", "status": "under_review",
      "open_question": "Auto-renewed or manually purchased?" }
  }
}`,
        },
        {
          lang: 'json',
          caption: 'lookup_transaction result after a post-tool trimming step (raw result had 58 fields)',
          code: `{
  "transaction_id": "TXN-5521907",
  "invoice_id": "INV-88213",
  "amount": 137.42,
  "posted_on": "2026-03-03",
  "product_code": "ROAM-DAY",
  "usage_sessions": 0,
  "refundable": true
}`,
        },
      ],
      walkthrough: `The summary is not wrong in spirit, but every value a refund depends on has blurred: $137.42 became "roughly $140", two dates became "early this year", and the invoice ID vanished. If the agent issued a refund from the summary it might refund the wrong amount, or exceed the $150 cap once both items are counted.

The case-facts block fixes this because it is **never summarized**. The harness keeps it as structured data, updates fields when a fact changes (for example, \`status\` moving from \`under_review\` to \`refund_offered\`), and places it at the top of each request so it is not lost in the middle. It also keeps the customer's stated expectation (credit before the 12 May bill), which the summary had dropped entirely. Note what is *not* in it: the customer's mood and the small talk. Those belong in the narrative summary.

The \`issues\` layer matters because this session has two disputes on the same invoice. Each issue keeps its own amount, date, status, and commitment, so the agent cannot apply the roaming refund promise to the data top-up or mix up the two amounts.

All of this sits on top of the full message history: every request still sends the (partly summarized) conversation, including tool calls and results. That is why the trimmed tool output is the second lever. The raw transaction record had 58 fields, including routing codes, tax jurisdiction blocks, and audit metadata, and it would have been re-sent on every later turn. Only seven fields matter for this decision, so only seven enter context. The \`usage_sessions: 0\` field is the evidence that supports the refund commitment, and it is now easy to find instead of buried in a large blob.`,
    },
    compare: {
      question: 'How should a long-running support agent keep exact transactional details available late in a conversation?',
      a: {
        title: 'Rely on a larger context window and summarization',
        body: `Keep the full transcript as long as it fits, then summarize older turns. Instruct the summarizer to "preserve important details."`,
        chooseWhen: 'Conversations are short, mostly informational, and no action depends on exact amounts, dates, or IDs.',
      },
      b: {
        title: 'Persistent structured case-facts block plus trimmed history',
        body: `Extract task-critical facts into a structured block maintained by the harness, re-inject it verbatim each turn, trim tool outputs, and summarize only the narrative.`,
        chooseWhen: 'The agent takes actions (refunds, changes, commitments) that depend on exact values, or conversations routinely run long enough to be compressed.',
      },
      decidingDetail: `The deciding detail is whether any **action depends on an exact value** that appeared early in the conversation. If yes, a summarizer instruction is only a probabilistic request and will eventually round or drop the value; a harness-maintained facts block keeps it exact. If no action depends on exact values, plain summarization is simpler and adequate.`,
    },
    mistake: {
      mistake: `Asking the summarizer to "keep all important numbers and IDs" and assuming that solves the problem, with no separate structured record of the facts.`,
      whyTempting: `It is a one-line prompt change, the first few summaries look fine, and it seems wasteful to maintain a second data structure for information that is already "in the conversation".`,
      howToRecognize: `Late in long sessions the agent quotes approximate amounts ("about $140"), confuses two similar order IDs, re-asks for information the customer already gave, or acts on a date that does not match any tool result. Errors grow with conversation length and number of compression passes.`,
      fix: `Have the harness maintain a structured case-facts block (order numbers, amounts, dates, statuses, verification, commitments, stated expectations), with one record per issue in multi-issue sessions, that is never summarized and is placed at the top of each request alongside the full message history. Trim tool outputs to the relevant fields, and require subagents to return structured fields rather than prose.`,
    },
    exercise: {
      prompt: `A support conversation is about to be compressed. For each piece of information, decide how the harness should handle it.`,
      inputs: `Conversation so far (excerpt of what is in context):

\`\`\`text
- Customer greeted the agent and mentioned they were on a train.
- get_customer returned 41 fields; the agent used customer_id, plan, verified.
- Customer says the charge was on 3 March for $137.42, invoice INV-88213.
- Agent promised to waive the late fee if the refund is approved.
- lookup_invoice returned 3 pages of line items; only two lines are disputed.
- Customer described in detail how annoyed they were about previous support calls.
\`\`\``,
      labels: ['Pin in case facts', 'Trim to relevant fields', 'Safe to summarize'],
      items: [
        { id: 'i1', text: 'Invoice INV-88213, amount $137.42, charged 3 March', answer: 'Pin in case facts', why: 'A refund action depends on these exact values; summarization would round or drop them.' },
        { id: 'i2', text: 'The 41-field get_customer result', answer: 'Trim to relevant fields', why: 'Only customer_id, plan, and verification status are used; the rest is noise that consumes context and buries what matters.' },
        { id: 'i3', text: 'Agent promise to waive the late fee if the refund is approved', answer: 'Pin in case facts', why: 'A commitment is a fact the agent must honor later; losing it causes broken promises or inconsistent answers.' },
        { id: 'i4', text: 'Customer was on a train when they started chatting', answer: 'Safe to summarize', why: 'Incidental context with no bearing on any action; losing it costs nothing.' },
        { id: 'i7', text: 'Customer said they need the refund to land before their 12 May bill', answer: 'Pin in case facts', why: 'A customer-stated expectation with a date is exactly what summaries soften into "soon"; the agent needs it to set a realistic promise.' },
        { id: 'i5', text: 'Three pages of invoice line items where two lines are disputed', answer: 'Trim to relevant fields', why: 'Keep the two disputed lines (and totals if needed) and drop the rest before it enters context.' },
        { id: 'i6', text: 'Customer\'s detailed account of frustration with earlier calls', answer: 'Safe to summarize', why: 'Tone and history matter for how the agent responds, and a one-line summary ("frustrated by repeated contacts") preserves that.' },
      ],
      solution: `Pin anything an action or a promise depends on: identifiers, amounts, dates, verification status, commitments, and what the customer said they expect. Trim large tool results at the boundary so only task-relevant fields enter context. Summarize narrative and tone freely. The test for each item is: *if this were rounded or dropped, could the agent take a wrong action?* If yes, it goes in the structured block.`,
    },
    check: [
      {
        id: '5.1-c1',
        stem: 'After several summarization passes, a support agent refunds $140 instead of $137.42. What is the most reliable fix?',
        options: [
          { id: 'a', text: 'Add "preserve all amounts exactly" to the summarizer prompt' },
          { id: 'b', text: 'Maintain a structured case-facts block outside the summarized history and re-inject it every turn' },
          { id: 'c', text: 'Summarize more often so each summary covers fewer turns' },
          { id: 'd', text: 'Lower the temperature of the agent' },
        ],
        correct: 'b',
        why: 'A harness-maintained facts block is never compressed, so exact values survive. Prompt instructions and summary frequency still leave values exposed to lossy rewriting, and temperature does not affect what was lost.',
      },
      {
        id: '5.1-c2',
        stem: 'A key constraint appears once in the middle of a 90k-token context and the model keeps ignoring it. Which change most directly addresses this?',
        options: [
          { id: 'a', text: 'Repeat the request to "read everything carefully"' },
          { id: 'b', text: 'Increase max_tokens for the response' },
          { id: 'c', text: 'Move the constraint and key findings to the start under a clear header, and trim irrelevant material' },
          { id: 'd', text: 'Split the response into two calls with the same context' },
        ],
        correct: 'c',
        why: 'Information in the middle of long contexts is used less reliably. Placing key material at the start, using headers, and removing noise addresses the cause; max_tokens only limits output length.',
      },
      {
        id: '5.1-c3',
        stem: 'A research subagent returns a well-written paragraph summarizing six sources. The coordinator later cannot cite page numbers or dates. What should change?',
        options: [
          { id: 'a', text: 'Ask the subagent for a longer paragraph' },
          { id: 'b', text: 'Have the coordinator re-run all searches itself' },
          { id: 'c', text: 'Give the subagent the coordinator\'s full conversation history' },
          { id: 'd', text: 'Require the subagent to return structured fields per finding: claim, source ID, page, date, quote' },
        ],
        correct: 'd',
        why: 'Prose returns are another lossy compression step. Structured fields preserve the metadata the coordinator needs; re-running searches wastes work and more history does not change the return format.',
      },
    ],
    review: [
      { front: 'Why does progressive summarization hurt transactional tasks?', back: 'Each pass rounds, merges, or drops exact amounts, dates, and IDs, and actions depend on exactly those values.' },
      { front: 'What goes in a case-facts block?', back: 'Order numbers, amounts, dates, statuses, verification, commitments, and customer-stated expectations, kept structured, never summarized, and included in every prompt; with several issues, one record per issue.' },
      { front: 'Two placement tactics against lost-in-the-middle?', back: 'Put key findings at the start (critical constraints can be restated at the end) and organize long inputs under clear section headers.' },
    ],
    sources: ['guide-d5', 'eng-context', 'api-context-windows', 'sdk-hooks', 'app-authored'],
    notes: [
      { date: NOTE_DATE, text: 'The exam guide confirms the mechanisms taught here (case-facts block, per-issue layer, trimming tool output, key findings first, complete history in each request). Context window sizes and any built-in automatic compaction or context-editing features differ by model and product version; verify specific limits and features against current docs.' },
    ],
  },

  // ---------------------------------------------------------------- 5.2
  {
    id: '5.2',
    title: 'Resolving ambiguity and deciding when to escalate',
    outcome:
      'Given a customer conversation, decide whether the agent should escalate immediately, attempt resolution first, ask for an identifier, or ask a clarifying question, using reliable triggers rather than sentiment or self-reported confidence.',
    minutes: 25,
    terms: [
      { term: 'Escalation trigger', definition: 'An observable condition that should hand a case to a human, such as an explicit request for a person, a policy gap or exception, or no meaningful progress.' },
      { term: 'Policy gap', definition: 'A situation the agent\'s policy does not cover or explicitly reserves for humans (exceptions, amounts above a cap, legal threats).' },
      { term: 'Self-reported confidence', definition: 'A confidence number or statement produced by the model about its own answer. It is not calibrated by default and is a poor routing signal on its own.' },
      { term: 'Disambiguation', definition: 'Asking the user for a distinguishing identifier or detail when a request matches multiple records or has multiple reasonable readings.' },
    ],
    learningPoints: [
      'List the appropriate escalation triggers: an explicit request for a human, a policy exception or gap (not merely a complex case), and inability to make meaningful progress.',
      'Explain why sentiment-based escalation and self-reported confidence scores are unreliable proxies for actual case complexity.',
      'Write explicit escalation criteria into the system prompt, with few-shot examples showing when to escalate and when to resolve autonomously.',
      'Honor an explicit request for a human immediately, without first investigating; for a frustrated customer with a straightforward in-scope issue, acknowledge the frustration and offer the resolution, escalating if they reiterate that they want a person.',
      'Escalate when policy is ambiguous or silent on the specific request (for example, competitor price matching when policy only covers own-site price adjustments).',
      'When a lookup returns multiple matches, ask for additional identifiers instead of choosing with a heuristic, and ask a targeted clarifying question when a request has two costly readings.',
    ],
    concept: `Think of a good front-desk employee. They hand you to a manager the moment you ask for one. They also get the manager when something is outside the rules they are allowed to apply, or when they have tried and are going nowhere. They do *not* call the manager just because you sound annoyed, and they do not guess which of three "John Smith" accounts is yours.

### Reliable escalation triggers

- **Explicit request for a human.** Honor it immediately. Do not attempt one more fix first; that overrides the customer's stated choice and usually makes things worse.
- **Policy gap or exception.** The request falls outside what policy lets the agent decide: an amount over the cap, an exception to a rule, a legal threat, suspected fraud, or a situation the policy is ambiguous or silent about. Note that "complex" is not the trigger; a complex case that policy fully covers is still the agent's to resolve.
- **No meaningful progress.** The agent has tried the reasonable steps and the case is not moving (the same tool error repeats, required data is unavailable, the customer and agent are going in circles).

An example of policy silence: policy lets the agent adjust a price when *the company's own site* drops the price within 14 days, and a customer asks the agent to match *a competitor's* price. Policy neither allows nor forbids it. The agent should not stretch the own-site rule to cover it, and should not invent a refusal either: it escalates.

### Unreliable triggers

- **Sentiment.** Frustration is not a reason to escalate on its own. Many frustrated customers have simple problems the agent can fix right now. Escalating on tone sends easy cases to an expensive queue and delays the customer.
- **Self-reported confidence.** A model saying "I am 60% sure" is not a calibrated measurement. Agents are often confidently wrong on exactly the hard cases (an exception they should not grant), so a confidence threshold does not track case complexity.

### Write the criteria down, with examples

A system prompt that says "escalate complex or unusual cases" leaves the boundary to the model, and the result is inconsistent: easy cases go to humans while exception cases are handled autonomously. The proportionate fix is to state **explicit escalation criteria** in the system prompt (the triggers above, plus your specific policy limits) and add a few **few-shot examples** of borderline cases that show the decision and the reason: one that looks alarming but should be resolved, one that looks routine but needs an exception. Examples teach the boundary better than a longer list of adjectives.

### Frustrated customer, simple issue

Acknowledge the frustration and **offer the resolution** when the issue is within the agent's capability. If the customer then reiterates that they want a person, that is now an explicit request: escalate. Contrast this with a customer who asks for a person up front: escalate right away, without first investigating the account to see whether the agent could have fixed it.

### Ambiguity is not escalation

When a lookup returns **multiple matching records**, ask for a distinguishing identifier (order number, last four digits, email on file). Choosing "the most recent" or "the closest name" is a heuristic that will sometimes act on the wrong account. Similarly, when a request has two reasonable readings ("cancel my plan" could mean the add-on or the whole account) and acting on the wrong one is costly, ask one targeted clarifying question before acting.

Prompt instructions describe these rules; when a rule must hold every time (such as the refund cap), enforce it in code, for example with a hook that blocks the tool call and routes to escalation.`,
    example: {
      intro: `An excerpt of Lumen Mobile's system prompt, then three short conversations with the agent's decision at each point. The policy caps agent-issued refunds at $150 and requires identity verification before account changes.`,
      artifacts: [
        {
          lang: 'text',
          caption: 'System prompt excerpt: explicit escalation criteria with few-shot examples',
          code: `## When to escalate (call escalate_to_human)
Escalate when ANY of these is true:
1. The customer asks for a human. Do it at once; do not investigate first.
2. The request needs an exception to policy, exceeds the $150 cap, or is something
   policy does not address (it is silent or ambiguous about this exact request).
3. You have tried the reasonable steps and cannot make progress.
Do NOT escalate only because the customer is upset or the case has many steps.

## Examples
Customer (angry): "Charged twice for March AGAIN, fix it now!"  Duplicate confirmed, $18.
-> Resolve. Upset tone, but a duplicate refund under the cap is within policy.

Customer (calm): "Can you match the price Skyline offers for this phone?"
-> Escalate. Policy covers our own price drops only; competitor matching is not
   addressed, so it needs a human decision.

Customer: "My late fee should be waived, my dad passed away last month."
-> Escalate. Bereavement waivers are an exception policy does not let you grant.`,
        },
        {
          lang: 'text',
          caption: 'Conversation 1: frustrated customer, simple issue',
          code: `Customer: This is the THIRD time I've been charged for the international add-on I
          cancelled. Ridiculous.
[get_customer -> verified: true; add-on cancelled 2026-02-01; charged 2026-03-01: $15.00]
Agent:    I'm sorry this keeps happening. I can see the add-on was cancelled on 1 Feb and
          you were still charged $15.00 on 1 Mar. I can refund that now and confirm the
          add-on is removed. Shall I go ahead?
Customer: Fine, do it.
[issue_refund amount=15.00 -> ok]`,
        },
        {
          lang: 'text',
          caption: 'Conversation 2: explicit request for a human',
          code: `Customer: I don't want to talk to a bot. Get me a person.
Agent:    Of course. I'm transferring you to a member of our support team now and passing
          along what we've discussed so you won't need to repeat it.
[escalate_to_human summary="Customer requested human at first message. No account
 actions taken. Customer not yet verified."]`,
        },
        {
          lang: 'json',
          caption: 'Conversation 3: get_customer returns multiple matches',
          code: `{
  "query": { "name": "Dana Whitfield" },
  "matches": [
    { "customer_id": "CUS-11802", "city": "Leeds", "plan": "Unlimited 5G" },
    { "customer_id": "CUS-30577", "city": "Leeds", "plan": "Fibre 500" }
  ]
}`,
        },
      ],
      walkthrough: `**System prompt.** Instead of "escalate complex cases", the prompt states the triggers and a negative rule (tone alone is not a trigger), then shows borderline examples with the reason for each decision. The competitor-match example teaches policy silence; the angry duplicate charge teaches that sentiment is not complexity.

**Conversation 1.** The customer is angry, but the issue is simple, verified, and well under the $150 cap. Escalating on tone would make them wait in a queue for a $15 fix. The agent acknowledges the frustration, states the exact facts, and offers the resolution. Had the customer replied "No, I want a person", that reiterated request would trigger immediate escalation.

**Conversation 2.** An explicit request for a human is honored immediately. The agent does not attempt "one quick fix first". It writes a useful handoff summary, including the fact that the customer is not yet verified, so the human does not repeat work.

**Conversation 3.** Two customers with the same name in the same city. Picking the one whose plan "sounds more likely" is a heuristic that will sometimes refund or change the wrong account. The right move is to ask for a distinguishing identifier: "I found more than one account under that name. Could you confirm the email address or the last four digits of the phone number on the account?" This is disambiguation, not escalation: the agent can still resolve the case once it knows which record is right.`,
    },
    compare: {
      question: 'A customer writes in an angry tone about a late fee. How should the agent decide whether to escalate?',
      a: {
        title: 'Escalate on negative sentiment or low self-reported confidence',
        body: `Score each message for sentiment and ask the model to rate its confidence; escalate when sentiment is very negative or confidence is below a threshold.`,
        chooseWhen: 'Rarely appropriate as the primary rule. Sentiment can be a secondary signal for prioritizing a queue, and confidence can be used only after it has been calibrated against labeled outcomes.',
      },
      b: {
        title: 'Escalate on explicit request, policy gap, or no progress',
        body: `Attempt resolution when the issue is within policy. Escalate immediately when the customer asks for a human, when the request needs an exception or exceeds a cap, or when attempts are not making progress.`,
        chooseWhen: 'The default for a support agent: triggers are observable, map to real limits on what the agent may do, and do not penalize customers for tone.',
      },
      decidingDetail: `The deciding detail is whether the trigger reflects **something the agent cannot or must not do**. A late-fee waiver within policy is something the agent can do, so tone alone does not justify escalation; a waiver above the cap, a requested exception, or a request for a person does. Uncalibrated self-reported confidence does not reliably predict errors, so it should not gate escalation by itself.`,
    },
    mistake: {
      mistake: `Routing every conversation with strongly negative sentiment to a human, and letting the model escalate whenever it says it is "not confident".`,
      whyTempting: `Angry customers feel high-risk, and "escalate when unsure" sounds safe. Both signals are easy to compute and appear to err on the side of caution.`,
      howToRecognize: `The human queue fills with simple cases the agent could have fixed (refund a duplicate charge, resend a bill), first-contact resolution drops, while genuinely out-of-policy cases from calm customers are still handled by the agent. Escalation rates swing with wording rather than case difficulty.`,
      fix: `Write explicit escalation criteria into the system prompt with a few borderline examples. Escalate on explicit human requests (immediately), policy gaps, exceptions, or silence, and lack of progress. For frustrated customers with simple issues, acknowledge and offer the fix; escalate if they reiterate. Ask for identifiers when records are ambiguous. Enforce hard limits like the refund cap in code rather than relying on the model's judgment.`,
    },
    exercise: {
      prompt: `For each situation, choose the agent's next step.`,
      inputs: `Lumen Mobile policy: verify identity before account changes; agent may issue refunds or credits up to $150 per case; amounts above that, legal threats, and suspected fraud go to humans.`,
      labels: ['Escalate now', 'Offer resolution first', 'Ask for an identifier', 'Ask a clarifying question'],
      items: [
        { id: 'i1', text: 'Verified customer, clearly furious, wants a duplicate $22 charge reversed. Has not asked for a person.', answer: 'Offer resolution first', why: 'Simple, in-policy fix. Frustration alone is not a trigger; acknowledge it and offer the refund.' },
        { id: 'i2', text: 'Customer, calmly: "Can I speak to a human please?" before describing any problem.', answer: 'Escalate now', why: 'An explicit request for a human is honored immediately, regardless of how simple the issue might be.' },
        { id: 'i3', text: 'Customer asks for a $310 goodwill credit after a week-long outage.', answer: 'Escalate now', why: 'The amount exceeds the $150 cap, so it is outside what the agent may decide (policy limit).' },
        { id: 'i4', text: 'lookup_invoice by customer name returns two open invoices for different accounts.', answer: 'Ask for an identifier', why: 'Multiple matching records: ask for the account number or invoice ID rather than guess which one is meant.' },
        { id: 'i5', text: 'Verified customer says "cancel my plan"; they have a base plan and a separate streaming add-on.', answer: 'Ask a clarifying question', why: 'Two reasonable readings with costly consequences if wrong; ask which they mean before acting.' },
        { id: 'i6', text: 'Agent offered the $22 refund; customer replies "I don\'t want your refund, I want a real person."', answer: 'Escalate now', why: 'The customer has reiterated a request for a human after the offer; that is an explicit request.' },
        { id: 'i7', text: 'Verified customer asks the agent to match a rival carrier\'s lower price. Policy covers refunds when Lumen\'s own price drops, and says nothing about competitors.', answer: 'Escalate now', why: 'Policy is silent on this exact request. Stretching the own-price rule or refusing on the agent\'s own judgment both invent policy; a human decides.' },
      ],
      solution: `Escalation follows observable triggers: a request for a person (i2, i6), something outside policy (i3), or a request policy does not address (i7). Frustration with a simple issue (i1) gets an offered fix first. Ambiguity is resolved by asking: an identifier when records collide (i4), a clarifying question when the request itself has two readings (i5). None of these decisions uses sentiment scores or the model's self-rated confidence.`,
    },
    check: [
      {
        id: '5.2-c1',
        stem: 'A customer opens with "I want to talk to a person" about a password reset the agent could complete in one step. What should the agent do?',
        options: [
          { id: 'a', text: 'Complete the reset first, then offer a human if still needed' },
          { id: 'b', text: 'Ask why they prefer a human' },
          { id: 'c', text: 'Escalate immediately with a handoff summary' },
          { id: 'd', text: 'Check its confidence; escalate only if it is low' },
        ],
        correct: 'c',
        why: 'An explicit request for a human is honored immediately. Trying to resolve first overrides the customer\'s stated choice, and self-reported confidence is irrelevant here.',
      },
      {
        id: '5.2-c2',
        stem: 'A name search returns three customer records. What should the agent do?',
        options: [
          { id: 'a', text: 'Ask the customer for a distinguishing identifier such as account email or phone digits' },
          { id: 'b', text: 'Use the most recently active record' },
          { id: 'c', text: 'Escalate to a human because the case is ambiguous' },
          { id: 'd', text: 'Act on all three records to be safe' },
        ],
        correct: 'a',
        why: 'Multiple matches call for disambiguation from the customer. Heuristics like "most recent" will sometimes pick the wrong account, and ambiguity the customer can resolve is not a reason to escalate.',
      },
      {
        id: '5.2-c3',
        stem: 'Which signal is the most reliable escalation trigger for a support agent?',
        options: [
          { id: 'a', text: 'Message sentiment below a threshold' },
          { id: 'b', text: 'The request requires an exception that policy does not let the agent grant' },
          { id: 'c', text: 'The model reports confidence below 70%' },
          { id: 'd', text: 'The conversation exceeds ten turns' },
        ],
        correct: 'b',
        why: 'A policy gap or exception is an observable limit on what the agent may do. Sentiment and uncalibrated confidence do not track case difficulty, and turn count alone does not show lack of progress.',
      },
    ],
    review: [
      { front: 'Three reliable escalation triggers?', back: 'Explicit request for a human (honor immediately), policy gap or exception, and no meaningful progress.' },
      { front: 'Frustrated customer, simple in-policy issue?', back: 'Acknowledge, offer the fix. If they reiterate that they want a person, escalate.' },
      { front: 'Multiple records match the customer\'s description?', back: 'Ask for a distinguishing identifier. Do not choose with a heuristic, and do not escalate just because of the ambiguity.' },
    ],
    sources: ['guide-d5', 'eng-building-agents', 'sdk-hooks', 'app-authored'],
  },

  // ---------------------------------------------------------------- 5.3
  {
    id: '5.3',
    title: 'Propagating errors while preserving partial results',
    outcome:
      'Given a multi-agent workflow where some subtasks fail, decide which failures to recover locally, how a subagent should report the rest in structured form, and how the final output should annotate coverage gaps.',
    minutes: 25,
    terms: [
      { term: 'Structured error context', definition: 'A failure report with named fields: failure type, what was attempted (query, parameters), partial results obtained, whether a retry may help, and suggested alternatives.' },
      { term: 'Access failure vs. valid empty result', definition: 'An access failure means the source could not be queried (timeout, permission, outage). A valid empty result means the query ran successfully and found nothing. They must be reported differently.' },
      { term: 'Local recovery', definition: 'Handling a transient failure (timeout, rate limit) inside the subagent or tool, for example with bounded retries and backoff, before reporting upward.' },
      { term: 'Coverage annotation', definition: 'A note in the final output stating which sources, segments, or subtasks were not covered or only partially covered, and why.' },
    ],
    learningPoints: [
      'Return structured error context from subagents (failure type, what was attempted, partial results, potential alternatives) so the coordinator can make an informed recovery decision.',
      'Distinguish access failures (timeouts that need a retry decision) from valid empty results (successful queries with no matches), in both tool design and reporting.',
      'Explain why generic statuses such as "search unavailable" hide the context the coordinator needs.',
      'Recover locally from transient failures with bounded retries, and propagate only the errors a subagent cannot resolve, together with what was attempted and any partial results.',
      'Avoid both anti-patterns: silently suppressing errors (returning empty results as success) and terminating the entire workflow on a single failure.',
      'Structure synthesis output with coverage annotations that separate well-supported findings from topic areas with gaps due to unavailable sources.',
    ],
    concept: `Imagine sending four researchers to four libraries. One library is closed. A bad researcher either says nothing (so you assume that library had no relevant books) or phones you in a panic and tells everyone to stop. A good researcher says: "The east library was closed for a fire drill. I tried twice. I got two items from the reading room before it shut. The county archive has the same collection." Now you can decide.

### Two failure modes to avoid

- **Silent suppression.** A subagent catches an error and returns an empty list or a generic "no relevant information found". The coordinator cannot tell that from a genuine absence, so the final report confidently omits a whole source.
- **Whole-workflow abort.** One subagent error raises an exception that kills the run, discarding the successful work of every other subagent.

A third, subtler failure is the **generic status**. Reporting "search unavailable" after exhausting retries is honest, but it throws away everything the coordinator needs to recover: what kind of failure it was, which query failed, what was already retrieved, and what else could be tried. The coordinator can only retry blindly or give up.

### What to return instead

A failing subagent returns **structured error context**:
- **failure type** (transient timeout, rate limit, permission denied, invalid input, source unavailable)
- **what was attempted** (the query, parameters, source)
- **partial results** it did obtain
- **retryability** (would retrying help?)
- **alternatives** (another source, a narrower query)

### Access failure is not "no results"

"Search failed" and "search ran and found nothing" are different facts. A valid empty result is evidence ("no filings mention this supplier"). An access failure is the absence of evidence. Tools should signal them differently (for example, an MCP tool result with \`isError: true\` and a description for failures, versus a successful result with an empty list), and subagents should preserve that distinction when reporting.

### Recover locally first, then propagate

Transient failures (a timeout, a 429) are best handled close to where they happen, with a small number of retries and backoff. Only when local recovery fails, or the error is not retryable (permission denied, invalid query), does the subagent report upward, and then it includes what it attempted and any partial results. Propagating every transient blip floods the coordinator with decisions it should not need to make. The coordinator, which sees the whole plan, chooses: re-route to an alternative, retry with changed input, or proceed and record the gap.

### Coverage annotations

The synthesis output says which findings are well supported and which topic areas have gaps because a source was unavailable: "Q1 and Q2 delivery performance: well supported (warehouse data plus filings). Q3: gap, warehouse metrics unavailable (access error); conclusions rely on public filings only." Readers can then weigh the conclusions correctly.`,
    example: {
      intro: `A Northwind research coordinator asked three subagents to gather evidence on a supplier's delivery performance. The data agent hit a problem. Compare a suppressing return with a structured one, and see how the coordinator uses it.`,
      artifacts: [
        {
          lang: 'json',
          caption: 'Bad: data agent suppresses the error',
          code: `{ "findings": [], "summary": "No relevant metrics found." }`,
        },
        {
          lang: 'json',
          caption: 'Good: data agent returns structured error context with partial results',
          code: `{
  "status": "partial",
  "findings": [
    { "metric": "on_time_delivery_rate", "period": "2026-Q1", "value": 0.912, "source": "warehouse.deliveries" },
    { "metric": "on_time_delivery_rate", "period": "2026-Q2", "value": 0.884, "source": "warehouse.deliveries" }
  ],
  "errors": [
    {
      "failure_type": "transient_timeout",
      "attempted": "SELECT ... FROM deliveries WHERE supplier_id='SUP-2291' AND quarter='2026-Q3'",
      "retries": 2,
      "retryable": true,
      "alternatives": ["retry after 15 min", "use quarterly_summary view (lower granularity)"]
    }
  ],
  "coverage": { "requested": ["2026-Q1", "2026-Q2", "2026-Q3"], "covered": ["2026-Q1", "2026-Q2"] }
}`,
        },
        {
          lang: 'markdown',
          caption: 'Coverage note in the final report',
          code: `### Coverage
- Well supported: on-time delivery for 2026-Q1 and 2026-Q2 (warehouse data, consistent
  with the supplier's published scorecard).
- Internal delivery metrics cover 2026-Q1 and 2026-Q2. Q3 warehouse data could not be
  retrieved (query timeout after 2 retries); the Q3 figure below comes from the
  quarterly_summary view and is less granular.
- Web search found no public reports of delivery disputes for this supplier
  (search completed successfully; empty result).`,
        },
      ],
      walkthrough: `The first return looks clean, and that is the problem: the coordinator would report "no metrics available", or worse, conclude the supplier has no delivery data at all. Two quarters of real data are thrown away.

The structured return separates what worked from what failed. The data agent already retried the timeout twice (local recovery), so it does not hide the failure, and it does not crash the workflow either. It names the failure type, the exact query, whether retrying might help, and two alternatives. Its \`coverage\` field makes the gap explicit.

The coordinator now has choices it did not have before: it re-routes Q3 to the \`quarterly_summary\` view, keeps Q1 and Q2 at full granularity, and the report writer adds a coverage section. Notice the second bullet of that section: the web search found nothing, but the search *succeeded*. That is a valid empty result and is stated as a finding, distinct from the Q3 access failure.`,
    },
    compare: {
      question: 'A subagent in a multi-step workflow fails partway through. How should the failure be handled?',
      a: {
        title: 'Fail fast: raise and stop the workflow',
        body: `Any subagent exception propagates to the top and terminates the run, so no output is produced from incomplete data.`,
        chooseWhen: 'The failed step is a hard prerequisite for everything else (for example, identity verification before an account change), or partial output would be unsafe or misleading even with annotations.',
      },
      b: {
        title: 'Structured partial results with coordinator-driven recovery',
        body: `The subagent retries transient errors locally, then returns partial results plus structured error context. The coordinator re-routes, retries, or proceeds, and the final output annotates coverage gaps.`,
        chooseWhen: 'Subtasks are largely independent (parallel research, multi-source extraction), and a partial result with clearly stated gaps is more useful than nothing.',
      },
      decidingDetail: `The deciding detail is whether **later steps can still produce correct, useful output without the failed piece**. If the failed step is a prerequisite (or partial output would cause harm), stop and report. If subtasks are independent, keep the successful work, give the coordinator structured context to recover, and annotate what is missing.`,
    },
    mistake: {
      mistake: `Wrapping each subagent call in a try/except that returns an empty result on any error, so "the workflow never crashes".`,
      whyTempting: `It makes the pipeline robust in the narrow sense: no crashes, no paging, reports always ship. Empty results look like a natural "nothing found" answer.`,
      howToRecognize: `Reports occasionally have conspicuously missing sections or sources with no explanation; "no results" rates spike during outages; logs show exceptions that never appear in the output. Analysts cannot tell whether a source had nothing or was never queried.`,
      fix: `Retry transient errors locally with a bound. Then return structured error context (failure type, attempted query, partial results, retryability, alternatives) and keep it distinct from a valid empty result. Let the coordinator decide recovery, and annotate coverage gaps in the final output.`,
    },
    exercise: {
      prompt: `Each line is something a subagent observed. Choose how it should be handled.`,
      inputs: `\`\`\`text
1. Filing search returns HTTP 429 (rate limited) on first attempt.
2. Filing search completes; zero filings mention the acquisition.
3. Metrics MCP tool returns isError: true, "permission denied for schema finance".
4. Web search timed out 3 times; 4 of 10 planned queries completed with results.
5. Document agent cannot open one of eight supplied PDFs (corrupt file); others parsed.
6. News search still times out after 2 backoff retries; 3 articles were already retrieved.
   The draft return is { "status": "search unavailable" }.
\`\`\``,
      labels: ['Retry locally', 'Report as valid empty result', 'Return structured error with partial results', 'Return structured error (not retryable)'],
      items: [
        { id: 'i1', text: 'Line 1: HTTP 429 on first attempt', answer: 'Retry locally', why: 'Rate limits are transient; a bounded retry with backoff often succeeds without involving the coordinator.' },
        { id: 'i2', text: 'Line 2: search completes, zero matching filings', answer: 'Report as valid empty result', why: 'The query ran successfully. "No filings mention it" is a finding, not a failure.' },
        { id: 'i3', text: 'Line 3: permission denied for schema finance', answer: 'Return structured error (not retryable)', why: 'Retrying will not fix a permission error. Report the failure type, attempted query, and alternatives so the coordinator can re-route.' },
        { id: 'i4', text: 'Line 4: repeated timeouts, 4 of 10 queries succeeded', answer: 'Return structured error with partial results', why: 'Local retries are exhausted. Keep the 4 successful results and report which queries failed so coverage can be annotated.' },
        { id: 'i5', text: 'Line 5: one corrupt PDF of eight', answer: 'Return structured error with partial results', why: 'Seven documents were processed; return them and name the unreadable file so the analyst can supply a new copy.' },
        { id: 'i6', text: 'Line 6: "search unavailable" draft after retries, with 3 articles in hand', answer: 'Return structured error with partial results', why: 'The generic status hides the failure type, the failed query, and the 3 articles. Replace it with structured context so the coordinator can retry later, re-scope, or proceed with a labeled gap.' },
      ],
      solution: `Transient errors are retried close to the source (i1). A successful query with no hits is evidence and is reported as such (i2). Non-retryable errors are reported with enough context for the coordinator to choose an alternative (i3). When work partly succeeded, the successful part is kept and the gap is described precisely (i4, i5). None of these cases justifies silently returning nothing or aborting the whole research run.`,
    },
    check: [
      {
        id: '5.3-c1',
        stem: 'A subagent\'s database query times out after its retries. What should it return to the coordinator?',
        options: [
          { id: 'a', text: 'An empty findings list so the workflow can continue' },
          { id: 'b', text: 'Failure type, the attempted query, any partial results, retryability, and alternatives' },
          { id: 'c', text: 'An exception that terminates the workflow' },
          { id: 'd', text: 'A prose apology with no details' },
        ],
        correct: 'b',
        why: 'Structured error context lets the coordinator choose a recovery path and keeps partial work. An empty list hides the failure, and aborting discards the other subagents\' results.',
      },
      {
        id: '5.3-c2',
        stem: 'Why should a tool distinguish "search failed" from "search returned no matches"?',
        options: [
          { id: 'a', text: 'Only the failure should be logged' },
          { id: 'b', text: 'Empty results always mean the query was wrong' },
          { id: 'c', text: 'A valid empty result is evidence of absence, while an access failure means the source was not checked' },
          { id: 'd', text: 'It reduces token usage' },
        ],
        correct: 'c',
        why: 'Conflating them lets a report claim "no evidence" for a source that was never actually queried, which is a misleading conclusion.',
      },
      {
        id: '5.3-c3',
        stem: 'One of five independent research subagents fails with a non-retryable permission error. What should the final report do?',
        options: [
          { id: 'a', text: 'Omit any mention of that source' },
          { id: 'b', text: 'Refuse to produce a report' },
          { id: 'c', text: 'Fill in that source\'s section from general knowledge' },
          { id: 'd', text: 'Include the four successful results and annotate the coverage gap and its cause' },
        ],
        correct: 'd',
        why: 'Independent subtasks still yield useful output. Annotating the gap tells readers what is missing; omitting it or inventing content misleads them.',
      },
    ],
    review: [
      { front: 'Five fields of structured error context?', back: 'Failure type, what was attempted, partial results, whether retry can help, and alternatives.' },
      { front: 'Access failure vs. valid empty result?', back: 'Failure: the source was not checked (absence of evidence). Empty: the check ran and found nothing (evidence of absence).' },
      { front: 'Two anti-patterns in error propagation?', back: 'Silently returning empty results as if successful, and aborting the entire workflow because one subtask failed.' },
    ],
    sources: ['guide-d5', 'mcp-spec-tools', 'eng-multi-agent', 'sdk-subagents', 'app-authored'],
    notes: [
      { date: NOTE_DATE, text: 'The exam guide names the MCP `isError` flag for tool-level failures (protocol-level errors are separate). Exact result field names and error conventions can change between MCP specification revisions; verify against the current specification.' },
    ],
  },

  // ---------------------------------------------------------------- 5.4
  {
    id: '5.4',
    title: 'Managing context during large-codebase exploration',
    outcome:
      'Given a long exploration task in a large codebase, choose when to isolate discovery in a subagent, persist findings in a notes file, compact the session, and write a recovery manifest so work survives context limits and crashes.',
    minutes: 25,
    terms: [
      { term: 'Context degradation', definition: 'The decline in answer quality as a long session fills with stale or verbose material: earlier findings get contradicted, forgotten, or confused.' },
      { term: 'Scratchpad / notes file', definition: 'A file the agent writes findings to (e.g. NOTES.md) so they persist outside the conversation, survive compaction, and can be re-read later.' },
      { term: 'Explore subagent', definition: 'In Claude Code, a subagent used for read-only codebase discovery in its own context window; only its summary returns to the main session.' },
      { term: '/compact', definition: 'A Claude Code command that replaces the conversation history with a summary to free context, optionally guided by instructions about what to keep.' },
      { term: 'Recovery manifest', definition: 'A file recording the plan, completed steps, and where outputs live, so a crashed or restarted run can resume without redoing work.' },
    ],
    learningPoints: [
      'Recognize context degradation in extended sessions: inconsistent answers and references to "typical patterns" instead of the specific classes found earlier.',
      'Spawn subagents for specific questions (for example "find all test files" or "trace refund flow dependencies") so verbose exploration stays isolated while the main agent keeps the high-level picture.',
      'Maintain scratchpad files of key findings and refer back to them for later questions, so findings persist across context boundaries.',
      'Summarize the key findings of one exploration phase and inject that summary into the initial context of the subagents spawned for the next phase.',
      'Design crash recovery with structured state exports: each agent writes its state to a known location, and the coordinator loads a manifest on resume and injects it into agent prompts.',
      'Use /compact to reduce context usage when an extended exploration session fills with verbose discovery output.',
    ],
    concept: `Exploring a two-million-line codebase is like searching an archive with a small desk. Every file you open covers more of the desk. After an hour, the note you wrote at the start is buried under printouts, and you start contradicting yourself. The fix is not a bigger desk; it is sending assistants to the stacks, keeping a notebook, and clearing the desk at sensible points.

### Context degradation

In long sessions the window fills with grep output, full file reads, and dead ends. Symptoms: the agent re-reads files it already read, forgets a constraint found earlier, gives answers that contradict its own earlier findings, or starts referring to "typical" patterns rather than the specific classes it found.

### Tools for keeping context useful

- **Isolate verbose discovery in subagents.** Give each subagent one specific question, such as "find all test files for the billing module" or "trace the dependencies of the refund flow". In Claude Code, the Explore subagent can run dozens of searches and reads in its *own* context and return a short summary. The main agent keeps the high-level picture and receives the answer ("payment retries are in \`billing/retry/RetryPolicy.java\`, configured by \`retry.yaml\`"), not 40 KB of grep hits.
- **Keep a scratchpad or notes file.** Write findings (file paths, call chains, decisions, open questions) to a file such as \`NOTES.md\`, and have the agent consult it when answering later questions instead of relying on its memory of the session. Files survive \`/compact\`, \`/clear\`, and new sessions; the conversation does not.
- **Compact deliberately.** When context fills with verbose discovery output, \`/compact\` summarizes the conversation to free space. Run it at a phase boundary (after mapping, before implementing) and say what to keep, rather than waiting until the window is nearly full.
- **Summarize between phases.** Subagents do not inherit the parent's conversation. When one exploration phase ends, summarize its key findings (file paths, constraints, dead ends) and put that summary into the initial prompt of each subagent spawned for the next phase.
- **Recovery manifests.** For long multi-agent work, each agent exports its state (completed items, findings, next item) to a known location, such as \`state/<agent>.json\`, and the coordinator keeps a manifest pointing to those files. After a crash, the coordinator loads the manifest on resume and injects each agent's saved state into that agent's prompt, so work continues from the first incomplete item instead of starting over or repeating side effects.

### Terminology recap

**Context degradation** is the problem. **Subagent isolation** limits what enters the main context; **notes files** and **manifests** move state out of the context; **/compact** shrinks what remains.`,
    example: {
      intro: `A Harbor Freight engineer asks Claude Code to find why some shipment status webhooks are sent twice, then fix it. The session is organized into phases with state kept in files.`,
      artifacts: [
        {
          lang: 'text',
          caption: 'Phase 1: delegate discovery to an Explore subagent (prompt from the main session)',
          code: `Use an Explore subagent to find every code path that sends shipment status webhooks.
Return only: entry points, the class/method that performs the HTTP send, any retry or
dedup logic, and file paths with line numbers. Do not return file contents.`,
        },
        {
          lang: 'markdown',
          caption: 'NOTES.md written after phase 1 (survives /compact and new sessions)',
          code: `# Webhook duplicate investigation

## Findings (phase 1)
- Send path: ShipmentEventListener.onStatusChange -> WebhookDispatcher.dispatch
  (services/notify/src/main/java/.../WebhookDispatcher.java:88)
- Retry: RetryingHttpClient retries on timeout (3x), no idempotency key sent
- Second producer: legacy cron job jobs/status_sync/main.go:142 also calls dispatch
- Dedup: none found

## Open questions
- Does the receiving side honor an Idempotency-Key header? (ask integrations team)

## Next phase
- Add idempotency key in WebhookDispatcher; decide whether to remove cron path`,
        },
        {
          lang: 'json',
          caption: 'Phase 3: coordinator manifest; three subagents each update 12-13 of 37 call sites and export state to state/<agent>.json',
          code: `// state/manifest.json (owned by the coordinator)
{
  "task": "Pass idempotency key at every WebhookDispatcher.dispatch call site",
  "phase_summary": "NOTES.md#findings-phase-1",
  "agents": {
    "java-notify":  { "state": "state/java-notify.json",  "status": "done" },
    "java-billing": { "state": "state/java-billing.json", "status": "in_progress" },
    "go-jobs":      { "state": "state/go-jobs.json",      "status": "blocked" }
  },
  "updated_at": "2026-11-20T14:12:00Z"
}

// state/java-billing.json (written by that subagent after every call site)
{
  "done": ["billing/InvoiceEvents.java:88", "billing/CreditEvents.java:40"],
  "failed": [],
  "next": "billing/InvoiceEvents.java:203"
}`,
        },
      ],
      walkthrough: `**Phase 1** sends the noisy work (searching for every webhook path across two languages) to a subagent. The main session receives a few lines of distilled findings instead of hundreds of search hits, so its context stays focused.

The engineer then has Claude write **NOTES.md**. This is the durable record: it holds exact paths and line numbers, the key finding (two producers, no idempotency key), and open questions. Now running \`/compact\` with an instruction like "keep the findings in NOTES.md and the plan for phase 2" is low-risk, because the important facts are in a file, not only in the conversation.

When implementation is handed to other agents, the coordinator puts the phase 1 summary from NOTES.md into each subagent's initial prompt, because a subagent does not see the parent conversation. Without it, each would repeat the discovery or miss the second producer.

**Phase 3** splits 37 call sites across three subagents, which is long enough for a crash to interrupt. Each subagent exports its own state to a known file after every call site, and the coordinator's **manifest** points to those files. If the process dies, the coordinator loads the manifest on resume, skips \`java-notify\` (done), and starts the billing subagent with its saved state injected into the prompt: "Already done: InvoiceEvents.java:88, CreditEvents.java:40. Continue from InvoiceEvents.java:203." No discovery is repeated and no file is edited twice.`,
    },
    compare: {
      question: 'An engineer needs to understand how an unfamiliar subsystem works before changing it. How should discovery be run?',
      a: {
        title: 'Explore directly in the main session',
        body: `Run Grep/Glob/Read in the main conversation so every file and search result is visible to the session that will make the change.`,
        chooseWhen: 'The area is small (a handful of files), the engineer wants to see the raw code inline, and the session will stay short.',
      },
      b: {
        title: 'Delegate discovery to an Explore subagent and record findings in a notes file',
        body: `A subagent does the broad searching in its own context and returns a concise map; the main session writes it to NOTES.md and proceeds.`,
        chooseWhen: 'Discovery is broad (many directories, languages, or dead ends), the session will be long, or later phases need a clean context for implementation.',
      },
      decidingDetail: `The deciding detail is **how much raw output discovery will produce relative to what the next phase needs**. If a few file reads answer the question, doing it inline is simpler. If discovery will generate large volumes of search results and file contents that the implementation phase does not need verbatim, isolate it in a subagent so only the distilled findings consume main-session context.`,
    },
    mistake: {
      mistake: `Running a multi-hour exploration in one session, reading whole files and pasting large search results, then relying on automatic summarization to keep it going, with no notes file.`,
      whyTempting: `It feels efficient to keep everything in one place, and the agent seems to remember things well for the first half hour. Writing notes looks like overhead.`,
      howToRecognize: `The agent re-opens files it already read, contradicts earlier findings, loses exact paths or line numbers after compaction, and a crash or \`/clear\` means rediscovering everything.`,
      fix: `Delegate broad searches to subagents, write findings to a notes file as you go, compact at phase boundaries with explicit instructions about what to keep, brief next-phase agents explicitly, and keep a manifest for long multi-step changes.`,
    },
    exercise: {
      prompt: `For each situation in a long codebase investigation, choose the most appropriate action.`,
      inputs: `Context: Claude Code session in a 2M-line Java/Go monorepo. The task has three phases: map the subsystem, design a fix, apply it across many files.`,
      labels: ['Delegate to an Explore subagent', 'Write to the notes file', 'Run /compact with guidance', 'Update the recovery manifest'],
      items: [
        { id: 'i1', text: 'You need to find every caller of a deprecated API across 14 services.', answer: 'Delegate to an Explore subagent', why: 'Broad, verbose search whose raw output the main session does not need; return only the list of call sites.' },
        { id: 'i2', text: 'You just confirmed the root cause and the exact file and line where it lives.', answer: 'Write to the notes file', why: 'A key finding with exact values should be persisted outside the conversation so it survives compaction and new sessions.' },
        { id: 'i3', text: 'Mapping is finished and recorded; the window is full of old search output before design starts.', answer: 'Run /compact with guidance', why: 'A phase boundary with findings already saved is the right moment to compact, telling it what to keep.' },
        { id: 'i4', text: 'You have edited 18 of 52 call sites and the session may be interrupted.', answer: 'Update the recovery manifest', why: 'Recording done, failed, and next items lets a restarted run resume without redoing or double-applying edits.' },
        { id: 'i5', text: 'A Go call site could not be changed the same way as the Java ones.', answer: 'Update the recovery manifest', why: 'Record it as failed with the reason so it is not silently skipped or retried blindly on resume.' },
      ],
      solution: `Keep verbose discovery out of the main context (i1). Move facts that matter into files as soon as they are confirmed (i2), which makes compaction at phase boundaries safe (i3). For long, multi-item changes, keep a manifest of progress and failures so work survives crashes and restarts (i4, i5).`,
    },
    check: [
      {
        id: '5.4-c1',
        stem: 'Why should key findings be written to a notes file before running /compact?',
        options: [
          { id: 'a', text: '/compact deletes all files in the project' },
          { id: 'b', text: 'Files persist outside the conversation, while compaction replaces history with a summary that may lose exact details' },
          { id: 'c', text: '/compact only works if a notes file exists' },
          { id: 'd', text: 'Notes files are automatically loaded into every subagent' },
        ],
        correct: 'b',
        why: 'Compaction is a summary and can drop paths, line numbers, and decisions. A file is unaffected and can be re-read after compaction or in a new session.',
      },
      {
        id: '5.4-c2',
        stem: 'A next-phase implementation subagent repeats discovery the main session already did. What is the most likely cause?',
        options: [
          { id: 'a', text: 'The subagent did not receive an explicit brief of prior findings; subagents do not inherit the parent conversation' },
          { id: 'b', text: 'The subagent has a smaller context window' },
          { id: 'c', text: 'The main session ran /compact' },
          { id: 'd', text: 'The subagent lacks the Edit tool' },
        ],
        correct: 'a',
        why: 'Subagents start with only what they are given. Summarize findings (or pass the notes file path) in the subagent prompt.',
      },
      {
        id: '5.4-c3',
        stem: 'A 300-file migration crashed at file 140. What would have let it resume cleanly?',
        options: [
          { id: 'a', text: 'A larger context window' },
          { id: 'b', text: 'Running /compact every 20 files' },
          { id: 'c', text: 'Reading all 300 files at the start' },
          { id: 'd', text: 'A manifest recording completed items, failures, and the next item' },
        ],
        correct: 'd',
        why: 'A manifest persists progress outside the session, so a restart can skip completed work and avoid applying edits twice.',
      },
    ],
    review: [
      { front: 'Why use an Explore subagent for broad discovery?', back: 'Its searches and file reads stay in its own context; only a concise summary returns to the main session.' },
      { front: 'What survives /compact reliably?', back: 'Files: notes, scratchpads, manifests. The conversation itself is replaced by a summary.' },
      { front: 'How does crash recovery work for a multi-agent exploration?', back: 'Each agent exports its state (done, failed, next) to a known location; the coordinator keeps a manifest of those files, loads it on resume, and injects each agent\'s state into its prompt.' },
    ],
    sources: ['guide-d5', 'cc-subagents', 'cc-workflows', 'cc-best-practices', 'eng-context'],
    notes: [
      { date: NOTE_DATE, text: 'The exam guide names the Explore subagent, the Task tool for spawning subagents, and `/compact`. Current Claude Code releases may name the subagent tool differently (for example Agent) and change `/compact` options or automatic compaction behavior; verify against current docs.' },
    ],
  },

  // ---------------------------------------------------------------- 5.5
  {
    id: '5.5',
    title: 'Human review workflows and calibrated confidence',
    outcome:
      'Given extraction accuracy data broken down by segment, decide which documents or fields can be auto-accepted, which must go to human review, and what validation is needed before reducing review.',
    minutes: 25,
    terms: [
      { term: 'Aggregate accuracy', definition: 'A single accuracy number across all documents and fields. It can look high while specific document types or fields perform poorly.' },
      { term: 'Stratified random sampling', definition: 'Sampling randomly within each segment (document type, layout, language, field) so every segment has enough examples to measure its own accuracy.' },
      { term: 'Field-level confidence', definition: 'A confidence score for each extracted field rather than for the whole document, used to route individual fields to review.' },
      { term: 'Calibration', definition: 'Checking and adjusting confidence scores against a labeled validation set so that, for example, fields scored 0.9 are correct about 90% of the time.' },
      { term: 'Review routing', definition: 'Rules that send low-confidence, ambiguous, or high-risk items to humans and let the rest proceed automatically.' },
    ],
    learningPoints: [
      'Explain how an aggregate accuracy figure (for example 97% overall) can hide poor performance on specific document types or fields.',
      'Analyze accuracy by document type and field, and confirm consistent performance across every segment before automating high-confidence extractions or reducing human review.',
      'Have the model output field-level confidence scores, then calibrate review thresholds against a labeled validation set.',
      'Use stratified random sampling of high-confidence extractions to keep measuring error rates and to detect novel error patterns after review is reduced.',
      'Route extractions with low confidence, or with ambiguous or contradictory source documents, to human review, prioritizing limited reviewer capacity where errors are most likely and most costly.',
    ],
    concept: `Suppose a school reports a 95% pass rate. That sounds great until you learn one class of 20 students had a 40% pass rate, hidden by hundreds of students in easy classes. Extraction pipelines have the same problem.

### Aggregate accuracy hides weak segments

An invoice extraction pipeline may be 97% accurate overall because most volume is clean, typed invoices from large suppliers. Handwritten remittance advices, multi-currency invoices, or a specific field (like \`tax_amount\` on scanned documents) might be far worse. If you reduce human review based on the aggregate, you remove the safety net exactly where it is needed most.

### Measure per segment with stratified samples

**Stratified random sampling** draws random samples within each segment: document type, layout family, language, source, and key field. Rare segments are sampled enough to measure them, rather than being drowned out by common ones. You then look at accuracy *per segment and per field*.

### Confidence is useful only once calibrated

Routing by **field-level confidence** lets reviewers look at the few fields that are uncertain instead of whole documents. But a raw confidence score, including a model's self-reported confidence, is not automatically meaningful. **Calibrate** it: run the pipeline on a labeled validation set, bucket fields by confidence, and compare predicted confidence to observed accuracy. Choose thresholds from that data, ideally per field or per document type, because the same score can mean different things in different segments.

### Routing rules

- Low-confidence fields go to a human.
- **Ambiguous** items (the source itself is unclear, contradictory, or missing a value) go to a human even if a score looks high.
- High-cost fields (amounts, bank details) can use stricter thresholds than low-cost ones.
- When wrong values that look valid are costlier than blanks, prefer routing or leaving a field empty over a confident guess.

Reviewer time is the scarce resource. Spend it where the calibrated data says errors are likely (low confidence), where the source itself is unclear or contradicts itself, and where an error is costly, rather than spreading it evenly or filling the queue in arrival order.

### Reduce review only with evidence

Before lowering review for a document type, validate that type and its key fields separately on a stratified sample. Reduce review segment by segment, not globally.

### Keep measuring what you no longer review

Once high-confidence extractions are auto-accepted, nobody looks at them, so errors there are invisible. Keep a **stratified random sample of high-confidence extractions** going to reviewers every week, drawn per document type, supplier template, and field. It gives an ongoing error rate for the automated output and surfaces **novel error patterns** (a new layout, a supplier that changed its template) that a confidence score alone will not reveal, because the model is often confidently wrong on unfamiliar inputs.`,
    example: {
      intro: `Ledgerline wants to cut human review costs. The operations lead proposes auto-accepting all documents because overall field accuracy is 96.8%. Here is the stratified validation data.`,
      artifacts: [
        {
          lang: 'text',
          caption: 'Stratified validation results (labeled sample, 2,400 documents)',
          code: `segment                         docs   share_of_volume   field_accuracy
typed invoice, EN                1000        78%              98.9%
typed invoice, DE/FR              400        12%              96.1%
scanned remittance advice         400         6%              88.4%
handwritten delivery note         300         2%              71.0%
contract (payment terms only)     300         2%              93.5%

overall (volume-weighted)                                     ~97%`,
        },
        {
          lang: 'text',
          caption: 'Calibration check for field confidence on typed EN invoices',
          code: `confidence bucket   fields   observed_accuracy
0.95 - 1.00          8120        99.4%
0.85 - 0.95          1310        95.2%
0.70 - 0.85           402        83.1%
< 0.70                168        58.9%`,
        },
        {
          lang: 'yaml',
          caption: 'Resulting routing policy',
          code: `typed_invoice_en:
  auto_accept_if_field_confidence_gte: 0.95
  always_review_fields: [bank_account, iban]
typed_invoice_de_fr:
  auto_accept_if_field_confidence_gte: 0.97   # recalibrate on a larger DE/FR sample
scanned_remittance: { mode: full_review }
handwritten_delivery_note: { mode: full_review }
contract_payment_terms: { mode: full_review, revisit_after: 500 more labeled docs }
ambiguous_or_missing_source_value: route_to_human
audit:   # ongoing check of high-confidence, auto-accepted output
  stratified_random_sample: { rate: 2%, strata: [doc_type, supplier_template, field], always_include_new_templates: true }`,
        },
      ],
      walkthrough: `The roughly 97% overall figure is dominated by typed English invoices, which are 78% of volume. Handwritten delivery notes are at 71%: almost one field in three is wrong. Auto-accepting everything would send those errors straight into client ERP systems, where wrong values that look valid are expensive.

The calibration table shows that for typed English invoices, confidence scores are informative: fields at 0.95 and above are 99.4% correct in the labeled set. That justifies a threshold for *that segment*. The same score has not been validated for other segments, so it is not reused blindly; the DE/FR segment gets a stricter, provisional threshold until it is recalibrated.

The policy reduces review only where evidence supports it, keeps full review for weak segments, always reviews high-risk fields like bank details, and routes ambiguous source values to humans. The audit samples 2% of auto-accepted, high-confidence output *per stratum*, so a single supplier's new template cannot hide inside the typed-invoice average; that is how novel error patterns get noticed.`,
    },
    compare: {
      question: 'How should a team decide where to reduce human review of extracted data?',
      a: {
        title: 'Global threshold from aggregate accuracy',
        body: `Measure overall accuracy on a random sample; if it exceeds the target, auto-accept everything above one confidence threshold.`,
        chooseWhen: 'Documents are genuinely homogeneous (one type, one layout family) and per-segment results have already been shown to be uniform.',
      },
      b: {
        title: 'Per-segment validation with calibrated field-level thresholds',
        body: `Measure accuracy per document type and field with stratified samples, calibrate confidence per segment, and reduce review only for segments that meet the bar.`,
        chooseWhen: 'Inputs vary by type, layout, language, or quality, and some fields carry high error costs.',
      },
      decidingDetail: `The deciding detail is **whether the document population is heterogeneous**. If segments differ in type, layout, or quality, aggregate accuracy is dominated by high-volume easy segments and hides weak ones, so validation and thresholds must be per segment. Only a population proven to be uniform can safely use a single global rule.`,
    },
    mistake: {
      mistake: `Reducing human review across the board because overall accuracy on a simple random sample met the target, and routing by the model's raw self-reported confidence.`,
      whyTempting: `A single high number is easy to communicate, a simple random sample feels statistically fair, and confidence scores look like exactly the routing signal you need.`,
      howToRecognize: `Downstream complaints cluster in a particular document type or field; a simple random sample contains very few rare-segment documents; nobody can say what accuracy corresponds to a confidence of 0.9 in a given segment.`,
      fix: `Use stratified random sampling, report accuracy per segment and field, calibrate field-level confidence on labeled data per segment, route low-confidence and ambiguous items to humans, reduce review one validated segment at a time, and keep auditing auto-accepted output.`,
    },
    exercise: {
      prompt: `Using calibrated thresholds where they exist, decide what to do with each item or proposal.`,
      inputs: `Calibrated policy: typed EN invoices, auto-accept fields with confidence >= 0.95 (validated). Scanned remittances and handwritten notes: full review (not yet validated). Bank details: always review. Ambiguous or missing source values: human.`,
      labels: ['Auto-accept', 'Route to human review', 'Validate before reducing review'],
      items: [
        { id: 'i1', text: 'Typed EN invoice, field invoice_total, confidence 0.98, source value clear.', answer: 'Auto-accept', why: 'Segment and threshold are validated, and the source is unambiguous.' },
        { id: 'i2', text: 'Typed EN invoice, field due_date, confidence 0.81.', answer: 'Route to human review', why: 'Below the calibrated 0.95 threshold for this segment; the 0.70 to 0.85 bucket was about 83% accurate.' },
        { id: 'i3', text: 'Typed EN invoice, field iban, confidence 0.99.', answer: 'Route to human review', why: 'Bank details are always reviewed regardless of confidence because errors are costly.' },
        { id: 'i4', text: 'Proposal: stop reviewing scanned remittances because overall accuracy is 97%.', answer: 'Validate before reducing review', why: 'The aggregate is dominated by typed invoices; scanned remittances must be validated on their own stratified sample.' },
        { id: 'i5', text: 'Typed EN invoice where two different totals appear on the page; total field confidence 0.96.', answer: 'Route to human review', why: 'The source is ambiguous; a high score does not resolve contradictory source values.' },
      ],
      solution: `Auto-accept only where a segment has been validated and the field clears a calibrated threshold with a clear source (i1). Route low-confidence (i2), high-risk (i3), and ambiguous (i5) items to people. Proposals to reduce review must be backed by per-segment evidence, not the aggregate (i4).`,
    },
    check: [
      {
        id: '5.5-c1',
        stem: 'Overall extraction accuracy is 97%, but handwritten notes are 2% of volume. What should happen before reducing review for them?',
        options: [
          { id: 'a', text: 'Nothing; 97% exceeds the target' },
          { id: 'b', text: 'Raise the global confidence threshold slightly' },
          { id: 'c', text: 'Measure accuracy for handwritten notes on a stratified sample and validate that segment separately' },
          { id: 'd', text: 'Ask the model to report confidence for handwritten notes' },
        ],
        correct: 'c',
        why: 'A small segment barely affects the aggregate. Only a per-segment measurement shows whether it is safe to reduce review there.',
      },
      {
        id: '5.5-c2',
        stem: 'What does it mean for field-level confidence to be calibrated?',
        options: [
          { id: 'a', text: 'Scores have been compared with observed accuracy on a labeled validation set so a score corresponds to a known accuracy' },
          { id: 'b', text: 'The model was instructed to be honest about its confidence' },
          { id: 'c', text: 'Scores are normalized to the 0 to 1 range' },
          { id: 'd', text: 'All fields use the same threshold' },
        ],
        correct: 'a',
        why: 'Calibration is an empirical mapping from score to observed accuracy. Prompting for honesty or normalizing ranges does not establish that mapping.',
      },
      {
        id: '5.5-c3',
        stem: 'Why use stratified rather than simple random sampling to validate an extraction pipeline?',
        options: [
          { id: 'a', text: 'It needs fewer labeled documents in total in every case' },
          { id: 'b', text: 'It guarantees higher accuracy' },
          { id: 'c', text: 'It removes the need for human review' },
          { id: 'd', text: 'It ensures each segment, including rare ones, has enough samples to measure its own accuracy' },
        ],
        correct: 'd',
        why: 'Simple random samples mirror volume, so rare segments may have too few examples to evaluate. Stratification measures each segment directly.',
      },
    ],
    review: [
      { front: 'Why can aggregate accuracy be misleading?', back: 'High-volume easy segments dominate it and hide poor accuracy on specific document types or fields.' },
      { front: 'What makes confidence usable for routing?', back: 'Calibration against a labeled validation set, ideally per segment and field, so thresholds map to observed accuracy.' },
      { front: 'Safe way to reduce human review?', back: 'Validate each document type on a stratified sample, reduce review segment by segment, keep reviewing ambiguous and high-risk fields, and keep a stratified random sample of high-confidence, auto-accepted output under review.' },
    ],
    sources: ['guide-d5', 'eval-tests', 'guard-hallucinations', 'app-authored'],
  },

  // ---------------------------------------------------------------- 5.6
  {
    id: '5.6',
    title: 'Provenance, conflicting evidence, and uncertainty in synthesis',
    outcome:
      'Given findings from several sources, produce a synthesis that keeps each claim mapped to its source, annotates conflicting figures with attribution and dates, separates established from contested findings, and renders each content type in a suitable format.',
    minutes: 25,
    terms: [
      { term: 'Claim–source mapping', definition: 'A record linking each material claim to its source: document or URL, location (page, section), publication or collection date, and ideally a supporting quote.' },
      { term: 'Attribution', definition: 'Stating which source reports which value ("Source A reports X; Source B reports Y") rather than presenting one value as fact.' },
      { term: 'Temporal change vs. contradiction', definition: 'Two different values may reflect different dates (the figure changed) rather than a genuine disagreement about the same moment. Dates distinguish the two.' },
      { term: 'Established vs. contested finding', definition: 'An established finding is supported by multiple independent, consistent sources; a contested one has credible sources that disagree or thin evidence.' },
    ],
    learningPoints: [
      'Explain how source attribution is lost when summarization compresses findings without their claim–source mappings, and require subagents to output structured mappings (source URL or document name, location, relevant excerpt) that the synthesis agent preserves and merges.',
      'Annotate conflicting statistics from credible sources with attribution instead of arbitrarily selecting one value; let document analysis finish with conflicts included and annotated so the coordinator decides how to reconcile them before synthesis.',
      'Require publication or data collection dates in structured outputs so temporal differences are not misread as contradictions.',
      'Structure reports with explicit sections for well-established and contested findings, preserving each source\'s own characterization and methodological context.',
      'Render content types appropriately in synthesis: financial data as tables, news as prose, technical findings as structured lists, rather than one uniform format.',
    ],
    concept: `A good research report is like a court brief: every claim points to an exhibit, disagreements between witnesses are laid out rather than hidden, and the reader can tell what is settled from what is still argued.

### Keep claim-to-source links through every step

Multi-agent research compresses information several times: a search agent summarizes pages, an analysis agent summarizes those summaries, a writer drafts the report. At each step, citations can detach from claims. The fix is structural: subagents output every finding as a **claim–source mapping** with the claim, source (URL or document name), location (page or section), date, and the relevant excerpt. The synthesis agent must preserve these mappings and **merge** them when it combines findings: when two subagents report the same claim, the merged claim keeps both sources. The writer cites from the records, not from memory.

### Don't resolve conflicts arbitrarily

When two credible sources disagree ("market grew 12%" vs. "market grew 8%"), arbitrarily picking one, or averaging them, invents certainty. Instead, **annotate the conflict with attribution**: who said what, when, and on what basis (survey vs. filings, region, definition). If there is a principled reason to prefer one (a primary filing over a press summary, a newer revision of the same dataset), say so explicitly.

Where the conflict is resolved matters too. A document analysis subagent that meets two values should **finish its analysis with both values included and annotated**, not quietly choose one or stop. The coordinator, which sees all the subagents' results and the research question, decides how to reconcile (ask for another source, prefer a primary filing, or mark it contested) *before* passing material to synthesis.

### Dates separate change from contradiction

Many apparent conflicts are just **temporal change**. A 2024 report and a 2026 report giving different headcounts are not contradicting each other; the number moved. Record both the **publication date** and, where available, the **collection or reference period**. Two sources about the *same period* that disagree are a real contradiction; two sources about different periods describe a trend.

### Separate established from contested

Give the report explicit sections by strength: well-established findings (several independent, consistent sources), contested findings, and findings resting on a single or weak source. Keep each source's own characterization ("preliminary estimate", "modeled", "self-reported survey") and its methodological context instead of upgrading it to "data shows". This is how a report states uncertainty honestly instead of in vague hedges sprinkled everywhere.

### Render content appropriately

Match format to content instead of forcing everything into one format. Financial data and comparisons across sources or periods are easiest to check in a **table** (with source and date columns). News developments and context read best as **prose** with inline citations. Technical findings (configurations, failure modes, test results) work best as **structured lists**. The format should make provenance easy to verify, not hide it.`,
    example: {
      intro: `A Northwind analyst asks: "How large is the European cold-chain logistics market, and is it growing?" Subagents return findings as structured records. The report writer must synthesize them.`,
      artifacts: [
        {
          lang: 'json',
          caption: 'Findings as returned by subagents (claim-source records)',
          code: `[
  { "id": "F1", "claim": "EU cold-chain market size EUR 61.2bn", "source": "Industry association annual report",
    "location": "p. 14, Table 3", "published": "2026-05-10", "reference_period": "2025", "quote": "...market reached EUR 61.2bn in 2025..." },
  { "id": "F2", "claim": "EU cold-chain market size EUR 54.0bn", "source": "Consultancy market brief",
    "location": "Executive summary", "published": "2026-06-02", "reference_period": "2025", "quote": "...valued at EUR 54bn (2025)..." },
  { "id": "F3", "claim": "EU cold-chain market size EUR 48.7bn", "source": "Industry association annual report",
    "location": "p. 11", "published": "2024-05-08", "reference_period": "2023", "quote": "...EUR 48.7bn for 2023..." },
  { "id": "F4", "claim": "Pharma cold-chain demand rising due to biologics", "source": "Three independent trade publications",
    "location": "various", "published": "2025-11 to 2026-08", "reference_period": "2025-2026", "quote": "..." },
  { "id": "F5", "claim": "Large carrier announced exit from refrigerated trucking", "source": "News article",
    "location": "para 1-3", "published": "2026-09-15", "reference_period": "2026-09", "quote": "..." },
  { "id": "F6", "claim": "71% of operators log temperatures continuously; 29% still log manually", "source": "Trade body technical survey",
    "location": "p. 6", "published": "2026-04-01", "reference_period": "2025-Q4", "method": "self-reported survey, n=310", "quote": "..." }
]`,
        },
        {
          lang: 'markdown',
          caption: 'Excerpt of the synthesized report',
          code: `### Market size (figures)
| Reference year | Value      | Source               | Published  | Ref  |
|----------------|------------|----------------------|------------|------|
| 2023           | EUR 48.7bn | Industry association | 2024-05-08 | F3   |
| 2025           | EUR 61.2bn | Industry association | 2026-05-10 | F1   |
| 2025           | EUR 54.0bn | Consultancy brief    | 2026-06-02 | F2   |

### Conflicting evidence
The two 2025 estimates differ by about EUR 7bn. The association figure [F1] includes
warehousing; the consultancy brief [F2] states it covers transport only. Neither is
treated as definitive.

### Established vs. contested
- Established: demand from pharmaceutical biologics is rising (three independent
  sources, 2025-2026) [F4].
- Contested: the 2025 market size (two sources, different scope) [F1, F2].

### Recent developments
In September 2026 a large carrier announced it would exit refrigerated trucking [F5],
which may tighten capacity; the report found no data yet on the effect on prices.

### Technical findings
- Temperature logging: continuous for 71% of operators, manual for 29%
  (self-reported survey, n=310, 2025-Q4) [F6]`,
        },
      ],
      walkthrough: `**Provenance.** Every number in the report carries its finding ID, which maps back to a source, page, publication date, and reference period. Nothing was cited from memory.

**Change vs. contradiction.** F3 (2023) and F1 (2025) come from the same publisher for different reference periods: that is growth over time, not a conflict. F1 and F2 cover the *same period* and disagree: that is a genuine conflict. Without the reference_period field, a writer might have called F3 vs. F1 a contradiction, or picked the most recent number and dropped the rest.

**Attribution instead of resolution.** The document analysis subagent returned both F1 and F2 with a conflict annotation rather than choosing one; the coordinator checked the scope notes and decided, before synthesis, to present both as contested. The report does not average EUR 61.2bn and EUR 54.0bn or quietly pick one. It attributes each figure, explains the likely cause (scope difference), and labels the 2025 size as contested.

**Strength of evidence.** Pharma demand growth is established (multiple independent, consistent sources). Market size is contested. The carrier exit rests on one news report and is presented as a recent development, not a trend.

**Rendering.** Figures by source and year belong in a table with source and date columns so readers can compare them; the news development is told as prose with an inline citation; the technical finding is a structured list item that keeps the source's own characterization (self-reported survey) and sample size.`,
    },
    compare: {
      question: 'Two credible sources give different values for the same statistic. What should the synthesis do?',
      a: {
        title: 'Resolve to one value with a stated reason',
        body: `Choose one figure and explain why (for example, it comes from a primary filing while the other is a secondary summary of it, or it is a later revision of the same dataset), noting the other value.`,
        chooseWhen: 'There is a principled, checkable reason to prefer one source for the same measure and period, and the reasoning is shown to the reader.',
      },
      b: {
        title: 'Present both with attribution and mark the finding as contested',
        body: `Report each value with its source, date, and scope, explain the possible causes of disagreement, and classify the finding as contested.`,
        chooseWhen: 'Sources are comparably credible, or differ in definition or method, and there is no sound basis for preferring one.',
      },
      decidingDetail: `The deciding detail is **whether there is a principled, verifiable basis for preferring one source** for the same measure and period (primary vs. derivative, revised vs. superseded). If there is, resolve and show the reasoning, keeping the other value visible. If not, keep both with attribution. First check dates: if the values refer to different periods, it is temporal change, not a conflict.`,
    },
    mistake: {
      mistake: `Letting the report writer produce a clean narrative that states one figure per question, with citations added at the end from a general bibliography rather than from claim-level mappings.`,
      whyTempting: `It reads well, looks decisive, and clients often ask for "the number". Carrying source records through every agent feels like overhead, and a bibliography looks like it satisfies the citation requirement.`,
      howToRecognize: `Analysts cannot trace a specific number to a page; figures in the report do not appear in any cited source; conflicting values have vanished; newer and older figures are mixed as if they described the same moment.`,
      fix: `Pass findings between agents as structured claim-source records (source, location, publication and reference dates, quote). Cite claims from those records, annotate conflicts with attribution, use dates to separate change from contradiction, label established vs. contested findings, and render figures in tables and narrative in prose.`,
    },
    exercise: {
      prompt: `Classify each pair of findings or single finding as it should appear in the synthesis.`,
      inputs: `\`\`\`text
P1: Source A (pub. 2024-03, data for 2023): 1,200 employees.
    Source A (pub. 2026-03, data for 2025): 1,850 employees.
P2: Regulator filing (data for 2025): revenue USD 410m.
    Analyst blog (data for 2025): revenue USD 450m, no source given.
P3: Survey X (2025, n=2,000): 34% of firms adopted tool.
    Survey Y (2025, n=1,800): 52% of firms adopted tool. Different definitions of "adopted".
P4: Four independent studies (2023-2026) find the same direction of effect.
P5: One preprint (2026) claims a large effect; not replicated.
\`\`\``,
      labels: ['Temporal change', 'Resolve with stated reason', 'Contested: attribute both', 'Well-established', 'Weakly supported'],
      items: [
        { id: 'i1', text: 'P1: 1,200 vs. 1,850 employees', answer: 'Temporal change', why: 'Same publisher, different reference years: the figure changed over time; report both with dates as a trend.' },
        { id: 'i2', text: 'P2: USD 410m (regulator filing) vs. USD 450m (unsourced blog)', answer: 'Resolve with stated reason', why: 'The primary regulatory filing is a principled basis to prefer one value; state the reason and note the other.' },
        { id: 'i3', text: 'P3: 34% vs. 52% adoption with different definitions', answer: 'Contested: attribute both', why: 'Comparably credible surveys for the same period that measure differently; attribute each and explain the definitional difference.' },
        { id: 'i4', text: 'P4: four independent studies agree', answer: 'Well-established', why: 'Multiple independent, consistent sources over time support the finding.' },
        { id: 'i5', text: 'P5: single unreplicated preprint', answer: 'Weakly supported', why: 'One source without replication should be reported with clear caveats, not stated as fact.' },
      ],
      solution: `Check dates first: different reference periods mean change, not conflict (P1). Prefer a source only with a principled, visible reason, such as a primary filing over an unsourced derivative (P2). When credible sources disagree for the same period, attribute both and explain (P3). Then grade strength: consistent independent support is established (P4); a single unreplicated source is weak (P5).`,
    },
    check: [
      {
        id: '5.6-c1',
        stem: 'A 2023 report gives 48% and a 2026 report from the same publisher gives 61% for the same metric. How should the synthesis present them?',
        options: [
          { id: 'a', text: 'As a contradiction between sources' },
          { id: 'b', text: 'As change over time, with both values and their reference dates' },
          { id: 'c', text: 'Report only the newer value' },
          { id: 'd', text: 'Average them to about 55%' },
        ],
        correct: 'b',
        why: 'Different reference periods from the same publisher indicate temporal change. Dates distinguish change from contradiction; dropping or averaging values loses information.',
      },
      {
        id: '5.6-c2',
        stem: 'Citations in a multi-agent report often point to sources that do not contain the claim. What is the most effective fix?',
        options: [
          { id: 'a', text: 'Pass findings between agents as claim-source records (source, location, date, quote) and cite from them' },
          { id: 'b', text: 'Ask the writer agent to double-check citations at the end' },
          { id: 'c', text: 'Add a bibliography of all sources consulted' },
          { id: 'd', text: 'Use fewer sources' },
        ],
        correct: 'a',
        why: 'Mappings break when citations are reconstructed after summarization. Carrying claim-level records through every step keeps each claim tied to its evidence.',
      },
      {
        id: '5.6-c3',
        stem: 'Which output format best fits quarterly revenue figures from three sources over two years?',
        options: [
          { id: 'a', text: 'A narrative paragraph' },
          { id: 'b', text: 'A bulleted list of adjectives describing growth' },
          { id: 'c', text: 'A table with columns for period, value, source, and publication date' },
          { id: 'd', text: 'A single headline number' },
        ],
        correct: 'c',
        why: 'Tables make numeric comparisons across sources and periods easy to check and keep provenance visible. Prose suits narrative developments such as news.',
      },
    ],
    review: [
      { front: 'What should each finding carry through synthesis?', back: 'Claim, source (URL or document), location, publication and reference dates, and a supporting quote.' },
      { front: 'Two sources disagree on a figure. First question?', back: 'Do they refer to the same period and definition? If not, it may be change or a scope difference, not a contradiction.' },
      { front: 'When may you resolve a conflict to one value?', back: 'Only with a principled, stated reason (such as primary over derivative, or a revised dataset), keeping the other value visible.' },
    ],
    sources: ['guide-d5', 'eng-multi-agent', 'guard-hallucinations', 'app-authored'],
  },
];
