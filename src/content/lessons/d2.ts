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
        id: 'c1',
        stem: 'Two tools, `get_order` and `get_shipment`, are each described as "Returns order information." The model often calls the wrong one. What is the most effective first fix?',
        options: [
          { id: 'a', text: 'Add a system-prompt rule listing which tool to use for each kind of question' },
          { id: 'b', text: 'Rewrite both descriptions: what each returns, when to use it, when not to' },
          { id: 'c', text: 'Lower the temperature so that the model\'s tool choice becomes more consistent' },
          { id: 'd', text: 'Remove `get_shipment` and have `get_order` return shipment data when asked' },
        ],
        correct: 'b',
        why: 'The descriptions are identical, so the model has no basis to choose. Distinct purposes and explicit boundaries in the definitions fix the cause where the model looks; a system-prompt rule patches it only for one agent and can drift from the tools.',
      },
      {
        id: 'c2',
        id: 'c2',
        stem: 'Which schema change most directly prevents a model from sending invented status values like "kinda done"?',
        options: [
          { id: 'a', text: 'Mark the `status` field as required in the tool\'s input schema' },
          { id: 'b', text: 'List the accepted status values in the tool\'s description text' },
          { id: 'c', text: 'Declare `status` with an `enum` listing the accepted values' },
          { id: 'd', text: 'Rename `status` to `ticket_status` so its purpose is clearer' },
        ],
        correct: 'c',
        why: 'An enum is part of the schema and lists the only acceptable values, so the model selects one of them. Listing the values in the description helps but is only guidance, and making the field required only ensures something is sent.',
      },
      {
        id: 'c3',
        id: 'c3',
        stem: 'A tool `ticket_op(op, args)` supports `view`, `comment`, and `close_and_refund`. What is the main reason to split it?',
        options: [
          { id: 'a', text: 'Separate tools return results faster because each handles a single operation' },
          { id: 'b', text: 'The API rejects tool schemas whose behavior is selected by an `op` parameter' },
          { id: 'c', text: 'Having more tools in the list raises selection accuracy for the whole agent' },
          { id: 'd', text: 'Read-only and money-moving operations get their own schemas and permissions' },
        ],
        correct: 'd',
        why: 'Splitting matters because a harmless read and a money-moving write share one entry point. Separate tools can be described precisely and granted per role, so a read-only agent gets only `view`. More tools do not improve selection by themselves; past a point they degrade it.',
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
        id: 'c1',
        stem: 'A customer lookup tool catches a database connection error and returns `{"customers": []}` with no error flag. What is the main risk?',
        options: [
          { id: 'a', text: 'The agent will retry the lookup in a loop until the database recovers' },
          { id: 'b', text: 'The client will reject the result because it does not match the schema' },
          { id: 'c', text: 'The model will fail to parse the result and end the conversation early' },
          { id: 'd', text: 'The agent will read an outage as "no such customer" and act on it' },
        ],
        correct: 'd',
        why: 'An empty list is indistinguishable from a real "no results" answer, so the agent concludes the customer does not exist. It will not retry, because nothing signals a failure; failures must set isError and say what went wrong.',
      },
      {
        id: 'c2',
        id: 'c2',
        stem: 'A tool returns isError: true with errorCategory "business" and isRetryable false (refund exceeds the agent\'s limit). What should a subagent do?',
        options: [
          { id: 'a', text: 'Stop and pass the error and case details to its coordinator or escalation path' },
          { id: 'b', text: 'Retry with exponential backoff in case the limit is only a temporary condition' },
          { id: 'c', text: 'Split the refund into several smaller refunds that each fall under the agent\'s limit' },
          { id: 'd', text: 'Return an empty result so the coordinator can carry on with its other work' },
        ],
        correct: 'a',
        why: 'Business-rule refusals cannot be fixed by retrying (isRetryable is false), and splitting the refund defeats the policy. Propagating structured context lets the party with authority decide.',
      },
      {
        id: 'c3',
        id: 'c3',
        stem: 'A booking tool rejected a call because of bad input. Which error message best lets the agent recover locally by fixing the call itself?',
        options: [
          { id: 'a', text: '"Error 400: the scheduling service could not process this request"' },
          { id: 'b', text: '"Invalid request. Please check your input and try the call again."' },
          { id: 'c', text: '"validation: start_date must be YYYY-MM-DD; received 03/11/2026"' },
          { id: 'd', text: '"Something went wrong on our side. Our team has been notified."' },
        ],
        correct: 'c',
        why: 'It names the category, the field, the expected format, and the bad value, so the model can correct the call itself. "Invalid request" tells it the input is wrong but not which input or how to fix it.',
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
        id: 'c3',
        stem: 'What does forcing a tool with an input schema guarantee?',
        options: [
          { id: 'a', text: 'The values it extracts will be factually correct for the source document' },
          { id: 'b', text: 'The model will leave missing fields empty rather than invent values' },
          { id: 'c', text: 'The tool will run without errors once the model has called it' },
          { id: 'd', text: 'The reply is a call to that tool with input shaped by the schema' },
        ],
        correct: 'd',
        why: 'Forcing controls which tool is called and shapes its input. It says nothing about truth: models can still invent values for missing fields, so semantic correctness needs validation, and nullable fields reduce pressure to invent.',
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
      'Given a team\'s MCP needs, put shared servers in a project .mcp.json and personal ones in ~/.claude.json, keep credentials out of the repo with ${VAR} expansion, expose catalogs as resources, and make the agent prefer capable MCP tools over built-in Grep or ad hoc Bash.',
    minutes: 25,
    terms: [
      { term: 'Project scope', definition: 'MCP servers defined in a `.mcp.json` file at the repository root, committed to version control and shared with everyone who works in the repo.' },
      { term: 'User scope', definition: 'MCP servers stored in the user\'s own Claude Code configuration, `~/.claude.json`, and available in all of that user\'s projects; never committed or shared. The place for personal and experimental servers.' },
      { term: 'Local scope', definition: 'A Claude Code variant of personal configuration: also stored in `~/.claude.json`, but tied to one project path. Private to that user in that project.' },
      { term: 'Environment variable expansion', definition: '`${VAR}` placeholders in `.mcp.json` that Claude Code fills from each user\'s environment, so the shared file holds no secrets.' },
      { term: 'MCP resource', definition: 'Read-only content an MCP server exposes by URI (documents, schemas, catalogs) that a client can list and read without calling a tool.' },
    ],
    learningPoints: [
      'Configure shared team servers in a project-level .mcp.json and personal or experimental servers in user-level ~/.claude.json.',
      'Keep credentials out of shared configuration with environment variable expansion such as ${GITHUB_TOKEN}.',
      'Explain that tools from all configured MCP servers are discovered at connection time and available to the agent at the same time, and what that implies for naming and descriptions.',
      'Expose content catalogs (issue summaries, documentation hierarchies, database schemas) as MCP resources so the agent sees what exists without exploratory tool calls.',
      'Write MCP tool descriptions that explain capabilities and outputs in enough detail that the agent does not fall back to built-in tools like Grep or Bash.',
      'Choose an existing community MCP server for standard integrations (e.g. Jira) and reserve custom servers for team-specific workflows.',
    ],
    concept: `MCP lets Claude Code and Agent SDK agents use tools and data from external systems such as an issue tracker, a wiki, or a database. The two practical questions are **where a server is configured** and **how the agent will use it**.

Claude Code reads MCP configuration from two places that matter for teams:

- **Project level** — a \`.mcp.json\` file in the repo root, committed. Everyone who clones the repo gets the same servers. Use it for shared team tooling.
- **User level** — your own \`~/.claude.json\`, available in all your projects and never committed. Use it for personal tools and experimental servers you are still trying out. (Claude Code also has a *local* variant, stored in the same file but tied to one project.)

You can edit \`.mcp.json\` by hand or run \`claude mcp add <name> --scope project|user ...\`.

Shared config must not contain secrets. \`.mcp.json\` supports **environment variable expansion**: write \`\${GITHUB_TOKEN}\` or \`\${TRACKER_TOKEN}\` and each engineer (or the CI job) supplies the value from their own environment. The repo holds the shape; people hold the credentials.

When a session starts, the client connects to every configured server and **discovers their tools at connection time**. Tools from all servers, project and user level alike, are then **available simultaneously**, alongside built-in tools; there is no switching between servers. In Claude Code they appear with server-prefixed names like \`mcp__tracker__search_issues\`. That means descriptions from different servers compete: if two servers both offer a vague "search", the agent can misroute.

Not everything should be a tool. **MCP resources** expose content by URI for reading: a list of issue summaries, a documentation hierarchy, a database schema. Exposing such a **content catalog** as a resource gives the agent visibility into what exists without a series of exploratory tool calls ("list tables", "search docs for X", "search again").

For the server itself, prefer an existing **community or vendor server** for standard integrations (Jira, GitHub, a common database): less code, maintained upstream. Reserve a **custom server** for team-specific workflows, policy checks, or trimmed outputs that no generic server offers.

Finally, agents in Claude Code also have built-in tools. If an MCP tool's description is thin, the agent prefers what it knows: it will Grep the local checkout instead of calling a code-search MCP tool that indexes every repository, or \`curl\` an API instead of the MCP wrapper. Descriptions that **explain capabilities and outputs in detail** (what it covers that Grep cannot, what each result contains, auth already handled) steer it to the more capable MCP tool.

### Terminology

- **.mcp.json**: project-scope server config, committed.
- **~/.claude.json**: user-level config for personal/experimental servers.
- **Expansion**: \`\${VAR}\` filled from the environment at load time.
- **Resource**: URI-addressed content a server exposes for reading, such as a catalog.`,
    example: {
      intro: 'A platform team shares GitHub, issue-tracker, and wiki servers through the repo; one engineer adds a personal notes server only for themselves. All values in angle brackets are placeholders, and no file holds a credential.',
      artifacts: [
        {
          lang: 'json',
          caption: '.mcp.json (committed at the repo root)',
          code: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "<community-github-mcp-package>"],
      "env": { "GITHUB_TOKEN": "\${GITHUB_TOKEN}" }
    },
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
          caption: 'Tool descriptions that steer the agent away from Bash and Grep',
          code: `mcp__opsdb__query_replica
"Run a read-only SQL query against the operations database READ REPLICA.
Credentials and connection are handled by the server; do not use psql or Bash
for this database. Results are capped at 500 rows and include column types.
Read the schema://opsdb/tables resource first if you do not know the schema. Writes are rejected."

mcp__codesearch__find_symbol_usages
"Find every usage of a function, class, or constant across ALL 140 company
repositories (not just this checkout), using a semantic index that resolves
imports, re-exports, and aliases. Returns repo, file, line, and usage kind
(call, import, re-export). Prefer this over Grep for 'who calls X' questions;
use Grep for free-text strings such as log messages in the current repo."`,
        },
        {
          lang: 'text',
          caption: 'Resources the wiki and ops servers expose (read without a tool call)',
          code: `wiki://spaces                      -> list of spaces with owners and descriptions
wiki://spaces/platform/tree        -> page hierarchy of the platform space
schema://opsdb/tables              -> tables, columns, and types of the replica
tracker://projects/HARBOR/open     -> one-line summaries of open issues`,
        },
      ],
      walkthrough: `The **.mcp.json** file is safe to commit: the token values are \`\${TRACKER_TOKEN}\` and \`\${WIKI_TOKEN}\`, expanded from each engineer's environment. The wiki URL uses a default (\`\${VAR:-default}\`) so most people need not set it. A new engineer clones the repo, sets two environment variables, approves the project servers when prompted, and has the same tools as everyone else.

The GitHub entry uses an existing community server, because GitHub access is a standard integration; the team only writes custom servers for its own workflows. Its token is \`\${GITHUB_TOKEN}\`, expanded from each engineer's environment like the others.

The **personal notes server** is added with \`--scope user\`, so it lands in that engineer's \`~/.claude.json\`, never touches the repo, and follows them across projects. The ops database server is added with \`--scope project\`, which writes it into \`.mcp.json\` for the team.

When a session starts, every server is connected and its tools discovered, so the agent sees \`mcp__github__*\`, \`mcp__tracker__*\`, \`mcp__wiki__*\`, \`mcp__opsdb__*\`, and the personal \`mcp__notes__*\` tools at once, alongside Read, Grep, and Bash. Without guidance, an agent asked "how many shipments failed yesterday?" might try \`psql\` in Bash, and one asked "who calls \`computeRate\`?" will Grep the local checkout and miss the other repositories. The rewritten descriptions state what each MCP tool covers that the built-in tool cannot, and what it returns, which gives the model a clear reason to prefer it. The resources let the agent read the list of wiki spaces, the schema, or open issue summaries once instead of discovering them through repeated searches.`,
    },
    compare: {
      question: 'The team needs the agent to work with the issue tracker. Use an existing community server or build a custom one?',
      a: {
        title: 'Existing community or vendor server',
        body: 'Configure a maintained server for the tracker in `.mcp.json`. Setup is fast, it covers standard operations, and someone else maintains it as the tracker API changes.',
        chooseWhen: 'The need is a standard integration (e.g. Jira or GitHub issues and search) and the existing tools and outputs are acceptable as-is.',
      },
      b: {
        title: 'Custom MCP server',
        body: 'Write a small server exposing purpose-specific tools (e.g. `find_related_incidents`) that apply company conventions, enforce policy, and return trimmed, relevant fields.',
        chooseWhen: 'You need company-specific workflows, policy enforcement, or output shaping that a generic server does not offer.',
      },
      decidingDetail: `The deciding detail is **whether the requirement is standard or company-specific**. Standard access to a common system is best served by a maintained existing server: less code, fewer bugs, updates handled upstream. When the agent needs custom semantics (internal conventions, policy checks, trimmed outputs to save context), a custom server, possibly wrapping the same API, is worth the maintenance.`,
    },
    mistake: {
      mistake: 'Putting a team-wide server in each engineer\'s ~/.claude.json, or committing a .mcp.json with a literal token pasted in.',
      whyTempting: 'Running `claude mcp add` with the default scope works immediately on your machine, and pasting the token in makes the file "just work" for whoever clones it.',
      howToRecognize: 'New engineers report missing tools and setup steps live in a wiki page; configs drift between machines; or a committed config file contains a credential value instead of a ${VAR} placeholder.',
      fix: 'Define shared servers in project-scope .mcp.json, committed, with every credential as a ${VAR} placeholder (e.g. ${GITHUB_TOKEN}) supplied from each person\'s environment. Keep personal and experimental servers in user-level ~/.claude.json. If a real credential was ever committed, rotate it, since removing it from the file does not remove it from history.',
    },
    exercise: {
      prompt: 'Pick the best configuration or design action for each situation on a team sharing one repository.',
      inputs: `\`\`\`text
Team repo: harbor-platform (20 engineers)
Servers in use: tracker (team), wiki (team), opsdb read-replica (team), personal notes (one engineer)
Observed: agent runs "curl https://tracker.example.internal/api/..." in Bash instead of using mcp__tracker__search_issues
Observed: agent calls wiki search 15 times to discover which spaces exist
Observed: agent answers "who calls computeRate?" with Grep on this checkout, ignoring the cross-repo code-search MCP tool
\`\`\``,
      labels: ['Project .mcp.json', 'User ~/.claude.json', 'Expose as resource', 'Rewrite tool description'],
      items: [
        { id: 'e1', text: 'The issue-tracker server every engineer should have with identical config.', answer: 'Project .mcp.json', why: 'Team-shared, versioned config belongs in the committed .mcp.json, with the token as a ${VAR} placeholder.' },
        { id: 'e2', text: 'One engineer\'s personal notes server they want in every project they open.', answer: 'User ~/.claude.json', why: 'Personal and cross-project: user-level config keeps it out of the repo and available everywhere for that person.' },
        { id: 'e3', text: 'An engineer trying an experimental server whose interface changes daily, without affecting teammates.', answer: 'User ~/.claude.json', why: 'Experimental servers belong in personal configuration; nothing is committed and teammates are unaffected. (Claude Code\'s local scope, also in ~/.claude.json, narrows it to one project.)' },
        { id: 'e4', text: 'The agent makes many wiki searches just to learn which spaces and page trees exist.', answer: 'Expose as resource', why: 'A catalog of spaces is reference content; exposing it as a resource lets the agent read the list once.' },
        { id: 'e5', text: 'The agent uses curl against the tracker API in Bash instead of the tracker MCP tool.', answer: 'Rewrite tool description', why: 'The MCP tool\'s description should state its advantages (auth handled, filtered results) and that it is the way to access the tracker.' },
        { id: 'e6', text: 'The agent uses Grep on the local checkout for cross-repository caller questions.', answer: 'Rewrite tool description', why: 'Describe what the code-search tool covers (all repositories, resolved aliases) and what it returns, and when to prefer it over Grep.' },
      ],
      solution: `Scope follows audience: **team and versioned → project .mcp.json** (secrets as \${VAR}); **personal or experimental → user ~/.claude.json**. Catalog-style content the agent needs to browse is a good **resource**. When the agent bypasses an MCP tool through Bash or Grep, first fix the **description** so the tool's capabilities and outputs are explicit; permissions that block the Bash route are a stronger, complementary control.`,
    },
    check: [
      {
        id: 'c1',
        id: 'c1',
        stem: 'A team wants every engineer to get the same database MCP server without anyone committing credentials. What should they do?',
        options: [
          { id: 'a', text: 'Have each engineer add it at user scope with claude mcp add, from a wiki page' },
          { id: 'b', text: 'Commit .mcp.json with the server and the password written as ${DB_PASSWORD}' },
          { id: 'c', text: 'Commit .mcp.json with the real password, since only the team can see the repo' },
          { id: 'd', text: 'Put the server name and connection details in the shared system prompt' },
        ],
        correct: 'b',
        why: 'Project scope shares and versions the config; ${VAR} expansion lets each engineer supply credentials from their environment so none land in the repo. User-scope setup avoids committed secrets but is not shared, so configurations drift.',
      },
      {
        id: 'c2',
        id: 'c2',
        stem: 'Claude Code has three MCP servers configured. Which tools can the agent use in a session?',
        options: [
          { id: 'a', text: 'Only the tools from whichever server is listed first in the configuration' },
          { id: 'b', text: 'Only tools from project-scoped servers; user-scoped ones need enabling' },
          { id: 'c', text: 'Tools from one server at a time, switched with a command during the session' },
          { id: 'd', text: 'Tools from all connected servers at once, alongside the built-in tools' },
        ],
        correct: 'd',
        why: 'Tools from every configured server, in any scope, are discovered when the client connects and are available together (subject to permissions), which is why clear names and descriptions across servers matter.',
      },
      {
        id: 'c3',
        id: 'c3',
        stem: 'The agent keeps using Bash and curl against an internal API even though an MCP server wraps it. What is the most direct first fix?',
        options: [
          { id: 'a', text: 'Rewrite the MCP tool descriptions to say what they cover and when to prefer them' },
          { id: 'b', text: 'Remove the MCP server and document the equivalent curl commands in CLAUDE.md instead' },
          { id: 'c', text: 'Move the MCP server from project scope to user scope so that it loads earlier' },
          { id: 'd', text: 'Expose the internal API as an MCP resource that the agent can read for context' },
        ],
        correct: 'a',
        why: 'Tool choice is driven by descriptions; one that explains coverage, auth handling, and "use this instead of curl" steers selection. Scope does not affect preference, and a resource exposes content to read, not the actions the agent is performing with curl.',
      },
    ],
    review: [
      { front: 'Project vs. user MCP configuration', back: 'Project: .mcp.json in the repo, committed, shared team tooling. User: ~/.claude.json, personal or experimental servers, all your projects, never shared.' },
      { front: 'How do you keep secrets out of .mcp.json?', back: 'Use ${VAR} placeholders such as ${GITHUB_TOKEN}; each person or CI job supplies values from its own environment.' },
      { front: 'Tool or resource?', back: 'Tools perform actions or queries with inputs. Resources expose readable content by URI, good for catalogs (issue summaries, doc hierarchies, schemas) that save exploratory tool calls.' },
      { front: 'Community server or custom server?', back: 'Community/existing server for standard integrations such as Jira; custom server only for team-specific workflows.' },
    ],
    sources: ['guide-d2', 'cc-mcp', 'mcp-intro', 'sdk-mcp'],
    notes: [
      { date: '2026-11-21', text: 'The exam guide v1.1 confirms the model taught here: project-level .mcp.json for shared tooling, user-level ~/.claude.json for personal/experimental servers, ${VAR} expansion for credentials, simultaneous tools from all servers, and resources for content catalogs. Current Claude Code also has a local scope (stored in ~/.claude.json per project) and its scope names and the default scope for `claude mcp add` have changed between releases; check `claude mcp add --help` for product work.' },
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
      'Given a code-navigation or editing task in Claude Code, pick the built-in tool for each step, explore incrementally from Grep hits instead of reading whole directories, trace usage through wrapper modules, and fall back to Read + Write when an Edit anchor is not unique.',
    minutes: 25,
    terms: [
      { term: 'Grep', definition: 'Built-in tool that searches file contents with a regular expression and returns matching files or lines.' },
      { term: 'Glob', definition: 'Built-in tool that finds files whose paths match a pattern such as `src/**/*.test.ts`. It does not look inside files.' },
      { term: 'Edit anchor', definition: 'The exact `old_string` text Edit replaces. It must match the file exactly and occur once, or the edit fails.' },
      { term: 'Incremental exploration', definition: 'Finding entry points with search, reading only the relevant files or ranges, then following imports and call sites step by step.' },
    ],
    learningPoints: [
      'Select Grep to search file contents (callers of a function, error messages, import statements) and Glob to find files by name or extension pattern (e.g. **/*.test.tsx).',
      'Use Read and Write for whole-file operations and Edit for targeted changes anchored on unique text.',
      'When Edit fails because its anchor text is not unique, Read the full file and Write the modified contents as a reliable fallback.',
      'Build understanding incrementally: Grep for entry points, then Read to follow imports and trace flows, instead of reading every file up front.',
      'Trace a function through wrapper modules by first listing every name the wrapper exports, then searching the codebase for each name.',
      'Recognize when Bash is the right tool (builds, tests, git) and when a dedicated tool is better.',
    ],
    concept: `Claude Code gives the agent a small set of built-in tools, each with a job. Choosing the right one keeps context small and actions safe.

- **Grep** searches **inside** files for a pattern: every caller of \`calculateTax\`, where an error message like "card declined" is raised, which files import \`@acme/http\`.
- **Glob** finds files by **path pattern**: "which files match \`**/*.test.tsx\` or \`**/*.controller.ts\`?" It never reads contents.
- **Read** loads a file's full contents (optionally a line range for large files); **Write** creates a file or replaces all of its contents. Together they are the whole-file operations.
- **Edit** makes a targeted change: it replaces one exact, **unique** string with another and leaves the rest of the file alone.
- **Bash** runs commands: tests, builds, git, package managers.

A common confusion is Grep vs. Glob. If the question is about *what code says*, use Grep. If it is about *file names or locations*, use Glob.

**Explore incrementally.** In a large repo, reading every file in a directory fills the context with noise and pushes out what matters. Instead: Grep for an entry point (a route string, an error message, a function name), Read the file that contains it, note what it imports or calls, and Grep or Read the next hop. Each step is chosen from what you just learned.

**Follow wrappers.** Codebases often wrap functions: \`legacyClient.charge\` is re-exported from \`payments/index.ts\` as \`refundPayment\`, wrapped again in \`billing/adapter.ts\` as \`creditCustomer\`, and callers only ever use the new names. Grepping only the original name misses them. The reliable method is to **first identify every name the wrapper module exports** (Read its export list), then **Grep for each of those names** across the codebase, and repeat for any further wrapper you find.

**Edit needs a unique anchor.** Edit matches \`old_string\` exactly, whitespace included, and fails if the text is not found or appears more than once. The agent must have Read the file in the session first. When Edit fails because the text is **not unique** (two identical \`return null;\` lines), the reliable fallback is **Read + Write**: Read the full current file, make the one change in the full contents, and Write the whole file back. Reading first matters: writing from memory or a stale copy silently drops other people's changes. If a short distinctive neighbour (a function signature) obviously makes the anchor unique, extending the anchor and retrying Edit is a lighter alternative; when it does not, or a retry still matches twice, use Read + Write rather than guessing.

**Bash** is for actions without a dedicated tool. Using \`cat\`, \`find\`, or \`grep\` through Bash works but bypasses the purpose-built tools, which are typically easier to permission and produce more manageable output.

### Terminology

- **Content search**: Grep.
- **Path matching**: Glob.
- **Anchor**: Edit's unique \`old_string\`.
- **Read + Write fallback**: reload the whole file, then write the full modified contents.
- **Entry point**: the first relevant hit you expand from.`,
    example: {
      intro: 'An engineer asks: "Which code paths can trigger a refund without an approval check?" The trace below shows incremental exploration through wrapper modules, then an Edit that fails on a non-unique anchor and the Read + Write fallback.',
      artifacts: [
        {
          lang: 'text',
          caption: 'Tool trace (abridged)',
          code: `1  Grep  pattern="issueRefund"  output=files
   -> src/payments/refunds.ts, src/payments/index.ts, src/billing/adapter.ts

2  Read  src/payments/index.ts          (wrapper: list everything it exports)
   -> export { issueRefund as refundPayment } from './refunds';
   -> export { issueRefund as legacyRefund } from './refunds';   // deprecated alias

3  Grep  pattern="refundPayment|legacyRefund|issueRefund"  path=src  output=content
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
          caption: 'Edit fails on a non-unique anchor; Read + Write fallback',
          code: `Edit  file=src/jobs/reconcile.ts
      old_string="    await creditCustomer(row.customer, row.delta);"
-> Error: old_string matches 2 locations. Provide more context or set replace_all.

Read  src/jobs/reconcile.ts               (full file, 96 lines, current version)
-> line 57 is inside applyNegativeDelta(); line 71 is inside applyManualAdjustment()

Write file=src/jobs/reconcile.ts
      content=<the 96 lines just read, with one added line before line 57:
               "    await requireApproval(row.customer, row.delta);">
-> OK

Bash  git diff --stat src/jobs/reconcile.ts
-> 1 file changed, 1 insertion(+)`,
        },
      ],
      walkthrough: `Step 1 uses **Grep** because the question is about code content. Instead of reading all three hits, step 2 **Reads** only the index file to list **every name it exports**: two aliases (\`refundPayment\`, \`legacyRefund\`). Step 3 searches for each exported name and finds a second wrapper, \`creditCustomer\`, in the billing adapter. Step 4 follows that wrapper to two more callers that a search for \`issueRefund\` alone would never have found. Step 5 Reads just the relevant range of \`reconcile.ts\`. Step 6 uses **Glob**, because now the question is about file paths: does a test file exist?

The first **Edit** fails because the same line appears in two functions. The agent does not guess: it **Reads the full, current file**, applies the single insertion to those contents, and **Writes** the whole file back, then checks with \`git diff\` that exactly one line changed. Using \`replace_all\` would have changed both call sites, which is wrong here because only one path lacked approval. Because the function signature \`applyNegativeDelta(row: ReconRow)\` is unique, extending the Edit anchor to include it would also have worked; Read + Write is the fallback that works even when no such short unique context exists.

Notice what the agent did **not** do: read every file under \`src/payments\` and \`src/billing\`. Seven targeted calls answered the question.`,
    },
    compare: {
      question: 'An Edit fails because the anchor text appears several times. Fall back to Read + Write, or extend the anchor and retry Edit?',
      a: {
        title: 'Read + Write fallback',
        body: 'Read the full current file, apply the change to those contents, and Write the whole file back; then check the diff touches only what you intended.',
        chooseWhen: 'The duplicated text has no short distinctive neighbour, an extended anchor still matched more than once, or most of the file is changing anyway.',
      },
      b: {
        title: 'Extend the anchor and retry Edit',
        body: 'Include distinctive neighbouring text (a unique function signature or comment) in `old_string` so it matches exactly once.',
        chooseWhen: 'A short, obviously unique line sits right next to the target, so one retry will match exactly once.',
      },
      decidingDetail: `The deciding detail is **whether a short unique anchor exists**. Read + Write is the reliable fallback when Edit fails on non-unique text: it works no matter how repetitive the file is, as long as the Write is built from a fresh Read rather than from memory. A one-line anchor extension is a lighter option only when a unique neighbour is obvious. Use replace_all only when every occurrence really should change.`,
    },
    mistake: {
      mistake: 'Starting exploration by reading every file in the relevant directories (or running `cat` over them in Bash) before searching for anything.',
      whyTempting: 'Reading everything feels thorough and avoids the risk of missing something; with a large context window it seems affordable.',
      howToRecognize: 'Dozens of Read calls before the first Grep; context fills with unrelated code; the agent loses earlier details, needs compaction, or answers from the first match without following wrappers.',
      fix: 'Grep for a concrete entry point (name, route, error string), Read only the files or line ranges that matter, then follow imports, re-exports, and call sites one hop at a time; at a wrapper module, list all its exported names and Grep for each. Use Glob when you need files by name, and delegate very broad discovery to an exploration subagent so the main context stays clean.',
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
        id: 'c1',
        stem: 'You need every test file under `src/` whose name ends in `.spec.ts`. Which tool fits?',
        options: [
          { id: 'a', text: 'Grep for "spec" across all files under `src/`' },
          { id: 'b', text: 'Glob with the pattern `src/**/*.spec.ts`' },
          { id: 'c', text: 'Read the `src` directory and scan the listing' },
          { id: 'd', text: 'Read each folder under `src/` one at a time' },
        ],
        correct: 'b',
        why: 'The requirement is about file names, so a path pattern is the precise tool. Grep searches contents and would match any file whose contents mention "spec", whatever its name. Reading directories one by one works but is slow and error-prone.',
      },
      {
        id: 'c2',
        id: 'c2',
        stem: 'Edit fails with "old_string matches 3 locations." You want to change only one of them. What should you do?',
        options: [
          { id: 'a', text: 'Retry the same Edit a few times; the match may resolve once the file is saved' },
          { id: 'b', text: 'Set replace_all to true so the Edit applies without the uniqueness error' },
          { id: 'c', text: 'Read the whole file, then Write it back with only that occurrence changed' },
          { id: 'd', text: 'Use Bash with sed to replace the first match and leave the others alone' },
        ],
        correct: 'c',
        why: 'Read + Write is the reliable fallback when Edit cannot find a unique anchor: the fresh Read keeps everything else intact and the Write applies exactly one change. replace_all would change all three, and sed on the first match may hit the wrong one.',
      },
      {
        id: 'c3',
        id: 'c3',
        stem: 'Grep for `sendInvoice` finds only its definition, yet invoices are clearly sent from several places. What is the most likely explanation and next step?',
        options: [
          { id: 'a', text: 'It is called via a wrapper under another name; search each exported name' },
          { id: 'b', text: 'Grep missed the callers; read every file in the repository to find them' },
          { id: 'c', text: 'The callers are in compiled or binary files; switch to Glob to find them' },
          { id: 'd', text: 'The function is defined but never used; delete it and see what tests break' },
        ],
        correct: 'a',
        why: 'Wrapper and re-export modules rename functions, so callers use other names. Listing the exported aliases and grepping for each finds the real usage; reading every file is slow and unnecessary when Grep worked correctly.',
      },
    ],
    review: [
      { front: 'Grep vs. Glob', back: 'Grep searches inside files for content. Glob matches file paths by pattern and never reads contents.' },
      { front: 'Edit anchor rules', back: 'old_string must match exactly (including whitespace) and be unique, and the file must have been read first. If it is not unique, fall back to Read the full file + Write it back (or extend the anchor if a unique neighbour is obvious); replace_all only when every occurrence should change.' },
      { front: 'Incremental exploration loop', back: 'Grep an entry point, Read only what matters, follow imports and call sites, repeat. At a wrapper, list all exported names and Grep each. Do not read everything up front.' },
    ],
    sources: ['guide-d2', 'cc-tools', 'cc-workflows', 'cc-best-practices'],
    notes: [
      { date: '2026-11-21', text: 'The exam guide v1.1 confirms the selection rules taught here (Grep for content, Glob for paths, Edit for unique-text changes, Read + Write as the fallback when Edit\'s text is not unique). Product details remain version-sensitive: Edit\'s replace_all option, the requirement to Read a file before editing it, Grep options (output modes, file filters), Glob result ordering, and exact error wording may differ across Claude Code releases. The error text in the example is illustrative.' },
    ],
  },
];
