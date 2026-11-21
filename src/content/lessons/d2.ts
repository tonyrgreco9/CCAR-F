import type { Lesson } from '../types';

// Domain 2 — Tool Design & MCP Integration.
// Original, app-authored lessons. Learning points are aligned to the Knowledge/Skills bullets of
// the official exam guide v1.1 (task statements 2.1–2.5); wording is original. Bullet-level coverage
// is recorded in ../coverage/d2.ts.

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------------------------
  // 2.1
  // ---------------------------------------------------------------------------------------------
  {
    id: '2.1',
    title: 'Tool descriptions, inputs, and boundaries',
    outcome:
      'Given a set of tool definitions and a misrouted tool call, identify which description, name, or schema detail caused the wrong choice and rewrite the definitions so the right tool is selected.',
    minutes: 25,
    terms: [
      { term: 'Tool description', definition: 'The natural-language `description` field of a tool definition. The model reads it, together with the name and input schema, to decide whether and how to call the tool.' },
      { term: 'Input schema', definition: 'The JSON Schema in `input_schema` that declares the tool\'s parameters, their types, which are required, and allowed values (for example an `enum`).' },
      { term: 'Tool boundary', definition: 'An explicit statement of what a tool does not do and which sibling tool to use instead, so two similar tools do not compete for the same request.' },
      { term: 'Misrouting', definition: 'The model calls a tool that exists and works but is the wrong one for the request, usually because two tools look interchangeable from their names and descriptions.' },
    ],
    learningPoints: [
      'Explain why the description is the main signal the model uses to choose among tools, and why one-line descriptions make selection among similar tools unreliable.',
      'Write a description that states purpose, input formats, output, example queries, edge cases, and boundaries against similar tools.',
      'Diagnose misrouting caused by ambiguous or overlapping definitions, and fix it by renaming a tool and rewriting its description so the overlap disappears.',
      'Split a generic do-everything tool into purpose-specific tools, each with a defined input and output contract (and know when consolidating near-duplicates behind an enum is the better move).',
      'Use input schemas (required fields, enums, formats) and clear names to remove ambiguity the description alone cannot.',
      'Review the system prompt for keyword-triggered instructions that create unintended tool associations and override otherwise good tool descriptions.',
    ],
    concept: `When Claude has several tools, it does not see your code. It sees each tool's **name**, **description**, and **input schema**, and it picks the one whose text best matches the request. That makes the description the most important routing signal you control. A one-line description such as "Gets invoice data" forces the model to guess; a description written like documentation for a new teammate lets it choose correctly.

A strong description answers five questions:

1. **Purpose** — what the tool does and when to use it.
2. **Inputs** — what each parameter means and its format (e.g. invoice IDs look like \`INV-2026-004512\`).
3. **Output** — what comes back, including what an empty result means.
4. **Example and edge cases** — a typical call, and what happens with partial IDs or dates out of range.
5. **Boundaries** — what the tool does *not* do and which sibling tool to use instead.

Boundaries matter most when tools overlap. If \`lookup_invoice\` and \`lookup_transaction\` both say they "retrieve billing records", the model has no basis to choose and will misroute some fraction of requests. Saying "use this for a monthly bill by invoice ID; for a single card charge or refund use \`lookup_transaction\`" removes the tie.

Structure helps too. Clear, distinct **names** (\`search_orders_by_customer\` rather than \`get_data\`) carry meaning before the description is read. **Input schemas** constrain what the model can send: an \`enum\` for a status filter prevents invented values, required fields prevent half-formed calls, and a described format prevents guesswork.

**Names are part of the description.** When two tools overlap in name and wording, for example a web agent's \`analyze_content\` and a document agent's \`analyze_document\` both described as "analyzes text and returns key points", the model cannot tell them apart. Rewriting the descriptions helps, but the cleanest fix is often to **rename** one so its scope is obvious (\`analyze_content\` becomes \`extract_web_results\`, described as working only on fetched web search results) and to state the boundary in both.

Sometimes the fix is structural. A **generic tool** like \`analyze_document(doc, instruction)\` that pulls numbers, writes summaries, and checks claims returns a different shape each time and gives the model no signal about which job it is doing. **Splitting** it into purpose-specific tools, such as \`extract_data_points\` (returns a list of figure, unit, and location), \`summarize_content\` (returns a bounded summary), and \`verify_claim_against_source\` (returns supported, contradicted, or not found plus the quoted passage), gives each one a **defined input and output contract** that callers and downstream code can rely on. The same logic applies to risk: \`billing_action(action, ...)\` that refunds and looks things up should be split so each action can be permissioned separately. The opposite problem also happens: five near-identical tools (\`list_open_tickets\`, \`list_closed_tickets\`, ...) differ only by a filter value, so **consolidating** them into one tool with a \`status\` enum shrinks the choice and removes look-alikes.

**Check the system prompt too.** Tool selection is also shaped by the system prompt, and keyword-triggered instructions can quietly override good descriptions. A line such as "Whenever the customer mentions an order, look the order up first" makes the word *order* a trigger: "my order arrived broken, can I return it?" now goes to \`lookup_order\` instead of \`check_return_eligibility\`, even though the descriptions are clear. When misrouting persists after the descriptions are fixed, search the system prompt for words that tie to a tool name and reword the instruction around the situation, not the keyword.

### Terminology

- **Tool definition**: name + description + \`input_schema\`, sent with each request.
- **Selection signal**: the text the model uses to choose a tool; the description carries most of it.
- **Boundary statement**: "Do not use for X; use Y instead."
- **Purpose-specific tool**: one action, one risk level, one clear trigger, one input/output contract.
- **Keyword-sensitive instruction**: a system-prompt rule triggered by a word rather than a situation, which can create unintended tool associations.`,
    example: {
      intro: 'A support agent keeps calling `lookup_invoice` when customers ask about a single card charge. The original and rewritten definitions are below.',
      artifacts: [
        {
          lang: 'json',
          caption: 'Before: two overlapping definitions',
          code: `[
  {
    "name": "lookup_invoice",
    "description": "Retrieves billing records for a customer.",
    "input_schema": {
      "type": "object",
      "properties": { "customer_id": { "type": "string" }, "query": { "type": "string" } },
      "required": ["customer_id"]
    }
  },
  {
    "name": "lookup_transaction",
    "description": "Retrieves billing records.",
    "input_schema": {
      "type": "object",
      "properties": { "id": { "type": "string" } }
    }
  }
]`,
        },
        {
          lang: 'json',
          caption: 'After: purpose, inputs, output, edge cases, and boundaries',
          code: `[
  {
    "name": "lookup_invoice",
    "description": "Get one monthly invoice (the bill a customer receives each billing cycle) with its line items and amount due. Use when the customer refers to a bill, a billing month, or an invoice number. Input: invoice_id like INV-2026-004512, or customer_id plus billing_month (YYYY-MM). Returns found=false if no invoice exists for that month; that is not an error. Does NOT return individual card charges, refunds, or payment attempts: use lookup_transaction for those.",
    "input_schema": {
      "type": "object",
      "properties": {
        "customer_id": { "type": "string", "description": "Customer ID, e.g. CUS-88213" },
        "invoice_id": { "type": "string", "description": "Invoice ID, e.g. INV-2026-004512" },
        "billing_month": { "type": "string", "pattern": "^\\\\d{4}-\\\\d{2}$", "description": "YYYY-MM" }
      },
      "required": ["customer_id"]
    }
  },
  {
    "name": "lookup_transaction",
    "description": "Get individual payment events: card charges, refunds, and failed payment attempts. Use when the customer mentions a specific charge, an amount on a card statement, or a refund. Input: customer_id and optionally amount and a date range. Returns a list (possibly empty). Does NOT return invoice line items: use lookup_invoice for what a bill contains.",
    "input_schema": {
      "type": "object",
      "properties": {
        "customer_id": { "type": "string" },
        "type": { "type": "string", "enum": ["charge", "refund", "failed_payment", "any"] },
        "amount": { "type": "number", "description": "Amount in account currency, e.g. 49.99" },
        "from_date": { "type": "string", "format": "date" },
        "to_date": { "type": "string", "format": "date" }
      },
      "required": ["customer_id"]
    }
  }
]`,
        },
      ],
      walkthrough: `In the "before" version, both descriptions say "retrieves billing records", the parameter names (\`query\`, \`id\`) say nothing about format, and neither tool mentions the other. A request like "Why was I charged $49.99 on the 3rd?" matches both equally, so the model picks one somewhat arbitrarily.

The "after" version fixes this at the definition level:

- Each description opens with **what kind of record** it covers (a monthly bill vs. a payment event) and the **customer phrases** that should trigger it.
- **Input formats** are stated (\`INV-...\`, \`YYYY-MM\`, amounts), and the \`type\` filter is an **enum**, so the model cannot invent values like \`"chargeback"\`.
- Each tool says what an **empty result** means, which matters later for error handling.
- Each ends with a **boundary**: "Does NOT return X: use Y." That sentence is what breaks the tie for the $49.99 question.

No system-prompt rule was needed; the routing information now travels with the tools wherever they are used. One more check before shipping: search the system prompt for instructions keyed on words like "charge" or "bill". A line such as "If the customer mentions a bill, pull the invoice" would send "a charge on my bill I don't recognize" back to \`lookup_invoice\` and undo the rewrite.`,
    },
    compare: {
      question: 'A team has one `manage_account(action, params)` tool handling lookups, plan changes, and refunds. Should they split it or keep it?',
      a: {
        title: 'Split into purpose-specific tools',
        body: 'Replace the generic tool with `get_account`, `change_plan`, and `issue_refund`, each with its own description, schema, and required fields. Each tool can be allowed or blocked per agent and guarded by its own checks.',
        chooseWhen: 'The actions differ in risk, required inputs, or when they should be used (read vs. money-moving write).',
      },
      b: {
        title: 'Consolidate behind one tool with an enum',
        body: 'Keep (or create) a single tool such as `list_tickets` with a `status` enum (`open`, `pending`, `closed`) instead of several tools that differ only by that filter.',
        chooseWhen: 'The variants share the same inputs, output shape, and risk, and differ only by a filter or mode value.',
      },
      decidingDetail: `Ask whether the variants are **different actions** or **the same action with a different filter**. Different actions with different risk or inputs (a read vs. a refund) should be split so each has a precise description, schema, and permission. Variants that share inputs, output, and risk should be consolidated so the model faces one clear choice plus an enum instead of several look-alike tools.`,
    },
    mistake: {
      mistake: 'Leaving tool descriptions terse and overlapping, then adding system-prompt rules like "Always use lookup_transaction for card charges" to correct misrouting.',
      whyTempting: 'Editing the system prompt is quick, does not require touching the tool server, and often reduces the specific failure that was reported.',
      howToRecognize: 'The system prompt accumulates routing rules for individual tools; the same tools misroute when reused by another agent; descriptions are one line with no inputs, examples, or "use X instead" statements.',
      fix: 'Move the routing knowledge into the tool definitions: state purpose, input formats, output and empty-result meaning, example queries, edge cases, and explicit boundaries against similar tools. Rename or split tools whose names or jobs overlap, and use enums for constrained values. Keep the system prompt for task policy, and review it for keyword-triggered instructions that pull requests toward one tool regardless of what the descriptions say.',
    },
    exercise: {
      prompt: 'For each symptom observed in an agent\'s logs, choose the most direct fix at the tool-definition level.',
      inputs: `Tools in the agent today:

\`\`\`text
search(query)                         "Searches for things."
get_customer(customer_id)             "Gets the customer profile."
list_open_orders / list_shipped_orders / list_cancelled_orders / list_returned_orders
admin_action(action, payload)         "Performs admin actions (lookup, refund, delete_account)."
set_priority(ticket_id, priority)     priority: string, "Sets ticket priority."
fetch_doc(id)                         name collides with the MCP wiki server's fetch_doc
analyze_text(text, instruction)       "Analyzes text." used to extract figures, summarize, and check claims
\`\`\`

System prompt excerpt: "If a message mentions a refund, check the customer's transactions first."`,
      labels: ['Sharpen description', 'Split the tool', 'Consolidate tools', 'Constrain input schema', 'Rename tool', 'Reword system prompt'],
      items: [
        { id: 'e1', text: 'The model calls `search` for customer-profile questions and also for knowledge-base questions, with mixed results.', answer: 'Sharpen description', why: '"Searches for things" gives no purpose or boundary. State what corpus it searches, input format, and "for a customer profile use get_customer".' },
        { id: 'e2', text: 'The model sometimes calls `list_shipped_orders` when the user asked about returns.', answer: 'Consolidate tools', why: 'Four tools differ only by a status filter; one `list_orders` tool with a `status` enum removes the look-alike choice.' },
        { id: 'e3', text: 'A read-only reporting agent was observed calling `admin_action` with `delete_account`.', answer: 'Split the tool', why: 'A read and a destructive write share one tool, so they cannot be permissioned separately. Split into purpose-specific tools and give the reporting agent only the read tool.' },
        { id: 'e4', text: 'Calls to `set_priority` arrive with values like "urgent!!", "P1", and "high".', answer: 'Constrain input schema', why: 'A free-form string invites invented values; an enum such as `low|normal|high|urgent` makes valid values explicit.' },
        { id: 'e5', text: 'Two servers expose `fetch_doc`; the model picks the internal ticket attachment fetcher when asked for a wiki page.', answer: 'Rename tool', why: 'Identical names with different purposes collide; a distinct name like `fetch_ticket_attachment` (plus a boundary sentence) separates them.' },
        { id: 'e6', text: 'Downstream code cannot parse `analyze_text` output: sometimes a list of numbers, sometimes a paragraph, sometimes "true".', answer: 'Split the tool', why: 'One generic tool does three jobs with three output shapes. Purpose-specific tools (extract figures, summarize, verify a claim) each get a defined input and output contract.' },
        { id: 'e7', text: '"What is your refund policy for annual plans?" triggers a `lookup_transaction` call, although the policy tool\'s description clearly covers policy questions.', answer: 'Reword system prompt', why: 'The keyword "refund" in the system prompt creates a tool association that overrides the descriptions. Reword the instruction around the situation (a customer asking about a specific charge) rather than the word.' },
      ],
      solution: `Match the fix to the cause. Vague text calls for a **sharper description** with purpose and boundaries. Near-duplicates that differ only by a filter should be **consolidated** behind an enum. A tool that mixes reads and destructive writes, or one generic tool that does several jobs with different output shapes, should be **split** so each purpose has its own description and input/output contract. Free-form values the system cannot accept call for an **enum or pattern in the schema**. Name collisions call for a **rename**. When good descriptions still lose to a keyword in the system prompt, **reword the prompt**. In practice you often combine fixes (a rename usually comes with a boundary sentence), but start from the one that removes the specific ambiguity.`,
    },
    check: [
      {
        id: 'c1',
        stem: 'Two tools, `get_order` and `get_shipment`, are each described as "Returns order information." The model often calls the wrong one. What is the most effective first fix?',
        options: [
          { id: 'a', text: 'Add a system-prompt rule listing which tool to use for which question' },
          { id: 'b', text: 'Rewrite both descriptions to state what each returns, when to use it, and a "use the other tool for X" boundary' },
          { id: 'c', text: 'Lower the temperature so tool choice is more consistent' },
          { id: 'd', text: 'Remove `get_shipment` and let `get_order` return shipment data on request' },
        ],
        correct: 'b',
        why: 'The descriptions are identical, so the model has no basis to choose. Distinct purposes and explicit boundaries in the definitions fix the cause where the model looks; a prompt rule patches it only for one agent.',
      },
      {
        id: 'c2',
        stem: 'Which schema change most directly prevents a model from sending invented status values like "kinda done"?',
        options: [
          { id: 'a', text: 'Mark the `status` field as required' },
          { id: 'b', text: 'Add a longer description to the tool' },
          { id: 'c', text: 'Declare `status` with an `enum` of the accepted values' },
          { id: 'd', text: 'Rename the field from `status` to `ticket_status`' },
        ],
        correct: 'c',
        why: 'An enum lists the only acceptable values, so the model selects one of them. Making the field required only ensures something is sent; it does not limit what.',
      },
      {
        id: 'c3',
        stem: 'A tool `ticket_op(op, args)` supports `view`, `comment`, and `close_and_refund`. What is the main reason to split it?',
        options: [
          { id: 'a', text: 'Fewer tools always improve selection accuracy' },
          { id: 'b', text: 'Operations with very different risk get their own description, schema, and permission, so a read-only agent can be given only `view`' },
          { id: 'c', text: 'The API rejects tools that take an `op` parameter' },
          { id: 'd', text: 'Split tools return results faster' },
        ],
        correct: 'b',
        why: 'Splitting matters here because a harmless read and a money-moving write share one entry point. Separate tools can be described precisely and granted per role.',
      },
    ],
    review: [
      { front: 'What five things should a tool description cover?', back: 'Purpose/when to use, inputs and formats, output (including what empty means), an example or edge cases, and boundaries: what it does not do and which tool to use instead.' },
      { front: 'Split or consolidate?', back: 'Split when variants are different actions with different risk or inputs. Consolidate behind an enum when variants are the same action differing only by a filter value.' },
      { front: 'Why not fix misrouting with a system-prompt rule?', back: 'It patches one agent while the ambiguous definitions remain; the fix belongs in the tool name, description, and schema, which travel with the tool.' },
      { front: 'Descriptions are good but one tool still wins whenever a certain word appears. Where do you look?', back: 'The system prompt: a keyword-triggered instruction ("whenever X is mentioned, do Y") can create a tool association that overrides the descriptions. Reword it around the situation.' },
    ],
    sources: ['guide-d2', 'api-tool-use', 'api-implement-tool-use', 'eng-writing-tools'],
  },

  // ---------------------------------------------------------------------------------------------
  // 2.2
  // ---------------------------------------------------------------------------------------------
  {
    id: '2.2',
    title: 'Structured MCP errors that support recovery',
    outcome:
      'Given a tool failure, design an MCP tool result that marks it as an error, classifies it, says whether a retry can help, and lets the agent decide between local recovery and escalating to its coordinator.',
    minutes: 25,
    terms: [
      { term: 'isError', definition: 'A boolean on an MCP tool result. When true, the result content describes a failure of the tool call rather than a successful answer, and the client passes it to the model so it can react.' },
      { term: 'errorCategory', definition: 'A field in the error payload classifying the failure (transient, validation, permission, and for policy refusals business) so the agent knows what kind of recovery makes sense.' },
      { term: 'isRetryable', definition: 'A boolean in the error payload saying whether repeating the same call could succeed (true for a timeout, false for a policy refusal). Business-rule refusals are often marked retriable: false.' },
      { term: 'Valid empty result', definition: 'A successful call that found nothing, such as zero matching orders. It is not an error and should not set isError.' },
    ],
    learningPoints: [
      'Use the MCP isError flag to report a tool failure back to the agent, and distinguish an access failure from a successful query that returned no matches.',
      'Classify failures as transient, validation, business (policy), or permission, and map each to the recovery it supports.',
      'Explain why a uniform "Operation failed" response prevents correct recovery decisions.',
      'Return structured error metadata: errorCategory, an isRetryable boolean, and a human-readable description, so non-retryable errors do not cause wasted retries.',
      'For business-rule violations, return retriable: false with a customer-friendly explanation the agent can pass on.',
      'Recover locally inside a subagent for transient failures, and propagate to the coordinator only unresolved errors, with partial results and what was attempted.',
    ],
    concept: `When a tool fails, the agent can only recover well if it understands **what** went wrong. "Something failed" leaves it guessing: should it try again, change the input, tell the user, or hand off? A good error tells it which.

In MCP, a tool call that ran but failed should return a normal tool result with **\`isError: true\`** and content explaining the failure. The client passes that result to the model (in the Messages API it becomes a \`tool_result\` block with \`is_error: true\`), so the model sees the failure and can reason about it. Problems at the protocol level, such as calling a tool that does not exist, are reported differently, as JSON-RPC errors.

The MCP spec does not define *what* goes inside the error content, and a uniform message like "Operation failed" is the worst choice: a timeout, a typo, and a policy refusal all look the same, so the agent retries things that can never succeed and gives up on things that would have worked. The pattern the exam guide names is a small structured payload:

- **errorCategory**: \`transient\` (timeout, rate limit, service unavailable), \`validation\` (bad or missing input), \`permission\` (caller not allowed), and for policy refusals a **business** category (the request breaks a rule, e.g. a refund above the cap or outside the return window).
- **isRetryable**: a boolean saying whether repeating the same call can succeed. This is what prevents wasted retry attempts: the agent does not resend a request the server has already said will fail the same way.
- **message**: a human-readable description the model can reason about, ideally with what to do next.
- Optional context: the field that was invalid, the limit that applied, a retry-after hint.

**Business-rule violations need one more thing.** The agent usually has to tell a customer about them. Mark them non-retryable (\`retriable: false\` or \`isRetryable: false\`) and include a **customer-friendly explanation** separate from internal detail, e.g. "This order was delivered 41 days ago, and returns are accepted within 30 days." Without it, the agent either retries, or paraphrases an internal code ("policy violation 4471") that means nothing to the customer.

Just as important is what is **not** an error. A search that ran and matched nothing is a **valid empty result**: return success with an empty list and say so. Returning an empty list when the database was unreachable is the dangerous case: the agent concludes "no orders exist" and tells the customer something false. Failure and absence must look different.

Structured errors also decide **where** recovery happens. A subagent should handle transient errors **locally** (a bounded retry with backoff) and fix validation errors itself (reformat the date and call again), so the coordinator is not interrupted for problems that resolve in seconds. Only errors it cannot resolve go up: business and permission errors, or transient errors that persisted after retries. For those the subagent stops and **propagates** structured context to its coordinator: what was attempted, the category, the **partial results** it already has, and possible alternatives. The coordinator, which sees the whole task, decides whether to reroute, ask the user, or escalate, without redoing the work that succeeded.

### Terminology

- **Tool execution error**: tool ran and failed; returned as a result with \`isError: true\`.
- **Protocol error**: malformed request or unknown tool; a JSON-RPC error.
- **Local recovery**: the agent that saw the error fixes it (retry, correct input).
- **Propagation**: returning structured failure context upward instead of retrying or hiding it.`,
    example: {
      intro: 'An MCP server for an order system returns four kinds of outcome. The error payload format (errorCategory, isRetryable, message) is an app convention placed inside the result content.',
      artifacts: [
        {
          lang: 'json',
          caption: 'Four tool results from the same server',
          code: `// 1. Valid empty result: the search ran, nothing matched (NOT an error)
{ "content": [{ "type": "text", "text": "{\\"orders\\": [], \\"note\\": \\"No orders for CUS-88213 between 2026-10-01 and 2026-10-31.\\"}" }],
  "isError": false }

// 2. Transient failure
{ "content": [{ "type": "text", "text": "{\\"errorCategory\\": \\"transient\\", \\"isRetryable\\": true, \\"retryAfterSeconds\\": 5, \\"message\\": \\"Order database timed out after 10s. Retrying shortly may succeed.\\"}" }],
  "isError": true }

// 3. Validation failure
{ "content": [{ "type": "text", "text": "{\\"errorCategory\\": \\"validation\\", \\"isRetryable\\": false, \\"field\\": \\"from_date\\", \\"message\\": \\"from_date must be YYYY-MM-DD; received '10/01/2026'. Correct the format and call again.\\"}" }],
  "isError": true }

// 4. Business-rule refusal (non-retryable, with a customer-facing explanation)
{ "content": [{ "type": "text", "text": "{\\"errorCategory\\": \\"business\\", \\"retriable\\": false, \\"limit\\": 150, \\"requested\\": 220, \\"message\\": \\"Refunds above $150 require human approval. Do not retry; escalate with the case summary.\\", \\"customerMessage\\": \\"Refunds of this size need a quick review by our billing team. I've passed your case on and they'll follow up within one business day.\\"}" }],
  "isError": true }`,
        },
        {
          lang: 'typescript',
          caption: 'Server-side helper that builds consistent error results',
          code: `type ErrorCategory = 'transient' | 'validation' | 'business' | 'permission';

function toolError(category: ErrorCategory, message: string, extra: Record<string, unknown> = {}) {
  const isRetryable = category === 'transient';
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ errorCategory: category, isRetryable, message, ...extra }) }],
  };
}

async function searchOrders(args: { customer_id: string; from_date: string; to_date: string }) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(args.from_date))
    return toolError('validation', \`from_date must be YYYY-MM-DD; received '\${args.from_date}'.\`, { field: 'from_date' });
  try {
    const orders = await db.orders.find(args);           // may throw on timeout
    return { content: [{ type: 'text', text: JSON.stringify({ orders }) }] };  // empty list is success
  } catch (err) {
    if (isTimeout(err)) return toolError('transient', 'Order database timed out. Retrying may succeed.', { retryAfterSeconds: 5 });
    throw err;  // unexpected: let the server's generic handler report it
  }
}`,
        },
      ],
      walkthrough: `Read the four results as the model would:

- **Result 1** has \`isError: false\` and an empty list with a note. The agent can truthfully say "I don't see any orders in October."
- **Result 2** is transient and retryable. The agent (or the client code around it) can wait and try once or twice. If it still fails, it should report that the system is unavailable, not that orders do not exist.
- **Result 3** names the bad field and the expected format. The agent can fix the input itself and call again: local recovery with no human involved.
- **Result 4** is a business rule marked \`retriable: false\`. Retrying cannot help. The internal \`message\` tells the agent what to do (escalate); the \`customerMessage\` gives it wording it can pass to the customer instead of an error code. A subagent should stop and return this context to the coordinator (or the support agent should call its escalation tool).

The server helper keeps the format consistent: every error has a category, a retryable flag derived from the category, and a message. Note that the empty search path returns success; only the timeout path returns an error. That single distinction prevents the most harmful failure mode: an outage reported as "nothing found."`,
    },
    compare: {
      question: 'A research subagent gets an error from the metrics MCP server. Should it recover itself or hand the problem to the coordinator?',
      a: {
        title: 'Recover locally in the subagent',
        body: 'Retry a transient error a bounded number of times with backoff, or correct a validation error (wrong date format, missing field) and call again. The coordinator only sees the final, successful result.',
        chooseWhen: 'The error is transient or a validation problem the subagent can fix from information it already has.',
      },
      b: {
        title: 'Propagate structured failure to the coordinator',
        body: 'Stop and return what was attempted, the error category and message, any partial results gathered so far, and suggested alternatives (another source, a narrower query, human approval).',
        chooseWhen: 'The error is a business or permission problem, retries are exhausted, or fixing it requires context or authority the subagent lacks.',
      },
      decidingDetail: `The deciding detail is **whether the subagent can change the outcome with what it has**. Transient errors (isRetryable true) and validation errors that name the bad field can be fixed locally. Business-rule and permission errors cannot be fixed by retrying or reformatting, so the subagent should propagate structured context, including partial results, rather than retrying, hiding the failure, or aborting the whole workflow.`,
    },
    mistake: {
      mistake: 'Catching every exception in the tool and returning an empty list (or a bare "Operation failed") without isError or a category.',
      whyTempting: 'It keeps the agent loop from crashing, looks clean in logs, and an empty list is a valid shape the calling code already handles.',
      howToRecognize: 'The agent tells users "no records found" during outages; retries happen on policy refusals; the model loops calling the same failing tool; error messages carry no field, limit, or next step.',
      fix: 'Return success with an empty list only when the query actually ran. For failures, set isError: true and include errorCategory, isRetryable, and a specific human-readable message (plus field, limit, or retry-after when relevant); for business-rule refusals add retriable: false and a customer-friendly explanation. Let transient and validation errors be handled locally, and propagate business and permission errors, or transient ones that outlasted retries, with what was attempted and any partial results.',
    },
    exercise: {
      prompt: 'Label the right handling for each tool outcome a support or research agent receives.',
      inputs: `\`\`\`text
o1  isError=true  {"errorCategory":"transient","isRetryable":true,"message":"Upstream 503 from billing service"}
o2  isError=false {"transactions":[],"note":"No refunds for CUS-40177 in the last 90 days"}
o3  isError=true  {"errorCategory":"validation","isRetryable":false,"field":"amount","message":"amount must be a number; got '$49.99'"}
o4  isError=true  {"errorCategory":"business","isRetryable":false,"message":"Account is in a legal hold; plan changes are blocked"}
o5  isError=true  {"errorCategory":"permission","isRetryable":false,"message":"Service account lacks read access to warehouse schema finance_restricted"}
\`\`\``,
      labels: ['Retry with backoff', 'Correct input and retry', 'Report valid empty result', 'Stop and propagate'],
      items: [
        { id: 'e1', text: 'o1: upstream 503 from the billing service', answer: 'Retry with backoff', why: 'Transient and marked retryable; a bounded retry may succeed. If retries are exhausted it becomes a propagate case.' },
        { id: 'e2', text: 'o2: no refunds in the last 90 days', answer: 'Report valid empty result', why: 'The query succeeded and found nothing; the agent can state this as a fact. It is not a failure.' },
        { id: 'e3', text: 'o3: amount sent as "$49.99"', answer: 'Correct input and retry', why: 'The error names the field and the expected type; the agent can send 49.99 and call again.' },
        { id: 'e4', text: 'o4: legal hold blocks plan changes', answer: 'Stop and propagate', why: 'A business rule; retrying cannot help. Hand the context to the coordinator or escalate (legal matters go to humans).' },
        { id: 'e5', text: 'o5: no access to a restricted schema', answer: 'Stop and propagate', why: 'Permission errors need someone with authority or a different data source; the subagent should return what it tried and any partial results.' },
      ],
      solution: `The category and retryable flag decide the action. **Transient** → bounded retry. **Validation** with a named field → fix and retry locally. **Success with empty data** → report it truthfully as "none found". **Business** and **permission** → no retry; stop and propagate structured context (attempt, category, message, partial results, alternatives) so the coordinator or a human can decide.`,
    },
    check: [
      {
        id: 'c1',
        stem: 'A customer lookup tool catches a database connection error and returns `{"customers": []}` with no error flag. What is the main risk?',
        options: [
          { id: 'a', text: 'The agent will retry forever' },
          { id: 'b', text: 'The client will reject the malformed result' },
          { id: 'c', text: 'The model will see a JSON syntax error' },
          { id: 'd', text: 'The agent will treat an outage as "no such customer" and act on a false fact' },
        ],
        correct: 'd',
        why: 'An empty list is indistinguishable from a real "no results" answer, so the agent concludes the customer does not exist. Failures must set isError and say what went wrong.',
      },
      {
        id: 'c2',
        stem: 'A tool returns isError: true with errorCategory "business" and isRetryable false (refund exceeds the agent\'s limit). What should a subagent do?',
        options: [
          { id: 'a', text: 'Stop and return the error context and case details to its coordinator or escalation path' },
          { id: 'b', text: 'Retry with exponential backoff' },
          { id: 'c', text: 'Split the refund into smaller refunds under the limit' },
          { id: 'd', text: 'Return an empty result so the coordinator can continue' },
        ],
        correct: 'a',
        why: 'Business-rule refusals cannot be fixed by retrying, and working around the limit defeats the policy. Propagating structured context lets the party with authority decide.',
      },
      {
        id: 'c3',
        stem: 'Which error message best supports local recovery?',
        options: [
          { id: 'a', text: '"Error 400"' },
          { id: 'b', text: '"Invalid request. Please try again."' },
          { id: 'c', text: '"validation: start_date must be YYYY-MM-DD; received 03/11/2026"' },
          { id: 'd', text: '"Something went wrong on our side."' },
        ],
        correct: 'c',
        why: 'It names the category, the field, the expected format, and the bad value, so the model can correct the call itself. The others give no actionable detail.',
      },
    ],
    review: [
      { front: 'Four common error categories and the default response', back: 'Transient: bounded retry. Validation: fix the named input and retry. Business: no retry, explain or escalate. Permission: no retry, propagate to someone with access.' },
      { front: '"No results" vs. "search failed"', back: 'No results is a successful call with empty data (isError false). Search failed is isError true with a category. Conflating them makes agents report outages as facts.' },
      { front: 'What should a subagent propagate on an unrecoverable error?', back: 'What it attempted, the error category and message, any partial results, and possible alternatives, so the coordinator can reroute, ask, or escalate. Transient errors it retries locally first.' },
      { front: 'What does a business-rule error need that a timeout does not?', back: 'A non-retryable flag (retriable: false) and a customer-friendly explanation the agent can relay, separate from internal detail.' },
    ],
    sources: ['guide-d2', 'mcp-spec-tools', 'api-implement-tool-use', 'eng-writing-tools'],
    notes: [
      { date: '2026-11-21', text: 'The exam guide v1.1 names errorCategory (transient/validation/permission), an isRetryable boolean, human-readable descriptions, and retriable: false for business-rule violations; treat these as the exam\'s vocabulary. They live inside the result content: the MCP specification itself defines isError and the content array, not these field names. Newer spec revisions also describe structured result content and may change guidance on whether invalid-argument errors are protocol errors or tool execution errors; check the current MCP specification for product work.' },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2.3
  // ---------------------------------------------------------------------------------------------
  {
    id: '2.3',
    title: 'Distributing tools across agents and choosing tool_choice',
    outcome:
      'Given a multi-agent design, assign each agent only the tools its role needs and pick the tool_choice setting (auto, any, a forced tool, or none) that each step requires.',
    minutes: 25,
    terms: [
      { term: 'Tool scoping', definition: 'Giving each agent only the tools its role requires, for example via the subagent definition\'s tools list or the allowed-tools configuration.' },
      { term: 'tool_choice', definition: 'A Messages API parameter controlling tool use: auto (model decides), any (must call some tool), tool with a name (must call that tool), or none (must not call tools).' },
      { term: 'Cross-role tool', definition: 'A narrowly scoped tool given to an agent outside its main role because it needs that capability frequently, e.g. a read-only fact lookup for a writer agent.' },
      { term: 'Forced tool call', definition: 'Setting tool_choice to {"type":"tool","name":"..."} so the response must be a call to that specific tool.' },
    ],
    learningPoints: [
      'Explain why giving an agent many tools (around 18 rather than 4–5) degrades selection reliability, and why agents given tools outside their specialization misuse them.',
      'Restrict each subagent\'s tool set to its role, adding only limited cross-role tools for specific high-frequency needs.',
      'Replace generic tools with constrained alternatives (e.g. a document loader that validates URLs instead of open-ended URL fetching).',
      'Give a scoped cross-role tool (such as a simple fact-verification lookup) for the common case while routing complex cases through the coordinator.',
      'Choose tool_choice "auto", "any", or a forced tool ({"type": "tool", "name": ...}) for a given step; use "any" to guarantee a tool call instead of conversational text.',
      'Force a specific tool to run first (e.g. metadata extraction before enrichment) and handle the following steps in follow-up turns.',
    ],
    concept: `Every tool you give an agent is one more option it must consider on every turn. With a handful of well-described tools, selection is easy. Give the same agent 18 tools, several of them similar, instead of the 4–5 its job needs, and selection becomes less reliable: there are more near-misses to choose between, more tools it does not need, and more definitions consuming context. So the default is: **give each agent the tools its role needs, and no more.**

Tools outside an agent's specialization also invite **misuse**. A synthesis agent that happens to have web search will start searching instead of synthesizing what it was given, duplicating the search agent's job with less care about sources. In a coordinator–subagent system scoping falls out of the roles: a web search agent gets search and fetch tools; a synthesis or report agent gets none of the search tools; only an agent that must move money gets \`issue_refund\`. An agent that never had a delete tool cannot misuse one.

Scoping is also about **how generic** each tool is. A general \`fetch_url\` lets a document agent open any address, including arbitrary web pages and internal endpoints. Replacing it with a constrained \`load_document(url)\` that only accepts URLs from the approved document store, and rejects everything else with a validation error, keeps the capability the role needs and drops the rest.

Strict scoping has a cost when one role constantly needs a small piece of another's capability. If a synthesis agent must confirm a date or a name in most paragraphs, routing each check through the coordinator to the search agent adds round trips and latency. The compromise is a **scoped cross-role tool**: give the synthesis agent a narrow \`verify_fact\` lookup for the simple, high-frequency checks, and keep routing anything that needs real investigation through the coordinator to the specialist.

The second control is **tool_choice**, which shapes a single request:

- **auto** (default): the model may answer in text or call a tool. Right for open-ended agent loops.
- **any**: the model must call *some* tool but picks which. Useful when the next step must be a tool action but the right one depends on the input, e.g. classifying a document of unknown type by calling one of several type-specific extraction tools.
- **tool** with a name (\`{"type": "tool", "name": "extract_metadata"}\`): the model must call *that* tool. Use it to force a mandatory first step, for example extracting a document's metadata before any enrichment tool runs, or to guarantee **structured output** by forcing a tool whose input schema is the output format. Forcing applies to one request: send the tool result back and continue the later steps (enrichment, lookups) in **follow-up turns** with \`auto\` or \`any\`.
- **none** (also available in the API): tools stay defined but cannot be called, e.g. for a final summary turn.

Forcing a tool guarantees the call happens and the input matches the schema's shape; it does not guarantee the values are correct, so validate them.

### Terminology

- **Tool scoping / least privilege**: per-agent tool lists.
- **Selection degradation**: worse choices as the toolset grows and overlaps.
- **Cross-role tool**: narrow capability borrowed from another role.
- **tool_choice**: per-request control over whether and which tool is called.`,
    example: {
      intro: 'A research system defines subagents with scoped tools, and a separate extraction step forces structured output. The SDK shape below is illustrative; check field names against your SDK version.',
      artifacts: [
        {
          lang: 'typescript',
          caption: 'Agent SDK: per-role tool lists (illustrative)',
          code: `const options = {
  // Coordinator may only delegate and read its own notes.
  allowedTools: ['Task', 'Read'],
  agents: {
    'web-search': {
      description: 'Finds and fetches public web sources for a research sub-question.',
      prompt: 'You search the web and return sources with URLs, dates, and quotes...',
      tools: ['WebSearch', 'WebFetch'],
    },
    'doc-analysis': {
      description: 'Analyzes documents from the approved document store and returns extracted findings.',
      prompt: 'You analyze the documents you are given...',
      // Constrained loader instead of a generic fetch_url:
      tools: ['mcp__docs__load_document', 'mcp__docs__extract_data_points'],
    },
    'synthesis': {
      description: 'Combines findings provided by the coordinator into a cited synthesis.',
      prompt: 'You synthesize the findings you are given. Use verify_fact only for simple checks...',
      // No search tools; one narrow cross-role tool for frequent simple checks:
      tools: ['Read', 'mcp__facts__verify_fact'],
    },
  },
};`,
        },
        {
          lang: 'json',
          caption: 'Messages API: forcing a tool for guaranteed structured output',
          code: `{
  "model": "<model-id>",
  "max_tokens": 1024,
  "tools": [{
    "name": "record_invoice",
    "description": "Record the fields extracted from one invoice.",
    "input_schema": {
      "type": "object",
      "properties": {
        "vendor": { "type": "string" },
        "total": { "type": "number" },
        "due_date": { "type": ["string", "null"], "description": "YYYY-MM-DD, or null if absent" }
      },
      "required": ["vendor", "total", "due_date"]
    }
  }],
  "tool_choice": { "type": "tool", "name": "record_invoice" },
  "messages": [{ "role": "user", "content": "<invoice text>" }]
}`,
        },
      ],
      walkthrough: `In the agent configuration, each role sees a short, relevant list of two or three tools. The coordinator can delegate (the Task tool) but cannot search directly, which keeps it focused on planning and aggregation. The document agent has \`load_document\`, which only accepts store URLs, instead of a generic URL fetcher, so it cannot drift into web browsing. The synthesis agent has no search tools at all, so it cannot start its own research; it gets one narrow \`verify_fact\` tool so it can confirm a date or name without a round trip through the coordinator. Anything that needs real investigation still goes back to the coordinator and the web search agent.

In the API request, \`tool_choice\` names \`record_invoice\`, so the response must be a \`tool_use\` block for that tool with input shaped by the schema. That removes "the model answered in prose" and JSON syntax problems. It does not stop the model from putting a wrong total in the \`total\` field, so downstream code still validates (for example, that line items sum to the total). \`due_date\` is nullable so the model is not pushed to invent a date that the invoice does not contain.

If the input could be an invoice, a receipt, or a contract, you would define one extraction tool per type and use \`{"type": "any"}\`: a tool call is guaranteed, and the model picks the matching type.

A multi-step version works the same way. To make sure metadata is extracted before enrichment, send the first request with \`tool_choice\` forcing \`extract_metadata\`, return its \`tool_result\`, and send the next request with the enrichment tools and \`auto\` (or \`any\` if a call is still required). Forcing only ever governs the request it is set on.`,
    },
    compare: {
      question: 'The synthesis agent needs to verify simple facts in most paragraphs. Give it a scoped lookup tool, or route every check through the coordinator?',
      a: {
        title: 'Scoped cross-role tool on the synthesis agent',
        body: 'Add a narrow `verify_fact(claim)` lookup to the synthesis agent. It confirms simple facts inline without waiting on the coordinator and the search agent; complex checks still go through the coordinator.',
        chooseWhen: 'The need is high-frequency, the capability can be made narrow and low-risk, and round-trip latency or cost matters.',
      },
      b: {
        title: 'Route through the coordinator',
        body: 'The synthesis agent flags claims to verify; the coordinator delegates to the web search agent, which has the full search tools, and passes results back.',
        chooseWhen: 'Verification is occasional, needs the full query capability or judgment about sources, or the capability is too risky to hand to another role.',
      },
      decidingDetail: `Decide on **frequency and risk**. A capability the synthesis agent needs constantly, which can be cut down to a narrow, simple lookup, belongs on that agent as a scoped cross-role tool. An occasional need, or one that requires the full, powerful toolset, should go through the coordinator to the specialist, keeping each agent's toolset small and its role clear.`,
    },
    mistake: {
      mistake: 'Giving every agent the full union of tools "so nobody gets stuck" (or generic tools like fetch_url where a constrained one would do), or using tool_choice any/forced for an open-ended conversational agent.',
      whyTempting: 'One shared tool list is simpler to configure, avoids "tool not available" failures, and forcing tools seems to make behavior more predictable.',
      howToRecognize: 'Agents call tools outside their role (the writer runs searches), selection errors rise as tools are added, context fills with tool definitions; with forced tool use, the agent cannot simply answer or ask a clarifying question and calls a tool when text was needed.',
      fix: 'Define tools per role (a handful each, not the full set), replace generic tools with constrained ones, and add only narrow cross-role tools for proven high-frequency needs. Use tool_choice auto for open-ended loops, a forced tool for a mandatory first step or structured output (then continue in follow-up turns), any when a tool call is required but the right tool depends on input, and none when tools must not be called on that turn.',
    },
    exercise: {
      prompt: 'Choose the tool_choice setting for each request.',
      inputs: `Available settings:

\`\`\`json
{"type": "auto"}
{"type": "any"}
{"type": "tool", "name": "<tool>"}
{"type": "none"}
\`\`\``,
      labels: ['auto', 'any', 'forced tool', 'none'],
      items: [
        { id: 'e1', text: 'A support chat agent that may need to look things up, ask a clarifying question, or simply answer.', answer: 'auto', why: 'Open-ended: the model must be free to respond in text or call any tool.' },
        { id: 'e2', text: 'An extraction step must always return the schema of `record_claim` for downstream parsing.', answer: 'forced tool', why: 'Forcing that tool guarantees a call shaped by its input schema.' },
        { id: 'e3', text: 'Uploaded documents may be invoices, receipts, or contracts; each type has its own extraction tool, and a tool call is required.', answer: 'any', why: 'A call is mandatory, but which tool depends on the unknown document type.' },
        { id: 'e4', text: 'An intake pipeline must run `extract_metadata` on each document before any enrichment tool is called.', answer: 'forced tool', why: 'Forcing `extract_metadata` on the first request guarantees it runs first; enrichment happens in follow-up turns with auto or any.' },
        { id: 'e5', text: 'A final turn should summarize the conversation for a human handoff; tool definitions stay in the request for cache reuse but must not be called.', answer: 'none', why: 'none keeps tools defined while preventing calls on that turn.' },
      ],
      solution: `Use **auto** whenever the model must decide whether a tool is needed at all. Use a **forced tool** when one specific call must happen (a mandatory first step, or structured output via a tool schema). Use **any** when some tool call must happen but the input determines which. Use **none** when tools must not be called on this turn. Forcing applies to a single request; switch back to auto for the rest of the loop.`,
    },
    check: [
      {
        id: 'c1',
        stem: 'An agent with 40 tools from several servers increasingly picks the wrong tool. Its role uses about six of them. What is the best first change?',
        options: [
          { id: 'a', text: 'Set tool_choice to any so the model always calls a tool' },
          { id: 'b', text: 'Add a system-prompt list of all 40 tools and their uses' },
          { id: 'c', text: 'Restrict the agent to the tools its role needs' },
          { id: 'd', text: 'Raise max_tokens so the model can reason longer' },
        ],
        correct: 'c',
        why: 'A large, overlapping toolset degrades selection; scoping to the role\'s six tools removes most wrong choices and frees context.',
      },
      {
        id: 'c2',
        stem: 'You need a guaranteed tool call, but whether it should be `extract_invoice` or `extract_receipt` depends on the document. Which tool_choice fits?',
        options: [
          { id: 'a', text: '{"type": "auto"}' },
          { id: 'b', text: '{"type": "any"}' },
          { id: 'c', text: '{"type": "tool", "name": "extract_invoice"}' },
          { id: 'd', text: '{"type": "none"}' },
        ],
        correct: 'b',
        why: 'any requires some tool call while letting the model choose which; auto might answer in text, and forcing one name would misprocess receipts.',
      },
      {
        id: 'c3',
        stem: 'What does forcing a tool with an input schema guarantee?',
        options: [
          { id: 'a', text: 'The extracted values are factually correct' },
          { id: 'b', text: 'The model will not hallucinate missing fields' },
          { id: 'c', text: 'The response is a call to that tool with input structured by the schema' },
          { id: 'd', text: 'The tool will execute successfully' },
        ],
        correct: 'c',
        why: 'Forcing controls which tool is called and shapes its input; semantic correctness still needs validation, and nullable fields reduce pressure to invent values.',
      },
    ],
    review: [
      { front: 'Why scope tools per agent?', back: 'More and overlapping tools degrade selection, cost context, and widen what an agent can misuse. Give each role only what it needs.' },
      { front: 'tool_choice: auto / any / tool / none', back: 'auto: model decides. any: must call some tool. tool+name: must call that tool (first step, structured output). none: no tool calls this turn.' },
      { front: 'When add a cross-role tool?', back: 'When a role needs a capability frequently and it can be made narrow and low-risk (e.g. a verify_fact lookup for the synthesis agent), while complex cases still route through the coordinator.' },
      { front: 'Generic fetch_url on a document agent: what instead?', back: 'A constrained tool such as load_document that validates the URL belongs to the approved document source, so the agent keeps the capability its role needs and nothing more.' },
    ],
    sources: ['guide-d2', 'api-implement-tool-use', 'sdk-subagents', 'eng-multi-agent'],
    notes: [
      { date: '2026-11-20', text: 'The Agent SDK\'s subagent tool has been called Task; newer releases may name it Agent. Field names in the configuration example (allowedTools, agents, tools) are illustrative. Verify against current SDK docs.' },
      { date: '2026-11-20', text: 'Some features restrict tool_choice: with extended thinking enabled, forcing a tool or using any has not been supported (only auto or none). Verify the current restriction in the tool-use docs before relying on forced tool use with thinking.' },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2.4
  // ---------------------------------------------------------------------------------------------
  {
    id: '2.4',
    title: 'Integrating MCP servers into Claude Code and agents',
    outcome:
      'Given a team\'s MCP needs, choose project, user, or local scope for each server, write a shareable .mcp.json that keeps credentials out of the repo, and make the agent prefer the MCP tools over ad hoc Bash.',
    minutes: 25,
    terms: [
      { term: 'Project scope', definition: 'MCP servers defined in a `.mcp.json` file at the repository root, committed to version control and shared with everyone who works in the repo.' },
      { term: 'User scope', definition: 'MCP servers stored in the user\'s Claude Code configuration (e.g. `~/.claude.json`) and available in all of that user\'s projects; not shared.' },
      { term: 'Local scope', definition: 'MCP servers stored in the user\'s configuration but tied to one project; private to that user in that project. Typically the default for `claude mcp add`.' },
      { term: 'Environment variable expansion', definition: '`${VAR}` placeholders in `.mcp.json` that Claude Code fills from each user\'s environment, so the shared file holds no secrets.' },
      { term: 'MCP resource', definition: 'Read-only content an MCP server exposes by URI (documents, schemas, catalogs) that a client can list and read without calling a tool.' },
    ],
    learningPoints: [
      'Choose project, user, or local scope based on who should get the server and whether it should be versioned.',
      'Keep credentials out of shared configuration with ${ENV_VAR} expansion.',
      'Add servers with claude mcp add and the right --scope, and check what is loaded.',
      'Explain that tools from all configured servers are available together, and what that implies for naming and descriptions.',
      'Use MCP resources for catalogs and reference content the agent should browse rather than query.',
      'Decide between an existing community server and a custom one, and improve descriptions so the agent prefers MCP tools over Bash workarounds.',
    ],
    concept: `MCP lets Claude Code and Agent SDK agents use tools and data from external systems such as an issue tracker, a wiki, or a database. The two practical questions are **where a server is configured** and **how the agent will use it**.

Claude Code keeps MCP configuration at three scopes:

- **Project** — a \`.mcp.json\` file in the repo root, committed. Everyone who clones the repo gets the same servers. Use it for team tools.
- **User** — in your personal config, available in all your projects. Use it for personal tools you want everywhere.
- **Local** — personal and limited to one project. Use it for experiments or servers only you need in this repo.

You can edit \`.mcp.json\` by hand or run \`claude mcp add <name> --scope project|user|local ...\`.

Shared config must not contain secrets. \`.mcp.json\` supports **environment variable expansion**: write \`\${TRACKER_TOKEN}\` and each engineer supplies the value in their own environment (or a local, gitignored env file). The repo holds the shape; people hold the credentials.

Once connected, **tools from all configured servers are available at the same time**, alongside built-in tools. In Claude Code they appear with server-prefixed names like \`mcp__tracker__search_issues\`. That is convenient, but it means descriptions from different servers compete: if two servers both offer a vague "search", the agent can misroute.

Not everything should be a tool. **MCP resources** expose content by URI, such as a list of wiki spaces, a schema catalog, or a table list. Exposing a catalog as a resource lets the agent see what exists without many exploratory tool calls.

For the server itself, prefer a maintained **community or vendor server** for standard systems (GitHub, a common database) and build a **custom server** when you need company-specific workflows, policy checks, or trimmed outputs.

Finally, agents in Claude Code also have Bash. If the MCP tool's description is thin, the agent may fall back to \`curl\` or \`psql\` instead. Writing descriptions that say what the tool does better (auth handled, results already filtered, read-only replica) steers it to the MCP tool.

### Terminology

- **.mcp.json**: project-scope server config, committed.
- **Scope**: project, user, or local.
- **Expansion**: \`\${VAR}\` filled from the environment at load time.
- **Resource**: URI-addressed content a server exposes for reading.`,
    example: {
      intro: 'A platform team shares an issue-tracker server and a wiki server through the repo; one engineer adds a personal notes server only for themselves. All values in angle brackets are placeholders.',
      artifacts: [
        {
          lang: 'json',
          caption: '.mcp.json (committed at the repo root)',
          code: `{
  "mcpServers": {
    "tracker": {
      "command": "npx",
      "args": ["-y", "<tracker-mcp-package>"],
      "env": {
        "TRACKER_URL": "https://tracker.example.internal",
        "TRACKER_TOKEN": "\${TRACKER_TOKEN}"
      }
    },
    "wiki": {
      "type": "http",
      "url": "\${WIKI_MCP_URL:-https://wiki.example.internal/mcp}",
      "headers": { "Authorization": "Bearer \${WIKI_TOKEN}" }
    }
  }
}`,
        },
        {
          lang: 'bash',
          caption: 'Adding and checking servers',
          code: `# Personal server, available in all of this engineer's projects (not committed)
claude mcp add --scope user notes -- node ~/tools/notes-server.js

# Team server written into .mcp.json (then commit the file)
claude mcp add --scope project --transport http opsdb https://opsdb-mcp.example.internal/mcp

# See what is configured
claude mcp list
# Inside a session, /mcp shows connection status and tools`,
        },
        {
          lang: 'text',
          caption: 'Tool description that steers the agent away from Bash',
          code: `mcp__opsdb__query_replica
"Run a read-only SQL query against the operations database READ REPLICA.
Credentials and connection are handled by the server; do not use psql or Bash
for this database. Results are capped at 500 rows and include column types.
Use describe_table first if you do not know the schema. Writes are rejected."`,
        },
      ],
      walkthrough: `The **.mcp.json** file is safe to commit: the token values are \`\${TRACKER_TOKEN}\` and \`\${WIKI_TOKEN}\`, expanded from each engineer's environment. The wiki URL uses a default (\`\${VAR:-default}\`) so most people need not set it. A new engineer clones the repo, sets two environment variables, approves the project servers when prompted, and has the same tools as everyone else.

The **personal notes server** is added with \`--scope user\`, so it never touches the repo and follows the engineer across projects. The ops database server is added with \`--scope project\`, which writes it into \`.mcp.json\` for the team.

Once loaded, the agent sees \`mcp__tracker__*\`, \`mcp__wiki__*\`, and \`mcp__opsdb__*\` tools at once, alongside Read, Grep, and Bash. Without guidance, an agent asked "how many shipments failed yesterday?" might try \`psql\` in Bash, which fails without credentials or bypasses the read-only replica. The rewritten description of \`query_replica\` states that the server handles credentials, that it targets the replica, its limits, and "do not use psql or Bash," which gives the model a clear reason to prefer it.`,
    },
    compare: {
      question: 'The team needs the agent to work with the issue tracker. Use an existing community server or build a custom one?',
      a: {
        title: 'Existing community or vendor server',
        body: 'Configure a maintained server for the tracker in `.mcp.json`. Setup is fast, it covers standard operations, and someone else maintains it as the tracker API changes.',
        chooseWhen: 'The need is standard CRUD/search on a widely used system and its tools and outputs are acceptable as-is.',
      },
      b: {
        title: 'Custom MCP server',
        body: 'Write a small server exposing purpose-specific tools (e.g. `find_related_incidents`) that apply company conventions, enforce policy, and return trimmed, relevant fields.',
        chooseWhen: 'You need company-specific workflows, policy enforcement, or output shaping that a generic server does not offer.',
      },
      decidingDetail: `The deciding detail is **whether the requirement is standard or company-specific**. Standard access to a common system is best served by a maintained existing server: less code, fewer bugs, updates handled upstream. When the agent needs custom semantics (internal conventions, policy checks, trimmed outputs to save context), a custom server, possibly wrapping the same API, is worth the maintenance.`,
    },
    mistake: {
      mistake: 'Putting a team-wide server in each engineer\'s user or local scope, or committing a .mcp.json with a literal token pasted in.',
      whyTempting: 'Running `claude mcp add` with the default scope works immediately on your machine, and pasting the token in makes the file "just work" for whoever clones it.',
      howToRecognize: 'New engineers report missing tools and setup steps live in a wiki page; configs drift between machines; or a committed config file contains a credential value instead of a ${VAR} placeholder.',
      fix: 'Define shared servers in project-scope .mcp.json, committed, with every credential as a ${VAR} placeholder supplied from each person\'s environment. Keep personal servers in user or local scope. If a real credential was ever committed, rotate it, since removing it from the file does not remove it from history.',
    },
    exercise: {
      prompt: 'Pick the best configuration or design action for each situation on a team sharing one repository.',
      inputs: `\`\`\`text
Team repo: harbor-platform (20 engineers)
Servers in use: tracker (team), wiki (team), opsdb read-replica (team), personal notes (one engineer)
Observed: agent runs "curl https://tracker.example.internal/api/..." in Bash instead of using mcp__tracker__search_issues
Observed: agent calls wiki search 15 times to discover which spaces exist
\`\`\``,
      labels: ['Project scope', 'User scope', 'Local scope', 'Expose as resource', 'Rewrite tool description'],
      items: [
        { id: 'e1', text: 'The issue-tracker server every engineer should have with identical config.', answer: 'Project scope', why: 'Team-shared, versioned config belongs in the committed .mcp.json, with the token as a ${VAR} placeholder.' },
        { id: 'e2', text: 'One engineer\'s personal notes server they want in every project they open.', answer: 'User scope', why: 'Personal and cross-project: user scope keeps it out of the repo and available everywhere for that person.' },
        { id: 'e3', text: 'An engineer trying an experimental server only in this repo, without affecting teammates.', answer: 'Local scope', why: 'Private to one person and one project; nothing is committed.' },
        { id: 'e4', text: 'The agent makes many wiki searches just to learn which spaces and page trees exist.', answer: 'Expose as resource', why: 'A catalog of spaces is reference content; exposing it as a resource lets the agent read the list once.' },
        { id: 'e5', text: 'The agent uses curl against the tracker API in Bash instead of the tracker MCP tool.', answer: 'Rewrite tool description', why: 'The MCP tool\'s description should state its advantages (auth handled, filtered results) and that it is the way to access the tracker.' },
      ],
      solution: `Scope follows audience: **team and versioned → project** (.mcp.json, secrets as \${VAR}); **personal, all projects → user**; **personal, this project → local**. Catalog-style content the agent needs to browse is a good **resource**. When the agent bypasses an MCP tool through Bash, first fix the **description** so the tool's purpose and advantages are explicit; permissions that block the Bash route are a stronger, complementary control.`,
    },
    check: [
      {
        id: 'c1',
        stem: 'A team wants every engineer to get the same database MCP server without anyone committing credentials. What should they do?',
        options: [
          { id: 'a', text: 'Each engineer runs claude mcp add with user scope following a wiki page' },
          { id: 'b', text: 'Commit .mcp.json with the server and the password written as ${DB_PASSWORD}' },
          { id: 'c', text: 'Commit .mcp.json with the real password, since the repo is private' },
          { id: 'd', text: 'Add the server to the system prompt with connection details' },
        ],
        correct: 'b',
        why: 'Project scope shares and versions the config; ${VAR} expansion lets each engineer supply credentials from their environment so none land in the repo.',
      },
      {
        id: 'c2',
        stem: 'Claude Code has three MCP servers configured. Which tools can the agent use in a session?',
        options: [
          { id: 'a', text: 'Only the tools from the server listed first' },
          { id: 'b', text: 'Only tools from servers in project scope' },
          { id: 'c', text: 'Tools from one server at a time, chosen with a command' },
          { id: 'd', text: 'Tools from all connected servers together, plus built-in tools' },
        ],
        correct: 'd',
        why: 'All connected servers contribute tools at once (subject to permissions), which is why clear names and descriptions across servers matter.',
      },
      {
        id: 'c3',
        stem: 'The agent keeps using Bash and curl against an internal API even though an MCP server wraps it. What is the most direct first fix?',
        options: [
          { id: 'a', text: 'Improve the MCP tool descriptions to state what they do and why to use them for this system' },
          { id: 'b', text: 'Remove the MCP server and document the curl commands' },
          { id: 'c', text: 'Switch the server from project scope to user scope' },
          { id: 'd', text: 'Expose the API as an MCP resource' },
        ],
        correct: 'a',
        why: 'Tool choice is driven by descriptions; a description that explains coverage, auth handling, and "use this instead of curl" steers selection. Scope does not affect preference.',
      },
    ],
    review: [
      { front: 'Project vs. user vs. local MCP scope', back: 'Project: .mcp.json in repo, committed, shared. User: personal, all your projects. Local: personal, this project only.' },
      { front: 'How do you keep secrets out of .mcp.json?', back: 'Use ${VAR} (optionally ${VAR:-default}) placeholders; each person supplies values from their own environment.' },
      { front: 'Tool or resource?', back: 'Tools perform actions or queries with inputs. Resources expose readable content by URI, good for catalogs and reference material the agent should browse.' },
    ],
    sources: ['guide-d2', 'cc-mcp', 'mcp-intro', 'sdk-mcp'],
    notes: [
      { date: '2026-11-20', text: 'Claude Code MCP scope names have changed in the past (earlier releases used different names for what are now local and user scope), and the default scope for `claude mcp add` and the storage file may differ by version. Verify against the current Claude Code MCP docs and `claude mcp add --help`.' },
      { date: '2026-11-20', text: 'Details such as the `${VAR:-default}` syntax, the `--transport` flag and `type: "http"` key, the approval prompt for project-scoped servers, and how resources are referenced in a session (e.g. @-mentions) are version-sensitive. Verify against current docs.' },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2.5
  // ---------------------------------------------------------------------------------------------
  {
    id: '2.5',
    title: 'Using Read, Write, Edit, Bash, Grep, and Glob effectively',
    outcome:
      'Given a code-navigation or editing task in Claude Code, pick the built-in tool for each step, explore incrementally from Grep hits instead of reading whole directories, and recover when an Edit anchor is not unique.',
    minutes: 25,
    terms: [
      { term: 'Grep', definition: 'Built-in tool that searches file contents with a regular expression and returns matching files or lines.' },
      { term: 'Glob', definition: 'Built-in tool that finds files whose paths match a pattern such as `src/**/*.test.ts`. It does not look inside files.' },
      { term: 'Edit anchor', definition: 'The exact `old_string` text Edit replaces. It must match the file exactly and occur once, or the edit fails.' },
      { term: 'Incremental exploration', definition: 'Finding entry points with search, reading only the relevant files or ranges, then following imports and call sites step by step.' },
    ],
    learningPoints: [
      'Choose Grep for content search and Glob for path patterns, and Read, Edit, Write, or Bash for the remaining steps.',
      'Explore a large codebase incrementally: search for entry points, read targeted files, follow imports and call sites.',
      'Trace a function\'s real usage through wrapper or re-export modules rather than stopping at the first match.',
      'Apply Edit correctly: exact, unique anchor; when it is not unique, read more context and extend the anchor, or rewrite with Write when appropriate.',
      'Recognize when Bash is the right tool (builds, tests, git) and when a dedicated tool is better.',
    ],
    concept: `Claude Code gives the agent a small set of built-in tools, each with a job. Choosing the right one keeps context small and actions safe.

- **Grep** searches **inside** files for a pattern: "where is \`calculateTax\` called?"
- **Glob** finds files by **path pattern**: "which files match \`**/*.controller.ts\`?" It never reads contents.
- **Read** shows a file's contents, optionally a line range (offset/limit) for large files.
- **Edit** replaces one exact string in a file with another; **Write** creates a file or replaces all of its contents.
- **Bash** runs commands: tests, builds, git, package managers.

A common confusion is Grep vs. Glob. If the question is about *what code says*, use Grep. If it is about *file names or locations*, use Glob.

**Explore incrementally.** In a large repo, reading every file in a directory fills the context with noise and pushes out what matters. Instead: Grep for an entry point (a route string, an error message, a function name), Read the file that contains it, note what it imports or calls, and Grep or Read the next hop. Each step is chosen from what you just learned.

**Follow wrappers.** Codebases often wrap functions: \`legacyClient.charge\` is re-exported from \`payments/index.ts\`, renamed in \`billing/adapter.ts\`, and called as \`chargeCard\` elsewhere. Grepping only the original name misses callers that use the wrapper. Find where the function is imported and re-exported, then Grep for the new names too.

**Edit needs a unique anchor.** Edit matches \`old_string\` exactly, whitespace included, and fails if the text is not found or appears more than once. The agent must have Read the file in the session first. When an anchor is ambiguous (two identical \`return null;\` lines), Read the surrounding lines and extend the anchor with distinctive context, such as the function signature. If you are intentionally rewriting most of the file, or creating it, use **Write**. Edit is preferable for targeted changes because it touches only what you specify.

**Bash** is for actions without a dedicated tool. Using \`cat\`, \`find\`, or \`grep\` through Bash works but bypasses the purpose-built tools, which are typically easier to permission and produce more manageable output.

### Terminology

- **Content search**: Grep.
- **Path matching**: Glob.
- **Anchor**: Edit's unique \`old_string\`.
- **Entry point**: the first relevant hit you expand from.`,
    example: {
      intro: 'An engineer asks: "Which code paths can trigger a refund without an approval check?" The trace below shows incremental exploration through a wrapper module, then an Edit that first fails on a non-unique anchor.',
      artifacts: [
        {
          lang: 'text',
          caption: 'Tool trace (abridged)',
          code: `1  Grep  pattern="issueRefund"  output=files
   -> src/payments/refunds.ts, src/payments/index.ts, src/billing/adapter.ts

2  Read  src/payments/index.ts
   -> export { issueRefund as refundPayment } from './refunds';

3  Grep  pattern="refundPayment|issueRefund"  path=src  output=content
   -> src/billing/adapter.ts:14     import { refundPayment } from '../payments';
   -> src/billing/adapter.ts:41     export const creditCustomer = (c, amt) => refundPayment(c, amt);
   -> src/support/handlers.ts:88    await refundPayment(ticket.customerId, amount);

4  Grep  pattern="creditCustomer"  path=src  output=content
   -> src/support/goodwill.ts:23    return creditCustomer(customer, 25);
   -> src/jobs/reconcile.ts:57      await creditCustomer(row.customer, row.delta);

5  Read  src/jobs/reconcile.ts  offset=40 limit=40
   -> no call to requireApproval() before creditCustomer

6  Glob  pattern="src/jobs/**/*.test.ts"
   -> src/jobs/reconcile.test.ts`,
        },
        {
          lang: 'text',
          caption: 'Edit fails on a non-unique anchor, then succeeds',
          code: `Edit  file=src/jobs/reconcile.ts
      old_string="    await creditCustomer(row.customer, row.delta);"
-> Error: old_string matches 2 locations. Provide more context or set replace_all.

Read  src/jobs/reconcile.ts  offset=50 limit=30
-> line 57 is inside applyNegativeDelta(); line 71 is inside applyManualAdjustment()

Edit  file=src/jobs/reconcile.ts
      old_string="function applyNegativeDelta(row: ReconRow) {\\n    await creditCustomer(row.customer, row.delta);"
      new_string="function applyNegativeDelta(row: ReconRow) {\\n    await requireApproval(row.customer, row.delta);\\n    await creditCustomer(row.customer, row.delta);"
-> OK`,
        },
      ],
      walkthrough: `Step 1 uses **Grep** because the question is about code content. Instead of reading all three hits, step 2 **Reads** only the index file, which reveals a **re-export under a new name** (\`refundPayment\`). Step 3 searches for both names and finds a second wrapper, \`creditCustomer\`, in the billing adapter. Step 4 follows that wrapper to two more callers that a search for \`issueRefund\` alone would never have found. Step 5 Reads just the relevant range of \`reconcile.ts\`. Step 6 uses **Glob**, because now the question is about file paths: does a test file exist?

The first **Edit** fails because the same line appears in two functions. The fix is not to guess: Read the surrounding lines, then extend \`old_string\` with the distinctive function signature so it matches exactly once. Only the intended call site changes. Using \`replace_all\` would have changed both call sites, which is wrong here because only one path lacked approval. Rewriting the whole file with Write would also work but risks unintended changes in a long file.

Notice what the agent did **not** do: read every file under \`src/payments\` and \`src/billing\`. Seven targeted calls answered the question.`,
    },
    compare: {
      question: 'An Edit fails because the anchor text appears several times. Extend the anchor, or rewrite the file with Write?',
      a: {
        title: 'Extend the anchor and retry Edit',
        body: 'Read the area around the intended location and include distinctive neighboring text (function signature, a comment, a unique variable) in `old_string` so it matches exactly once.',
        chooseWhen: 'The change is targeted, the file is large or shared, and nearby text can make the anchor unique.',
      },
      b: {
        title: 'Rewrite the file with Write',
        body: 'Read the whole file, produce the full new contents, and Write it in one operation.',
        chooseWhen: 'The file is small or being restructured substantially, so most of its content changes anyway, or no stable unique anchor exists.',
      },
      decidingDetail: `The deciding detail is **how much of the file changes**. For a targeted change, extend the anchor: Edit touches only what you name, so the rest of the file cannot drift. When most of a small file is being rewritten, a full Write after reading the file is simpler and avoids chaining many fragile edits. Use replace_all only when every occurrence really should change.`,
    },
    mistake: {
      mistake: 'Starting exploration by reading every file in the relevant directories (or running `cat` over them in Bash) before searching for anything.',
      whyTempting: 'Reading everything feels thorough and avoids the risk of missing something; with a large context window it seems affordable.',
      howToRecognize: 'Dozens of Read calls before the first Grep; context fills with unrelated code; the agent loses earlier details, needs compaction, or answers from the first match without following wrappers.',
      fix: 'Grep for a concrete entry point (name, route, error string), Read only the files or line ranges that matter, then follow imports, re-exports, and call sites one hop at a time. Use Glob when you need files by name, and delegate very broad discovery to an exploration subagent so the main context stays clean.',
    },
    exercise: {
      prompt: 'Pick the built-in tool that best fits each step.',
      inputs: `\`\`\`text
Repo: Java + Go services, ~2M lines
Task: understand how ShipmentRetryPolicy is configured and add a max-attempts guard
\`\`\``,
      labels: ['Grep', 'Glob', 'Read', 'Edit', 'Write', 'Bash'],
      items: [
        { id: 'e1', text: 'Find every file that references `ShipmentRetryPolicy`.', answer: 'Grep', why: 'This is a search of file contents for a symbol.' },
        { id: 'e2', text: 'List all YAML configuration files under `services/shipping/`.', answer: 'Glob', why: 'The question is about file paths matching a pattern, not their contents.' },
        { id: 'e3', text: 'Inspect lines 120–180 of `RetryPolicyFactory.java`, where the policy is built.', answer: 'Read', why: 'Read with an offset and limit shows just the relevant range.' },
        { id: 'e4', text: 'Insert a `maxAttempts` check after a specific line inside `buildPolicy()`.', answer: 'Edit', why: 'A targeted change in an existing file, using a unique anchor.' },
        { id: 'e5', text: 'Create a new test file `RetryPolicyGuardTest.java`.', answer: 'Write', why: 'Creating a file requires Write; there is no existing text to anchor an Edit to.' },
        { id: 'e6', text: 'Run the shipping module\'s unit tests.', answer: 'Bash', why: 'Running a build or test command has no dedicated tool; Bash is the right choice.' },
      ],
      solution: `Content questions go to **Grep**, path questions to **Glob**. **Read** the specific ranges you need. Change existing files with **Edit** (unique anchor), create or fully replace files with **Write**, and use **Bash** for commands like tests and builds. Following this split keeps each step's output small and relevant, which matters most in very large repos.`,
    },
    check: [
      {
        id: 'c1',
        stem: 'You need every test file under `src/` whose name ends in `.spec.ts`. Which tool fits?',
        options: [
          { id: 'a', text: 'Grep for "spec"' },
          { id: 'b', text: 'Glob with `src/**/*.spec.ts`' },
          { id: 'c', text: 'Read the `src` directory' },
          { id: 'd', text: 'Edit with replace_all' },
        ],
        correct: 'b',
        why: 'The requirement is about file names, so a path pattern is the precise tool. Grep searches contents and would match unrelated text containing "spec".',
      },
      {
        id: 'c2',
        stem: 'Edit fails with "old_string matches 3 locations." You want to change only one of them. What should you do?',
        options: [
          { id: 'a', text: 'Retry the same Edit until it succeeds' },
          { id: 'b', text: 'Set replace_all to true' },
          { id: 'c', text: 'Read the surrounding code and extend old_string with distinctive context so it matches once' },
          { id: 'd', text: 'Use Bash with sed to replace the first match' },
        ],
        correct: 'c',
        why: 'Edit needs a unique anchor. Adding nearby distinctive text targets the intended location; replace_all would change all three, and sed on the first match may hit the wrong one.',
      },
      {
        id: 'c3',
        stem: 'Grep for `sendInvoice` finds only its definition, yet invoices are clearly sent from several places. What is the most likely explanation and next step?',
        options: [
          { id: 'a', text: 'The function is called through a wrapper or re-export under another name; find where it is imported and search for those names' },
          { id: 'b', text: 'Grep is unreliable; read every file in the repository instead' },
          { id: 'c', text: 'The callers must be in binary files; switch to Glob' },
          { id: 'd', text: 'The function is unused; delete it' },
        ],
        correct: 'a',
        why: 'Wrapper and re-export modules rename functions, so callers use other names. Following the imports and grepping for the aliases finds the real usage.',
      },
    ],
    review: [
      { front: 'Grep vs. Glob', back: 'Grep searches inside files for content. Glob matches file paths by pattern and never reads contents.' },
      { front: 'Edit anchor rules', back: 'old_string must match exactly (including whitespace) and be unique, and the file must have been read first. If not unique, extend it with distinctive context; Write for whole-file rewrites; replace_all only when every occurrence should change.' },
      { front: 'Incremental exploration loop', back: 'Grep an entry point, Read only what matters, follow imports, re-exports, and call sites, repeat. Do not read everything up front.' },
    ],
    sources: ['guide-d2', 'cc-tools', 'cc-workflows', 'cc-best-practices'],
    notes: [
      { date: '2026-11-20', text: 'Built-in tool details are version-sensitive: Edit\'s replace_all option, the requirement to Read a file before editing it, Grep options (output modes, file filters), Glob result ordering, and exact error wording may differ across Claude Code releases. The error text in the example is illustrative. Verify against the current tools reference.' },
    ],
  },
];
