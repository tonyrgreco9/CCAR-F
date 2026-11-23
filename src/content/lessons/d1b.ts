import type { Lesson } from '../types';

// Domain 1, task statements 1.5–1.7. Original, app-authored lessons.
// Learning points are aligned with the Knowledge/Skills bullets of the official exam guide v1.1
// (read 2026-11-21), in this app's own words. See src/content/coverage/d1.ts.

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------
  // 1.5 Agent SDK hooks
  // ---------------------------------------------------------------------------
  {
    id: '1.5',
    title: 'Hooks for tool interception and data normalization',
    outcome:
      'Given a tool-using agent and a rule or data problem, decide whether it belongs in a PreToolUse hook, a PostToolUse hook, or the prompt, and sketch the hook that enforces or fixes it.',
    minutes: 25,
    terms: [
      {
        term: 'Hook',
        definition:
          'Your own code that the Agent SDK runs at a fixed point in the agent loop (for example just before or just after a tool call). It runs every time its matcher fires, regardless of what the model decides.',
      },
      {
        term: 'PreToolUse hook',
        definition:
          'Runs after the model has requested a tool call but before the tool executes. It can allow the call, deny it with a reason the model sees, or (in current SDKs) rewrite the tool input.',
      },
      {
        term: 'PostToolUse hook',
        definition:
          'Runs after a tool returns and before the result is added to the conversation. Used to normalize formats, trim verbose payloads, redact fields, or add context for the model.',
      },
      {
        term: 'Matcher',
        definition:
          'The pattern that decides which tool names a hook applies to, e.g. a single MCP tool name such as mcp__billing__issue_refund or a pattern covering several tools.',
      },
      {
        term: 'Deterministic enforcement',
        definition:
          'A guarantee implemented in code that holds on every call. Contrast with prompt instructions, which the model follows with high but not perfect reliability.',
      },
    ],
    learningPoints: [
      'Explain how a PostToolUse hook intercepts a tool result and transforms it before the model processes it.',
      'Explain how a hook on outgoing tool calls (PreToolUse) enforces compliance rules, such as blocking refunds above a threshold.',
      'Contrast hooks, which give deterministic guarantees, with prompt instructions, which give probabilistic compliance.',
      'Write a PostToolUse hook that normalizes heterogeneous formats from different MCP tools (Unix timestamps, ISO 8601, numeric status codes) into one consistent shape.',
      'Write a call-interception hook that blocks a policy-violating action (for example a refund over the limit) and redirects the agent to an alternative workflow such as human escalation.',
      'Choose a hook over prompt-based enforcement whenever a business rule requires guaranteed compliance, and recognize when the prompt or a fix inside the tool is the better place.',
    ],
    concept: `Think of a hook as a checkpoint you own inside the agent loop. The model decides *which* tool to call and *with what arguments*, but before that call runs, and again after it returns, the SDK hands control to your code. Your code does not ask the model for permission or rely on it remembering an instruction. It simply runs, every time.

That gives you two practical jobs.

**Gatekeeping before a tool runs.** A support agent may be told "never refund more than $150" (the threshold is a business choice; $500 is just as common). Most of the time it will comply. But "most of the time" is not a policy. A PreToolUse hook inspects the requested \`issue_refund\` call, sees \`amount: 240\`, and denies it. The denial reason goes back to the model as feedback, so you can redirect it: "Refunds over $150 need a human; call \`escalate_to_human\` with a summary." The agent then takes the allowed path instead of stalling.

**Cleanup after a tool returns.** Real backends disagree with each other. One returns \`"created": 1763478000\` (Unix seconds), another returns \`"issued_on": "2025-11-03"\`, a third returns \`"status": 3\` where 3 means "refunded" only if you know the enum. If the model has to reconcile these, it can misread them, for example comparing a raw integer with a date. A PostToolUse hook converts everything to one shape (ISO 8601 UTC, readable status strings) and drops fields like debug blobs that only consume context.

### Terminology

- **PreToolUse**: fires before execution; can allow, deny with a reason, or modify the input.
- **PostToolUse**: fires after execution; can normalize, trim, redact, or annotate the result before the model sees it.
- **Matcher**: limits a hook to particular tool names.
- **Deterministic vs probabilistic**: hooks are deterministic code paths; prompt instructions are probabilistic guidance.

### When not to use a hook

Hooks are for rules you can state as code: a numeric limit, a required prior step, a field format. They are poor at judgment ("is this customer upset?"), and tone or style preferences belong in the prompt. If you own the tool, a format fix inside the tool may be simpler than a hook. Hooks shine when you cannot change the backend, when several tools disagree, or when the rule is a business guarantee that must hold no matter what the model reasons.

> Rule of thumb: if a violation would be an incident, enforce it in a hook. If a violation would be a style nit, put it in the prompt.`,
    example: {
      intro:
        'A billing support agent calls two MCP tools that come from different teams. `lookup_transaction` returns Unix seconds and numeric status codes; `lookup_invoice` returns ISO dates and string statuses. Company policy caps agent-issued refunds at $150 per case. The artifacts show the raw outputs, a Python hook module that fixes both problems, and what the model actually sees.',
      artifacts: [
        {
          lang: 'json',
          caption: 'Raw tool outputs (before hooks)',
          code: `// lookup_transaction
{
  "txn_id": "T-88412",
  "created": 1763478000,
  "status": 3,
  "amount_cents": 12999,
  "gateway_debug": { "route": "eu-2", "retries": 0, "raw_auth": "...4 KB..." }
}

// lookup_invoice
{
  "invoice_id": "INV-2025-1102",
  "issued_on": "2025-11-03",
  "status": "PAID",
  "total": "129.99"
}`,
        },
        {
          lang: 'python',
          caption: 'hooks.py: a PostToolUse normalizer and a PreToolUse refund gate (illustrative; verify field names against current SDK docs)',
          code: `import json
from datetime import datetime, timezone
from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

TXN_STATUS = {1: "pending", 2: "settled", 3: "refunded", 4: "failed"}
REFUND_CAP = 150.00
refunded_so_far: dict[str, float] = {}   # session_id -> dollars refunded

def _payload(tool_response):
    # MCP results arrive as content blocks; this tool returns one JSON text block.
    return json.loads(tool_response["content"][0]["text"])

async def normalize_billing(input_data, tool_use_id, context):
    raw = _payload(input_data["tool_response"])
    if input_data["tool_name"].endswith("lookup_transaction"):
        clean = {
            "txn_id": raw["txn_id"],
            "created_at": datetime.fromtimestamp(raw["created"], tz=timezone.utc).isoformat(),
            "status": TXN_STATUS.get(raw["status"], f"unknown({raw['status']})"),
            "amount": round(raw["amount_cents"] / 100, 2),
        }                                   # gateway_debug dropped on purpose
    else:  # lookup_invoice
        clean = {
            "invoice_id": raw["invoice_id"],
            "issued_at": raw["issued_on"] + "T00:00:00+00:00",
            "status": raw["status"].lower(),
            "amount": float(raw["total"]),
        }
    return {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "updatedMCPToolOutput": {"content": [{"type": "text", "text": json.dumps(clean)}]},
        }
    }

async def refund_gate(input_data, tool_use_id, context):
    sid = input_data["session_id"]
    amount = float(input_data["tool_input"]["amount"])
    total = refunded_so_far.get(sid, 0.0) + amount
    if total > REFUND_CAP:
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    f"Blocked: this would bring refunds for this case to {total:.2f} USD, "
                    f"above the {REFUND_CAP:.0f} USD agent limit. Do not retry or split the refund. "
                    "Call escalate_to_human with the customer ID, invoice, amount, and reason."
                ),
            }
        }
    refunded_so_far[sid] = total   # simplification: production code records this after success
    return {}

options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [HookMatcher(matcher="mcp__billing__issue_refund", hooks=[refund_gate])],
        "PostToolUse": [HookMatcher(matcher="mcp__billing__lookup_(transaction|invoice)",
                                    hooks=[normalize_billing])],
    },
)`,
        },
        {
          lang: 'text',
          caption: 'What the model sees after the hooks run',
          code: `tool_result (lookup_transaction):
{"txn_id": "T-88412", "created_at": "2025-11-18T15:00:00+00:00", "status": "refunded", "amount": 129.99}

tool_result (lookup_invoice):
{"invoice_id": "INV-2025-1102", "issued_at": "2025-11-03T00:00:00+00:00", "status": "paid", "amount": 129.99}

assistant -> issue_refund {"invoice_id": "INV-2025-1102", "amount": 240}
hook denies: "Blocked: this would bring refunds for this case to 240.00 USD, above the 150 USD agent limit ..."
assistant -> escalate_to_human {"customer_id": "C-5521", "summary": "Requests 240 USD refund ..."}`,
        },
      ],
      walkthrough: `1. **The raw data is a trap.** \`created: 1763478000\` and \`issued_on: "2025-11-03"\` describe dates in two encodings, and \`status: 3\` means nothing without the enum. A model can guess, and guesses are exactly what you do not want in a refund decision.
2. **The PostToolUse hook normalizes once, centrally.** Both tools now report ISO 8601 UTC timestamps, lowercase status words, and dollar amounts as numbers. The 4 KB \`gateway_debug\` blob is dropped, so it never takes up context in this turn or any later one.
3. **The PreToolUse hook enforces the cap in code.** It tracks the per-case running total, so splitting a $240 refund into two $120 calls is also caught; a single-call check would miss that.
4. **The denial redirects instead of dead-ending.** The reason string tells the model what to do next (escalate, do not retry or split). The trace shows the agent calling \`escalate_to_human\` on its next step.
5. **The prompt still matters.** The system prompt should still explain the refund policy so the agent rarely hits the gate. The hook is the guarantee; the prompt keeps the conversation smooth.`,
    },
    compare: {
      question: 'How should the $150 refund cap be enforced for the support agent?',
      a: {
        title: 'Prompt instruction only',
        body: 'State the cap clearly in the system prompt, with a few examples of escalating instead of refunding. No code checks the `issue_refund` arguments.',
        chooseWhen:
          'The rule is a soft preference where an occasional miss is cheap and easily corrected, or there is no code path where you can intercept the action.',
      },
      b: {
        title: 'PreToolUse hook plus prompt guidance',
        body: 'Keep the policy in the prompt so the agent usually plans correctly, and add a PreToolUse hook on `issue_refund` that denies any call taking the case total over $150 and tells the agent to escalate.',
        chooseWhen:
          'A single violation causes real harm (money, compliance, security) and the rule can be checked from the tool input and session state.',
      },
      decidingDetail:
        'The deciding detail is the **cost of a single violation**. A wrongful refund is a measured failure with real money attached, and prompt compliance is probabilistic, so a hook is required. For a tone or formatting preference, a miss costs little and the prompt alone is appropriate.',
    },
    mistake: {
      mistake:
        'Putting "never issue refunds above $150; escalate instead" in the system prompt, testing a dozen conversations, and treating the cap as enforced.',
      whyTempting:
        'The model follows the instruction in nearly every test, prompts are quick to change, and adding hook code feels like extra machinery for something that already works.',
      howToRecognize:
        'Look for a business rule with a number, a prerequisite, or a legal consequence that exists only as prose. Warning signs: rare incidents after long conversations, after a customer pushes hard, or when the agent splits one large action into several small ones.',
      fix:
        'Implement the rule as a PreToolUse hook on the relevant tool, track any cumulative state the rule depends on, return a denial reason that points to the allowed alternative, and keep the prompt text so the agent plans correctly most of the time.',
    },
    exercise: {
      prompt:
        'For each requirement from the Lumen Mobile support team, choose where it should live. Assume you cannot change the backend services.',
      inputs: `Tools: \`get_customer\`, \`lookup_invoice\`, \`lookup_transaction\`, \`issue_refund\`, \`change_plan\`, \`apply_credit\`, \`escalate_to_human\`.

Observed tool outputs:

\`\`\`json
{"created": 1763478000, "status": 3}
{"issued_on": "2025-11-03", "status": "PAID"}
{"orders": ["...200 line items..."], "audit": {"...": "..."}}
\`\`\``,
      labels: ['PreToolUse hook', 'PostToolUse hook', 'Prompt instruction'],
      items: [
        {
          id: 'e1',
          text: 'The agent sometimes miscalculates whether a transaction falls inside the 30-day refund window because one tool returns Unix seconds and another returns ISO dates.',
          answer: 'PostToolUse hook',
          why: 'This is a data-format problem in tool results. Normalizing both outputs to ISO 8601 UTC before the model sees them removes the ambiguity for every call.',
        },
        {
          id: 'e2',
          text: '`change_plan` must never run unless `get_customer` has returned `verified: true` earlier in the same session.',
          answer: 'PreToolUse hook',
          why: 'A hard prerequisite on an account change. A hook can check session state and deny the call with a reason that tells the agent to verify identity first.',
        },
        {
          id: 'e3',
          text: 'The agent should address customers by first name and keep replies under four sentences.',
          answer: 'Prompt instruction',
          why: 'A style preference. An occasional miss is harmless, and no tool call is involved to intercept.',
        },
        {
          id: 'e4',
          text: 'The order-history tool returns about 40 KB per call, including 200 line items and internal audit fields, but the agent only needs the last three order totals and dates.',
          answer: 'PostToolUse hook',
          why: 'Trimming the result to the fields the agent uses keeps the context window lean on every call, and the backend cannot be changed.',
        },
        {
          id: 'e5',
          text: 'Any `apply_credit` call that would take the case total above $150 must instead go to a human.',
          answer: 'PreToolUse hook',
          why: 'A monetary cap with real cost per violation. Deny the call deterministically and redirect to `escalate_to_human`.',
        },
      ],
      solution: `Data-shape problems in what tools **return** (e1, e4) are PostToolUse jobs: fix them once, centrally, before the model reasons over them. Rules about what the agent may **do** that must hold every time (e2, e5) are PreToolUse jobs. Preferences where a miss is cheap (e3) stay in the prompt. Note that e2 and e5 still benefit from prompt guidance, so the agent rarely triggers the gate, but the guarantee comes from the hook.`,
    },
    check: [
      {
        id: 'k1',
        id: 'k1',
        stem: 'A support agent occasionally issues refunds above the $150 policy limit even though the limit is stated in its system prompt. What change gives a guarantee that the limit holds?',
        options: [
          { id: 'a', text: 'Repeat the limit in bold at the start and end of the system prompt, with an example.' },
          { id: 'b', text: 'Add a PostToolUse hook that reverses refunds above the limit after they are issued.' },
          { id: 'c', text: 'Lower the model temperature so it follows the stated limit more consistently.' },
          { id: 'd', text: 'Add a PreToolUse hook that denies over-limit refund calls and says to escalate.' },
        ],
        correct: 'd',
        why: 'Only code that runs before the tool executes can guarantee the refund never happens. A PostToolUse hook is also code, but it runs after the money has already moved, and prompt changes or temperature leave compliance probabilistic.',
      },
      {
        id: 'k2',
        id: 'k2',
        stem: 'One tool returns `"ts": 1763478000` and another returns `"date": "2025-11-18"`. The agent compares them to decide eligibility. Neither backend can be changed or accepts a format option. Where is the most reliable place to fix this?',
        options: [
          { id: 'a', text: 'A PostToolUse hook that converts both values to ISO 8601 UTC before the model sees them.' },
          { id: 'b', text: 'A system prompt note explaining that some timestamps are Unix seconds and how to convert.' },
          { id: 'c', text: 'A PreToolUse hook that rewrites the tool inputs to ask each backend for ISO 8601 dates.' },
          { id: 'd', text: 'A dedicated subagent that the agent calls to convert each date before comparing them.' },
        ],
        correct: 'a',
        why: 'The inconsistency is in the outputs, so normalize the outputs. A PostToolUse hook does it deterministically on every call. A PreToolUse hook cannot help because neither backend accepts a format option, and a prompt note still relies on the model converting correctly.',
      },
      {
        id: 'k3',
        stem: 'Which requirement is the weakest candidate for a hook?',
        options: [
          { id: 'a', text: 'Block `delete_account` unless a verified-identity flag is set for the session.' },
          { id: 'b', text: 'Strip internal audit fields from the order-history tool result.' },
          { id: 'c', text: 'Respond in a warmer tone when the customer seems frustrated.' },
          { id: 'd', text: 'Map numeric status codes to readable labels in transaction results.' },
        ],
        correct: 'c',
        why: 'Tone is a judgment about language with no tool call to intercept and little cost per miss, so it belongs in the prompt. The other three are mechanical checks or transformations that code performs reliably.',
      },
    ],
    review: [
      {
        front: 'PreToolUse vs PostToolUse: which one stops an action, and which one fixes data?',
        back: 'PreToolUse runs before the tool executes, so it can allow, deny (with a reason), or modify the call. PostToolUse runs after the tool returns, so it normalizes, trims, or redacts the result before the model sees it.',
      },
      {
        front: 'Why is a prompt instruction not enough for a refund cap?',
        back: 'Prompt compliance is probabilistic. A rule whose single violation causes real harm needs deterministic enforcement in code, such as a PreToolUse hook. Keep the prompt text too, so the agent usually plans correctly.',
      },
      {
        front: 'What should a PreToolUse denial reason contain?',
        back: 'Why the call was blocked and what to do instead (for example, call escalate_to_human with a summary, and do not retry or split the action). Otherwise the agent may retry or stall.',
      },
    ],
    sources: ['guide-d1', 'sdk-hooks', 'cc-hooks', 'eng-writing-tools', 'eng-context', 'app-authored'],
    notes: [
      {
        date: '2026-11-21',
        text: 'The exam guide confirms both patterns taught here (PostToolUse transformation of tool results, and interception hooks that block policy-violating calls). Hook field names are version-sensitive. The example uses `hookSpecificOutput` with `permissionDecision` / `permissionDecisionReason` for PreToolUse and `updatedMCPToolOutput` for replacing an MCP tool result in PostToolUse, plus `HookMatcher` in the Python SDK. Whether a PostToolUse hook can replace the output of built-in (non-MCP) tools, and the exact input field names (`tool_name`, `tool_input`, `tool_response`, `session_id`), should be verified against the current Agent SDK hooks documentation before use. Docs could not be fetched when this lesson was revised.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 1.6 Decomposition strategy
  // ---------------------------------------------------------------------------
  {
    id: '1.6',
    title: 'Choosing a decomposition strategy',
    outcome:
      'Given a complex task, decide whether to run it as a fixed sequential pipeline, as dynamic orchestrator-driven decomposition, or as a single call, and justify the choice by how predictable the steps are.',
    minutes: 25,
    terms: [
      {
        term: 'Prompt chaining (fixed pipeline)',
        definition:
          'A sequence of model calls whose steps are decided in advance by your code. Each step gets a focused prompt and the previous step\'s output; code can check results between steps.',
      },
      {
        term: 'Dynamic (adaptive) decomposition',
        definition:
          'The model decides the subtasks at run time, based on what earlier steps discovered. The plan can grow, shrink, or change direction.',
      },
      {
        term: 'Orchestrator-workers',
        definition:
          'A pattern where a coordinating agent breaks a task into subtasks, delegates each to a worker (often a subagent with its own context), and synthesizes the results.',
      },
      {
        term: 'Attention dilution',
        definition:
          'Quality loss when one call must attend to too much material at once: uneven depth, missed issues, and contradictory findings across parts of the input.',
      },
      {
        term: 'Integration pass',
        definition:
          'A separate step after per-item analysis that looks only at cross-item concerns, such as interfaces between files, using the per-item results as input.',
      },
    ],
    learningPoints: [
      'Decide between a fixed sequential pipeline (prompt chaining) and dynamic decomposition that adapts to intermediate findings.',
      'Design a prompt chain for a review: analyze each file on its own, then run a separate cross-file integration pass, to avoid attention dilution.',
      'Explain the value of an adaptive investigation plan that generates new subtasks from what each step discovers.',
      'Match the pattern to the work: prompt chaining for predictable multi-aspect reviews, dynamic decomposition for open-ended investigations.',
      'Decompose an open-ended task such as adding tests to a legacy codebase: map the structure, find high-impact areas, then follow a prioritized plan that adapts as dependencies appear.',
      'Recognize over-engineering (dynamic planning for fixed steps) and choose a single call when the task is small.',
    ],
    concept: `Big tasks go better when you split them up. The real question is **who decides the split, and when**.

If you can write the steps down before you start, and they are the same every time, *your code* should decide them. That is a fixed pipeline, also called prompt chaining: step 1 analyzes each file, step 2 checks how the files fit together, step 3 writes the report. Each call has one clear job and a small, relevant input. Between steps, code can validate output, retry a failed item, or stop early. Pipelines are predictable, cheap to test, and easy to debug, because a bad result points to a specific step.

If you cannot know the steps until you see intermediate results, *the model* should decide them. "Why did checkout latency double since Tuesday?" might lead to deploy logs, then a database migration, then one slow query, and none of that was knowable at the start. Here you want dynamic, adaptive decomposition: an orchestrator looks at what has been found and generates the next subtasks. Often it delegates them to workers (subagents) that each explore one thread in a clean context and report back. This is the orchestrator-workers pattern.

### Two failure modes

- **Single giant pass.** Putting 40 changed files into one review prompt seems efficient, but attention is spread thin. Some files get deep comments, others get none, and the model may flag a pattern in one file while approving the same pattern in another. Splitting into per-file passes plus a separate integration pass for cross-file issues gives consistent depth.
- **Over-engineering.** Using a planning orchestrator for a task with fixed steps (extract fields, validate, format) adds latency, cost, and run-to-run variation, and makes failures harder to reproduce. If the plan would be the same every time, hard-code it.

### Terminology

- **Prompt chaining / fixed pipeline**: code-defined sequence of focused calls, optionally with programmatic gates.
- **Dynamic decomposition**: model-generated subtasks that adapt to findings.
- **Orchestrator-workers**: coordinator plans, delegates to workers, and synthesizes; workers do not see the coordinator's conversation, so the orchestrator must pass each one what it needs.
- **Integration pass**: a step focused only on interactions between items.

### Open-ended work: map, prioritize, adapt

Some tasks are open-ended without being a mystery. "Add comprehensive tests to this legacy codebase" has no fixed step list, and trying to test every file in alphabetical order wastes effort on dead code. Decompose it in three moves:

1. **Map the structure** first: modules, entry points, how code is wired together, what tests exist.
2. **Identify high-impact areas**: code that handles money or data integrity, changes often, or has many callers, and that has no tests yet.
3. **Create a prioritized plan that adapts**: start with the top item, and when you discover a dependency (say, the billing module cannot be tested until a database wrapper is made injectable), insert that work into the plan and re-rank.

This is the value of an adaptive plan: subtasks come from what each step reveals, rather than from a list written before anything was read.

Hybrids are common: a fixed outer pipeline with one dynamic step inside, or a dynamic investigation whose final report step is fixed. A small task, such as classifying one message, needs no decomposition at all.

> Decision test: could you write the full list of steps on a whiteboard before seeing any data? If yes, pipeline. If the list depends on what you find, decompose dynamically.`,
    example: {
      intro:
        'Two tasks from the same engineering org. Quarry Labs reviews pull requests in CI, where the steps are always the same. A platform engineer at Harbor Freight investigates an unexplained latency regression, where the steps are not known in advance. The artifacts show a fixed review pipeline and a dynamic investigation trace.',
      artifacts: [
        {
          lang: 'python',
          caption: 'Fixed pipeline: per-file review, then a cross-file integration pass (sketch)',
          code: `async def review_pr(diff: PullRequestDiff) -> Report:
    # Step 1: one focused call per changed file, run in parallel.
    per_file = await asyncio.gather(*[
        review_file(f.path, f.patch, conventions=CONVENTIONS)   # returns FileFindings (JSON)
        for f in diff.files
    ])

    # Gate: code checks every step-1 result before moving on.
    failed = [r for r in per_file if not r.valid_schema]
    if failed:
        per_file = await retry_with_errors(failed)

    # Step 2: integration pass sees summaries and changed interfaces, not every full patch.
    integration = await review_integration(
        summaries=[r.summary for r in per_file],
        changed_signatures=extract_signature_changes(diff),
    )

    # Step 3: deterministic merge and formatting.
    return build_report(per_file, integration)`,
        },
        {
          lang: 'json',
          caption: 'Step-1 output for one file (input to the integration pass)',
          code: `{
  "path": "services/billing/invoice.ts",
  "summary": "Adds optional currency param to createInvoice(); defaults to USD.",
  "changed_exports": ["createInvoice(customerId, lines, currency?)"],
  "findings": [
    { "line": 88, "severity": "high", "issue": "Rounding uses toFixed(2) on float sum; totals can drift by 0.01." }
  ]
}`,
        },
        {
          lang: 'text',
          caption: 'Dynamic decomposition: orchestrator trace for an open-ended investigation',
          code: `Goal: Why did checkout p95 latency rise from 420 ms to 910 ms since Tuesday?

[plan v1]  W1: list deploys to checkout path since Mon   W2: compare p95 by endpoint
[W1 result] 3 deploys; one includes migration 0142 (adds index on orders.created_at)
[W2 result] regression isolated to POST /checkout/confirm
[plan v2]  W3: profile queries in /checkout/confirm before/after Tue
           (new subtask: only exists because W1 + W2 pointed here)
[W3 result] query on order_items now does seq scan; planner stats stale after migration
[plan v3]  W4: check whether ANALYZE ran after 0142   W5: check other tables touched by 0142
[W4 result] no ANALYZE in migration runbook
[synthesis] Root cause + evidence chain + recommended fix, each claim tied to a worker result`,
        },
      ],
      walkthrough: `1. **The review steps never change.** Every PR gets per-file analysis, then integration, then formatting. Hard-coding that sequence makes cost predictable and failures traceable (a schema error in step 1 is caught by the gate before step 2 runs).
2. **Per-file calls avoid attention dilution.** Each call reviews one patch with the team conventions, so file 37 gets the same scrutiny as file 1.
3. **The integration pass has a narrow job.** It receives summaries and changed signatures, so it can spot that \`createInvoice\` gained a parameter while a caller in another file was not updated, without re-reading every full patch.
4. **The investigation could not be planned upfront.** W3 exists only because W1 and W2 pointed at one endpoint and one migration. A fixed pipeline written on Monday would not have contained "profile queries in /checkout/confirm".
5. **The orchestrator re-plans after each result** and keeps an evidence chain, so the final synthesis can show why it concluded what it did. Each worker received an explicit, self-contained subtask, since workers do not share the orchestrator's history.`,
    },
    compare: {
      question: 'A team must analyze 60 supplier contracts every month for the same 12 risk clauses and then flag contradictions between contracts with the same supplier. Which design fits?',
      a: {
        title: 'Fixed pipeline: per-contract extraction, then cross-contract integration pass',
        body: 'Code runs one focused extraction call per contract for the 12 clauses, validates each result, then runs a grouped integration pass per supplier to find contradictions.',
        chooseWhen:
          'The steps and outputs are the same for every run and can be listed in advance; you want predictable cost, parallelism, and step-level debugging.',
      },
      b: {
        title: 'Orchestrator-workers with dynamic subtasks',
        body: 'An orchestrator reads the request, decides which contracts and clauses to examine, spawns workers as it goes, and decides when it has enough to synthesize.',
        chooseWhen:
          'The work is open-ended, so what to look at next depends on what has been found (for example, "find anything unusual in this supplier relationship").',
      },
      decidingDetail:
        'The deciding detail is that the **clause list and steps are fixed and known before any contract is read**. That makes a pipeline the right fit, and dynamic planning would only add variance and cost. If the request were exploratory, with no fixed checklist, the orchestrator design would be appropriate.',
    },
    mistake: {
      mistake:
        'Sending all 40 changed files of a large PR to one model call with "review everything and report all issues", and treating that as thorough because the whole diff fits in the context window.',
      whyTempting:
        'It is one call, simple to implement, and the model can in principle see cross-file relationships because everything is in view at once.',
      howToRecognize:
        'Uneven depth: detailed comments on the first few files and little or nothing on later ones; the same pattern flagged in one file and passed in another; results that vary a lot between identical runs; obvious bugs in the middle of the diff going unmentioned.',
      fix:
        'Split into per-file passes with the same focused instructions (run in parallel), validate their structured outputs, then run a separate integration pass over summaries and changed interfaces to catch cross-file issues.',
    },
    exercise: {
      prompt: 'Label each task with the decomposition strategy that fits best.',
      inputs: `Decision test: can the full list of steps be written down before seeing any data?

- Yes, and there are several distinct steps → fixed sequential pipeline
- No, next steps depend on findings → dynamic adaptive decomposition
- The task is small and single-purpose → single call`,
      labels: ['Fixed sequential pipeline', 'Dynamic adaptive decomposition', 'Single call'],
      items: [
        {
          id: 'e1',
          text: 'Every night, extract fields from each invoice, validate totals against line items, then map the record into the client ERP schema.',
          answer: 'Fixed sequential pipeline',
          why: 'Same three steps for every document, known in advance, and code can validate between steps.',
        },
        {
          id: 'e2',
          text: 'Find out why a nightly batch job fails roughly once a week with no consistent error message.',
          answer: 'Dynamic adaptive decomposition',
          why: 'The cause is unknown; what to inspect next (logs, schedules, resource limits, upstream data) depends on each finding.',
        },
        {
          id: 'e3',
          text: 'Classify one incoming support message as billing, technical, or account.',
          answer: 'Single call',
          why: 'Small, single-purpose task. Splitting it adds latency and cost without improving quality.',
        },
        {
          id: 'e4',
          text: 'Review a 35-file pull request against team conventions, then check that changed function signatures are updated at every call site.',
          answer: 'Fixed sequential pipeline',
          why: 'Per-file passes avoid attention dilution, and the cross-file integration pass is a known, fixed second step.',
        },
        {
          id: 'e5',
          text: 'An analyst asks: "What is driving the drop in renewals among mid-market customers?" using web search, internal metrics, and filings.',
          answer: 'Dynamic adaptive decomposition',
          why: 'Open-ended research. An orchestrator should plan, delegate searches to workers, and add subtasks as evidence points somewhere new.',
        },
        {
          id: 'e6',
          text: 'Add meaningful tests to a 200k-line legacy service with almost no existing tests.',
          answer: 'Dynamic adaptive decomposition',
          why: 'Map the structure first, rank high-impact untested areas, then work through a prioritized plan that changes as dependencies (untestable wrappers, hidden globals) are discovered.',
        },
      ],
      solution: `Apply the whiteboard test. Tasks e1 and e4 have a fixed list of steps, so a code-defined pipeline gives predictable cost and step-level debugging; e4 also shows the per-file plus integration-pass pattern. Tasks e2 and e5 are investigations whose next step depends on what was found, so an orchestrator generating subtasks fits. Task e6 is open-ended too: map, prioritize by impact, and let the plan adapt as dependencies surface. Task e3 is one small decision, and any decomposition would be over-engineering.`,
    },
    check: [
      {
        id: 'k1',
        id: 'k1',
        stem: 'A single call reviewing a 50-file diff gives detailed comments on early files and almost none on later ones. What is the most likely cause and fix?',
        options: [
          { id: 'a', text: 'Attention dilution; split into per-file passes plus a cross-file integration pass.' },
          { id: 'b', text: 'The output token limit is too low; raise max_tokens so later files get comments.' },
          { id: 'c', text: 'The instruction is too weak; add "review every file with equal care" to the prompt.' },
          { id: 'd', text: 'The task needs an orchestrator that decides at run time which files to skip.' },
        ],
        correct: 'a',
        why: 'Uneven depth across many inputs in one pass is the classic sign of attention dilution. Focused per-file calls give consistent depth, and the integration pass keeps cross-file checks. A max_tokens limit would cut the output off abruptly rather than thin it out, and stronger wording does not fix the structural problem.',
      },
      {
        id: 'k2',
        id: 'k2',
        stem: 'Which task is the best fit for dynamic adaptive decomposition?',
        options: [
          { id: 'a', text: 'Translating 200 product descriptions into French, then checking each against a glossary.' },
          { id: 'b', text: 'Extracting the same 15 fields from every purchase order in a monthly batch.' },
          { id: 'c', text: 'Finding why a fraud model\'s precision dropped after an unspecified data change.' },
          { id: 'd', text: 'Formatting validated JSON records into an ERP import file for the nightly load.' },
        ],
        correct: 'c',
        why: 'Only the fraud-model investigation has steps that depend on findings. The translation task has two steps but both are known in advance, as are the others, so a fixed pipeline or single call is cheaper and more predictable.',
      },
      {
        id: 'k3',
        id: 'k3',
        stem: 'A team replaced a three-step extraction pipeline with an orchestrator that plans steps per document. Quality is unchanged, cost rose, and some failures cannot be reproduced. What happened?',
        options: [
          { id: 'a', text: 'The workers lacked context because they could not see the orchestrator\'s conversation.' },
          { id: 'b', text: 'The orchestrator needed a larger model to plan each document\'s steps reliably.' },
          { id: 'c', text: 'The pipeline steps were too coarse and should have been split further instead.' },
          { id: 'd', text: 'Over-engineering: dynamic planning was applied to steps that were already fixed.' },
        ],
        correct: 'd',
        why: 'When steps are predictable, model-driven planning adds latency, cost, and run-to-run variation without improving quality. More worker context or a larger model would not remove that variation; restoring the fixed pipeline brings back determinism and step-level debugging.',
      },
    ],
    review: [
      {
        front: 'Fixed pipeline or dynamic decomposition: what is the one-question test?',
        back: 'Could you list every step before seeing the data? Yes means a code-defined pipeline (prompt chaining). No, because the next step depends on findings, means dynamic decomposition, often orchestrator-workers.',
      },
      {
        front: 'How do you review many files without attention dilution but still catch cross-file bugs?',
        back: 'Run focused per-file passes (in parallel), then a separate integration pass over their summaries and changed interfaces that looks only at cross-file issues.',
      },
      {
        front: 'How do you decompose "add comprehensive tests to a legacy codebase"?',
        back: 'Map the structure first, identify high-impact untested areas, then follow a prioritized plan that you re-rank as dependencies are discovered. Do not march file by file through the tree.',
      },
      {
        front: 'What are the costs of using an orchestrator for a predictable task?',
        back: 'Extra latency and tokens, run-to-run variation, and failures that are harder to reproduce and attribute to a step, with no quality gain.',
      },
    ],
    sources: ['guide-d1', 'eng-building-agents', 'pe-chain', 'eng-multi-agent', 'sdk-subagents', 'app-authored'],
  },

  // ---------------------------------------------------------------------------
  // 1.7 Session state, resumption, and forking
  // ---------------------------------------------------------------------------
  {
    id: '1.7',
    title: 'Session state, resumption, and forking',
    outcome:
      'Given an earlier agent session and what has changed since, decide whether to resume it, fork it, or start fresh with a structured summary, and write the opening message that keeps the agent from acting on stale information.',
    minutes: 20,
    terms: [
      {
        term: 'Session',
        definition:
          'A saved conversation history (user messages, assistant turns, tool calls, and tool results) identified by a session ID, which the SDK or Claude Code can reload later.',
      },
      {
        term: 'Resume',
        definition:
          'Continue an existing session with its full history. In Claude Code: `claude --resume <session-name>` for a named session (or `--continue` for the most recent). In the Agent SDK: the `resume` option with a session ID.',
      },
      {
        term: 'Fork',
        definition:
          'Start a new session that begins with a copy of an existing session\'s history, leaving the original unchanged. In the SDK: `fork_session=True` (Python) / `forkSession: true` (TypeScript) together with `resume`.',
      },
      {
        term: 'Named session',
        definition:
          'A session given a human-readable name (for example `auth-timeout-investigation`) so it can be resumed later with `--resume <session-name>` instead of hunting for an ID or relying on "most recent".',
      },
      {
        term: 'Stale tool result',
        definition:
          'A tool output in session history (for example a file read) that no longer matches reality because the underlying file or data changed after it was captured.',
      },
      {
        term: 'Structured summary',
        definition:
          'A deliberately written handoff (goal, decisions, findings with exact identifiers, open questions, files of interest) used to start a fresh session instead of reloading a long or stale history.',
      },
    ],
    learningPoints: [
      'Continue a specific earlier investigation across work sessions with `--resume <session-name>`, rather than relying on "most recent" or a fresh start.',
      'Use fork_session to branch independent explorations (two testing strategies, two refactoring approaches) from one shared analysis baseline.',
      'Tell a resumed session exactly which files changed since it last ran, so it re-analyzes those files instead of re-exploring everything or trusting stale results.',
      'Explain why a new session seeded with a structured summary is more reliable than resuming with stale tool results.',
      'Choose between resuming (prior context mostly valid) and starting fresh with an injected summary (prior tool results stale).',
    ],
    concept: `A session is the agent's memory of a piece of work: every message, every tool call, and every tool result, saved under an ID. Resuming reloads that whole history, so the agent remembers what it read and decided. That is the strength, and it is also the risk.

The risk is that **the history includes old tool results, and the model treats them as current**. If yesterday's session read \`auth/session.ts\` and a teammate changed that file overnight, the resumed agent still "knows" yesterday's version. Nothing in the history tells it the file changed. It may edit code that no longer exists or reason from a function signature that was renamed.

So you have three options when picking up earlier work:

1. **Resume** when the history is still accurate and still useful. Give long-running investigations a **name** so you can return to the right one: \`claude --resume auth-timeout-investigation\` picks up that exact conversation days later, even if you have opened other sessions since (\`--continue\` would just take the most recent one). If some things changed, say so in your first message: name the changed files, say what kind of change it was, and ask the agent to re-read them before continuing. Targeted re-analysis of the named files is far cheaper than re-exploring the whole codebase.
2. **Fork** (\`fork_session\`) when you want to try two different directions from the same starting point. A fork copies the history into a new, independent session; the original stays as it was. You can analyze a module once, then fork into "approach A: add a cache" and "approach B: batch the queries", or into two testing strategies, and compare the results, without either attempt polluting the other or the baseline.
3. **Start fresh with a structured summary** when the history is mostly stale (many files changed, data refreshed) or so long that it is crowding the context with verbose tool output. Write a summary that keeps the exact facts that matter (IDs, numbers, file paths, decisions and why) and start a new session with it. This is more reliable than resuming because stale tool results are simply not there to mislead the model, while the conclusions that still hold are carried forward. The agent then reads current files instead of trusting old ones.

### Terminology

- **Session ID**: the handle you store to resume or fork later. The SDK reports it in its messages (for example on the final result message).
- **\`resume\`**: SDK option to continue a session; **\`claude --resume <session-name>\`** (named session) / **\`claude --continue\`** (most recent) in the CLI.
- **\`fork_session\`** (Python) / **\`forkSession\`** (TypeScript): with \`resume\`, branch into a new session ID instead of appending to the original. The CLI has a matching \`--fork-session\` flag.
- **Stale context**: history that no longer matches the world.

> A resumed session is only as good as its history. If you would not trust a colleague's week-old notes without checking the code, do not let the agent do so either.`,
    example: {
      intro:
        'A developer at Harbor Freight analyzed the `rate-limiter` service on Monday using an internal agent built on the Agent SDK. On Tuesday they want to continue, then compare two fixes. The artifacts show capturing and resuming the session, forking two approaches, a CLI equivalent, and the change notice sent on resume.',
      artifacts: [
        {
          lang: 'python',
          caption: 'Capture a session ID, resume it, and fork two approaches from the same baseline (illustrative)',
          code: `from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

async def run(prompt: str, **opts) -> str:
    session_id = None
    async for msg in query(prompt=prompt, options=ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob"], **opts)):
        if isinstance(msg, ResultMessage):
            session_id = msg.session_id
    return session_id

# Monday: baseline analysis. Store the ID with the ticket.
baseline = await run("Analyze services/rate-limiter: how are limits stored and checked? "
                     "List hot paths and their file:line locations.")

# Tuesday: resume the baseline, telling it what changed.
await run(CHANGE_NOTICE + "\\nContinue: list the top 3 causes of the 429 spikes.",
          resume=baseline)

# Explore two divergent fixes from the same baseline without touching it.
fork_a = await run("Design fix A: add a local LRU cache in front of Redis.",
                   resume=baseline, fork_session=True)
fork_b = await run("Design fix B: batch limit checks per request with a Lua script.",
                   resume=baseline, fork_session=True)
# fork_a and fork_b are new session IDs; baseline history is unchanged.`,
        },
        {
          lang: 'bash',
          caption: 'Claude Code CLI equivalents',
          code: `claude --continue                      # resume the most recent session in this directory
claude --resume                        # pick a past session interactively
claude --resume rate-limiter-429s     # resume the session named "rate-limiter-429s"
claude --resume <session-id>           # resume a specific session by ID
claude --resume <session-id> --fork-session   # branch into a new session from that history`,
        },
        {
          lang: 'text',
          caption: 'CHANGE_NOTICE: first message on resume',
          code: `Since this session last ran (Mon 17:40), the following changed on main:
- services/rate-limiter/store.go: RedisStore.Check renamed to RedisStore.Allow; now takes ctx.
- services/rate-limiter/config.yaml: default burst raised from 20 to 50.
- Deleted: services/rate-limiter/legacy_mem.go
Your earlier reads of these files are out of date. Re-read store.go and config.yaml
before relying on them. Treat anything you concluded about legacy_mem.go as obsolete.
No other files under services/rate-limiter changed.`,
        },
      ],
      walkthrough: `1. **The session ID is the handle.** The helper reads it from the result message and returns it. Store it somewhere durable (the ticket, a job record); without it you cannot resume or fork that exact history.
2. **Resuming keeps Monday's work.** The agent does not re-explore the whole service, which saves time and tokens.
3. **The change notice prevents stale reasoning.** Monday's history contains the old \`RedisStore.Check\` code and a deleted file. The notice names each change and tells the agent to re-read, and it also says what did *not* change, so the agent knows the rest of its history is still valid.
4. **Forks isolate experiments.** Fix A and fix B each start from the same analysis but write into separate sessions. Neither approach's reasoning leaks into the other, and the baseline remains available for a third attempt.
5. **When to abandon resuming:** if two weeks later most of the service had been rewritten, this notice would become a long list and much of the history would be wrong. At that point, write a structured summary of Monday's conclusions and start a new session.`,
    },
    compare: {
      question: 'An engineer returns to a three-week-old investigation session. Since then, 18 of the 25 files it read have changed, and its history is dominated by long log dumps. How should they continue?',
      a: {
        title: 'Resume the session with a change notice',
        body: 'Resume by session ID and open with a list of changed files, asking the agent to re-read them before continuing.',
        chooseWhen:
          'Most of the history is still accurate, only a few named files or records changed, and the context is not crowded by verbose old output.',
      },
      b: {
        title: 'Start fresh with a structured summary',
        body: 'Write a summary of goals, confirmed findings (with exact file paths, IDs, and numbers), decisions and reasons, and open questions, then start a new session from it and let the agent read current files.',
        chooseWhen:
          'Much of the history is stale or the session is bloated with tool output that would crowd out current information.',
      },
      decidingDetail:
        'The deciding detail is **how much of the history is still true**. With 18 of 25 files changed and the context filled with old logs, a change notice would be longer than the useful history, and stale results would remain in context. Start fresh. If only two or three files had changed, resuming with a precise change notice would preserve valuable work cheaply.',
    },
    mistake: {
      mistake:
        'Resuming yesterday\'s session with "continue where we left off" after teammates merged changes to files the session had already read, without telling the agent anything changed.',
      whyTempting:
        'Resuming feels like it restores full knowledge, and the agent responds confidently, citing details from its earlier reads as if they were current.',
      howToRecognize:
        'The agent references functions, line numbers, or config values that no longer exist; edits fail because anchor text is gone; or it recommends changes that were already made. Check whether any file it relies on has a newer commit than the session\'s last activity.',
      fix:
        'Before resuming, check what changed (for example with git log or diff since the session\'s last activity). Open the resumed session with a precise change notice and ask it to re-read those files. If most of the history is stale, start a new session from a structured summary instead.',
    },
    exercise: {
      prompt: 'For each situation, choose how the developer should continue the work.',
      inputs: `Options:

- **Resume**: continue the existing session (with a change notice if anything changed).
- **Fork**: branch a new session from the existing history, leaving the original untouched.
- **Start fresh with summary**: open a new session from a written structured summary.`,
      labels: ['Resume', 'Fork', 'Start fresh with summary'],
      items: [
        {
          id: 'e1',
          text: 'Yesterday\'s session mapped the payments module. Nothing in the repo has changed since. Today the developer wants to write tests for the paths it found.',
          answer: 'Resume',
          why: 'The history is fully accurate and directly useful; resuming avoids re-exploring the module.',
        },
        {
          id: 'e2',
          text: 'After a shared analysis of a slow report query, the team wants to compare a materialized-view approach with a query-rewrite approach.',
          answer: 'Fork',
          why: 'Two divergent explorations from one baseline. Forks keep each approach isolated and leave the baseline intact for comparison.',
        },
        {
          id: 'e3',
          text: 'A month-old session is resumed; since then the module was largely rewritten and the history is full of 2,000-line log excerpts.',
          answer: 'Start fresh with summary',
          why: 'Most tool results are stale and the context is bloated. A structured summary carries the conclusions forward while the agent reads current code.',
        },
        {
          id: 'e4',
          text: 'Yesterday\'s session analyzed 12 files; a teammate has since changed two of them. The rest of the analysis is still valid.',
          answer: 'Resume',
          why: 'Most history is still valid. Resume and open with a notice naming the two changed files and asking the agent to re-read them.',
        },
        {
          id: 'e6',
          text: 'A developer has been switching between three investigations this week. She wants to continue the one named "invoice-rounding", which is not her most recent session; nothing it read has changed.',
          answer: 'Resume',
          why: 'The history is valid, so resume that specific session by name with `claude --resume invoice-rounding`. `--continue` would open the most recent session, which is a different investigation.',
        },
        {
          id: 'e5',
          text: 'Mid-investigation, the developer wants to test a speculative hypothesis that would add a lot of noise without disturbing the main line of investigation.',
          answer: 'Fork',
          why: 'The fork inherits the investigation so far but keeps the speculative work out of the main session.',
        },
      ],
      solution: `Resume when the history is true and useful (e1), adding a precise change notice when a few things changed (e4). Fork when you want divergent attempts from the same starting point without contaminating it (e2, e5). Start fresh with a structured summary when much of the history is stale or the context is bloated (e3). The common thread: decide based on how much of the saved history still matches reality.`,
    },
    check: [
      {
        id: 'k1',
        stem: 'You want to try two different refactoring strategies starting from the same completed analysis session, and keep that analysis unchanged. What should you do?',
        options: [
          { id: 'a', text: 'Resume the analysis session twice in a row, once per strategy.' },
          { id: 'b', text: 'Resume the analysis session with fork enabled once for each strategy.' },
          { id: 'c', text: 'Start two new sessions and paste the full analysis transcript into each.' },
          { id: 'd', text: 'Run both strategies in the analysis session and ask the agent to keep them separate.' },
        ],
        correct: 'b',
        why: 'Forking gives each strategy its own new session that starts from the baseline history while the original stays untouched. Plain resuming appends to the original, so the second strategy would see the first one\'s work.',
      },
      {
        id: 'k2',
        id: 'k2',
        stem: 'A resumed session keeps proposing edits to a function that a teammate renamed overnight. What is the best prevention for next time?',
        options: [
          { id: 'a', text: 'Use a model with a larger context window so more history fits on resume.' },
          { id: 'b', text: 'Fork the session instead of resuming it, so the original history stays intact.' },
          { id: 'c', text: 'On resume, name the files that changed and have the agent re-read them first.' },
          { id: 'd', text: 'Add a system prompt rule to "always use the latest code" before editing anything.' },
        ],
        correct: 'c',
        why: 'The agent cannot know that a file changed after it was read; its history shows the old version. Naming the changed files and requiring a re-read replaces stale tool results with current ones. Forking copies the same stale history, and a generic "latest code" rule does not tell it what changed.',
      },
      {
        id: 'k3',
        id: 'k3',
        stem: 'When is starting a new session from a structured summary better than resuming?',
        options: [
          { id: 'a', text: 'When most earlier tool results are stale or the history is full of verbose output.' },
          { id: 'b', text: 'When more than a day has passed since the session last ran, even if nothing changed.' },
          { id: 'c', text: 'When you want to explore an alternative approach from the same starting analysis.' },
          { id: 'd', text: 'When the session is short and nothing in the repository has changed since it ended.' },
        ],
        correct: 'a',
        why: 'A fresh start pays off when the old history is more misleading or bulky than helpful. Elapsed time alone does not matter, exploring alternatives from the same baseline is what forking is for, and a short accurate session should simply be resumed.',
      },
    ],
    review: [
      {
        front: 'Resume vs fork: what happens to the original session?',
        back: 'Resume appends new turns to the original session. Fork (resume plus fork_session / forkSession / --fork-session) creates a new session ID that starts from a copy of the history, leaving the original unchanged.',
      },
      {
        front: 'How do you pick up a specific earlier investigation that is not your most recent session?',
        back: 'Resume it by name: `claude --resume <session-name>`. `--continue` only reopens the most recent session.',
      },
      {
        front: 'What should the first message of a resumed session include if files changed?',
        back: 'Which files changed (and how), an instruction to re-read them before relying on earlier reads, what is now obsolete, and ideally what did not change.',
      },
      {
        front: 'What belongs in a structured summary for a fresh session?',
        back: 'Goal, confirmed findings with exact identifiers (paths, IDs, numbers), decisions and their reasons, open questions, and the files to read first. Not raw tool output.',
      },
    ],
    sources: ['guide-d1', 'sdk-sessions', 'cc-cli-reference', 'cc-workflows', 'eng-context', 'app-authored'],
    notes: [
      {
        date: '2026-11-21',
        text: 'The exam guide (v1.1) confirms `--resume <session-name>` for named sessions and `fork_session` for branching, and this lesson teaches both. How a session gets its name (a flag at start-up or a rename command), the TypeScript spelling `forkSession`, `ResultMessage.session_id`, and the CLI `--fork-session` flag are version-sensitive details that may differ in current releases; check the current Agent SDK and Claude Code CLI documentation.',
      },
    ],
  },
];
