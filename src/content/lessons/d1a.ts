// Domain 1 lessons, part A: task statements 1.1–1.4.
// Original, app-authored teaching content. Learning points are aligned with the Knowledge/Skills
// bullets of the official exam guide v1.1 (read 2026-11-21) and written in this app's own words.
// See src/content/coverage/d1.ts for the bullet-by-bullet map.
import type { Lesson } from '../types';

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------------------------
  // 1.1 Agent loops, stop reasons, tool execution, tool results
  // ---------------------------------------------------------------------------------------------
  {
    id: '1.1',
    title: 'Agent loops, stop reasons, and tool results',
    outcome:
      'Given a Messages API response, decide from its stop_reason whether to run tools and continue, resume, or stop, and build a correctly paired tool_result message.',
    minutes: 25,
    terms: [
      { term: 'Agent loop', definition: 'Your code that repeatedly calls the model, runs the tools it requests, returns the results, and calls again until the model ends its turn.' },
      { term: 'stop_reason', definition: 'Field on every Messages API response that says why generation stopped: end_turn, tool_use, max_tokens, stop_sequence, pause_turn, or refusal.' },
      { term: 'tool_use block', definition: 'Assistant content block requesting a tool call. Carries an id, the tool name, and an input object that matches the tool\'s input_schema.' },
      { term: 'tool_result block', definition: 'User content block that returns a tool\'s output. Its tool_use_id must equal the id of the tool_use block it answers.' },
      { term: 'is_error', definition: 'Optional flag on a tool_result. When true, the content describes a failure so Claude can retry, change approach, or explain the problem.' },
      { term: 'Iteration cap', definition: 'A maximum number of loop iterations. A safety backstop against runaway loops, not the normal way a loop finishes.' },
    ],
    learningPoints: [
      'Describe one full pass of the loop: send the request, read stop_reason, run the requested tools, return their results, and call again.',
      'Write loop control flow that keeps going while stop_reason is "tool_use" and stops when it is "end_turn", with deliberate handling for the other stop reasons.',
      'Explain why each assistant turn and its tool results must be appended to the message history: the history is all the model knows when it picks its next action.',
      'Return every tool result for a turn in one user message, paired by tool_use_id, and report failures with is_error: true instead of crashing or dropping them.',
      'Avoid the three termination anti-patterns: parsing natural-language "I am done" signals, using an iteration cap as the main stop condition, and treating any assistant text as completion.',
      'Contrast model-driven tool selection (Claude reasons about the next call from context) with pre-configured decision trees or fixed tool sequences, and say when each fits.',
    ],
    concept: `An agent loop is ordinary code that you write around the model. You send the conversation and your tool definitions to the Messages API. Claude either answers, or asks you to run one or more tools. If it asked for tools, your code runs them, sends the results back, and calls the API again. This repeats until Claude says its turn is over. The model never executes your tools itself: your code does, and your code decides when the loop ends.

### The signal: stop_reason

Every response carries a \`stop_reason\`. Branch on it, not on what the text says.

- \`tool_use\`: the response contains one or more \`tool_use\` blocks. Execute all of them, return the results, and call again.
- \`end_turn\`: Claude finished its turn. This is the normal completion signal.
- \`max_tokens\`: output hit your \`max_tokens\` limit. The reply is truncated, and a trailing \`tool_use\` block may be incomplete. Do not treat this as success.
- \`stop_sequence\`: one of your custom stop sequences matched.
- \`pause_turn\`: the API paused a long-running turn (typically one using server-side tools). Send the assistant content back unchanged so Claude can continue.
- \`refusal\`: Claude declined to continue for safety reasons. Stop and handle it; blind retries are not a fix.

### Returning results

The model has no memory between API calls: each request carries the whole conversation, and that history is the only thing Claude reasons from when it chooses the next action. So results must be **appended**, never summarized away or sent out of band. Each \`tool_use\` block has an \`id\`, a \`name\`, and an \`input\`. After running the tools, append the assistant message to the history, then append **one** \`user\` message containing a \`tool_result\` block for **every** \`tool_use\` block from that turn, each with \`tool_use_id\` set to the matching \`id\`. Put the tool_result blocks first in that message; any extra text goes after them. Splitting results across several user messages, or omitting one, breaks the pairing the API expects.

When a tool fails, still return a tool_result. Set \`is_error: true\` and describe what went wrong and whether a retry could help. Claude can then correct its input, try another tool, or tell the user.

### Why not parse the text?

Phrases like "I'm done" or "Final answer:" are unreliable. Claude may write them in the same response that requests another tool, or finish without them. A related trap is treating *any* text block as the end: Claude often narrates ("Let me check the invoice") in the same response as a \`tool_use\` block, so "the response contains text" says nothing about completion. \`stop_reason\` is structured and set by the API.

### Who decides the next step?

In an agent loop the **model** decides: given the conversation so far and the tool descriptions, Claude reasons about which tool to call next, or whether it is finished. The alternative is a **pre-configured decision tree** or fixed tool sequence written in your code ("if intent is billing, call lookup_invoice, then lookup_transaction"). Trees are predictable but break on requests their author did not anticipate, such as a billing question that turns out to be a roaming problem. Use model-driven selection when the right next step depends on what earlier results revealed; keep fixed sequences for steps that are truly the same every time, and use code gates (lesson 1.4) for rules that must never be skipped.

### Iteration caps

A maximum-iterations limit protects you from runaway cost when something goes wrong. It is a backstop, not the stop condition. If conversations routinely end at the cap, something else is broken: a tool that keeps failing, an unclear goal, or results that never reach the model.`,
    example: {
      intro:
        'A Python support agent built on the Anthropic SDK. The first artifact is the loop. The second is a trace of one turn in which Claude requested two tools at once and one of them failed.',
      artifacts: [
        {
          lang: 'python',
          caption: 'agent_loop.py: branches on stop_reason; the cap is only a backstop',
          code: `import json
import anthropic

client = anthropic.Anthropic()
MODEL = "<your-model-id>"
MAX_ITERATIONS = 25  # backstop against runaway loops, NOT the completion signal


class ToolError(Exception):
    def __init__(self, message: str, retryable: bool):
        super().__init__(message)
        self.retryable = retryable


def run_tool(name: str, tool_input: dict) -> dict:
    ...  # dispatch to get_customer, lookup_invoice, etc.; raise ToolError on failure


def run_agent(system: str, tools: list, messages: list):
    for _ in range(MAX_ITERATIONS):
        response = client.messages.create(
            model=MODEL, max_tokens=4096, system=system, tools=tools, messages=messages
        )
        # Always keep the assistant turn (including tool_use blocks) in the history.
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "tool_use":
            results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                try:
                    output = run_tool(block.name, block.input)
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(output),
                    })
                except ToolError as err:
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps({"error": str(err), "retryable": err.retryable}),
                        "is_error": True,
                    })
            # ONE user message carrying every result for this turn.
            messages.append({"role": "user", "content": results})
            continue

        if response.stop_reason == "pause_turn":
            continue  # assistant content already appended unchanged; call again to resume

        if response.stop_reason == "end_turn":
            return response

        if response.stop_reason == "max_tokens":
            raise RuntimeError("Truncated output: raise max_tokens or shorten the task")

        if response.stop_reason == "refusal":
            return handle_refusal(response)

        return response  # stop_sequence or a value added later: handle explicitly

    raise RuntimeError(f"Hit MAX_ITERATIONS={MAX_ITERATIONS}: inspect the trace")`,
        },
        {
          lang: 'json',
          caption: 'One turn: two tool_use blocks in, two tool_result blocks out (one with is_error)',
          code: `// assistant response, stop_reason = "tool_use"
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Let me pull up the account and the invoice." },
    { "type": "tool_use", "id": "toolu_01A", "name": "get_customer",
      "input": { "customer_id": "C-88213" } },
    { "type": "tool_use", "id": "toolu_01B", "name": "lookup_invoice",
      "input": { "invoice_id": "INV-5531" } }
  ]
}

// next user message built by the loop
{
  "role": "user",
  "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01A",
      "content": "{\\"customer_id\\":\\"C-88213\\",\\"verified\\":true,\\"plan\\":\\"Unlimited 5G\\"}" },
    { "type": "tool_result", "tool_use_id": "toolu_01B", "is_error": true,
      "content": "{\\"error\\":\\"billing service timed out after 10s\\",\\"retryable\\":true}" }
  ]
}`,
        },
      ],
      walkthrough: `1. Claude asked for two tools in one response, so \`stop_reason\` is \`tool_use\`. The text "Let me pull up the account" is narration; the loop ignores it for control flow.
2. The loop appends the whole assistant message first. Dropping the \`tool_use\` blocks from history would leave the results with nothing to pair with.
3. Both tools run. \`get_customer\` succeeds; \`lookup_invoice\` times out. Both results go into **one** user message, each tagged with the \`tool_use_id\` it answers.
4. The timeout becomes a \`tool_result\` with \`is_error: true\` and a message that says the error is retryable. On the next call Claude can retry the lookup or tell the customer the billing system is slow. Raising an exception here would have killed the conversation; returning an empty success would have let Claude assume there was no invoice.
5. Each branch is deliberate: \`pause_turn\` resumes, \`max_tokens\` is treated as truncation, \`refusal\` is handled, and \`end_turn\` returns. The \`MAX_ITERATIONS\` check sits outside all of that and only fires if the normal signals never arrive.`,
    },
    compare: {
      question: 'Should Claude choose the next tool from context in an agent loop, or should your code follow a pre-configured decision tree or fixed sequence of calls?',
      a: {
        title: 'Model-driven agent loop driven by stop_reason',
        body: 'Claude reasons about which tool to call next from the conversation and the tool results so far; the loop runs until `end_turn`, with an iteration cap as a backstop. Flexible, but each run can take a different path and cost.',
        chooseWhen: 'The steps depend on what earlier tools return and cannot be listed in advance, such as diagnosing an unfamiliar billing dispute.',
      },
      b: {
        title: 'Pre-configured decision tree or fixed workflow in code',
        body: 'Your code branches on predefined conditions and makes a known series of calls (for example: extract fields, then classify, then draft a reply), possibly forcing a specific tool with `tool_choice` at each step. Predictable cost and easy to test.',
        chooseWhen: 'The same steps happen in the same order every time, such as a nightly job that always extracts and then validates one document.',
      },
      decidingDetail:
        'Whether the number and order of steps is known before the task starts. If you can write the steps down in advance, a fixed workflow is cheaper and more predictable. If the next step depends on what the last tool returned, you need a loop that lets Claude decide, and `stop_reason` tells you when it is finished.',
    },
    mistake: {
      mistake:
        'Ending the loop when the assistant text contains a phrase such as "Final answer" or "DONE" (or simply whenever the response contains a text block), and relying on a small iteration cap (say 5) to end everything else.',
      whyTempting:
        'It works in demos: the prompt asks Claude to say "DONE", and short conversations finish within the cap. Text checks also feel intuitive because that is how a human reads the reply.',
      howToRecognize:
        'Look for string matching on response text in the control flow, tool_use blocks that never receive results because the loop exited early, conversations that end mid-task at exactly the cap, or code that never reads `stop_reason`.',
      fix:
        'Branch on `stop_reason`: continue on `tool_use`, return on `end_turn`, and handle `max_tokens`, `pause_turn`, `stop_sequence`, and `refusal` explicitly. Keep a generous iteration cap as a backstop, log every cap hit, and investigate those traces.',
    },
    exercise: {
      prompt: 'For each response, choose what the loop should do next.',
      inputs: `Each item is a summary of one Messages API response in a support agent.

\`\`\`text
1. stop_reason=tool_use; content: text "All done, refund issued!" + tool_use issue_refund
2. stop_reason=end_turn; content: text summarizing the resolved plan change
3. stop_reason=max_tokens; content ends inside a tool_use block whose input JSON is cut off
4. stop_reason=pause_turn; content: partial server-side web search work
5. stop_reason=refusal; content: Claude declines the request
6. stop_reason=tool_use; content: two tool_use blocks (lookup_invoice, lookup_transaction)
\`\`\``,
      labels: [
        'Execute tools and continue',
        'Return the turn as finished',
        'Send the content back unchanged and continue',
        'Handle truncation',
        'Stop and handle the refusal',
      ],
      items: [
        { id: '1', text: 'tool_use with text claiming the refund is done', answer: 'Execute tools and continue', why: 'The stop_reason is tool_use, so the refund has not run yet. The text is narration; executing the tool and returning its result is the only correct move.' },
        { id: '2', text: 'end_turn with a summary', answer: 'Return the turn as finished', why: 'end_turn is the normal completion signal; there are no tool calls waiting for results.' },
        { id: '3', text: 'max_tokens inside a tool_use block', answer: 'Handle truncation', why: 'The tool input is incomplete, so executing it would act on partial data. Raise max_tokens or retry the step deliberately.' },
        { id: '4', text: 'pause_turn during server-side tool work', answer: 'Send the content back unchanged and continue', why: 'pause_turn means the API paused a long turn. Appending the assistant content as-is and calling again lets Claude resume.' },
        { id: '5', text: 'refusal', answer: 'Stop and handle the refusal', why: 'Claude declined for safety reasons. Retrying the same request in a loop will not change that; route it to your refusal handling.' },
        { id: '6', text: 'tool_use with two blocks', answer: 'Execute tools and continue', why: 'Run both tools and return both tool_result blocks, each with its own tool_use_id, in a single user message.' },
      ],
      solution:
        'Only `stop_reason` decides the branch. Items 1 and 6 both continue: item 1 is the classic trap, because the text sounds finished while a tool call is still pending. Item 3 must not be executed because its input is truncated. Item 4 resumes with the content unchanged. Items 2 and 5 end the loop, but for different reasons, and item 5 needs its own handling path rather than a retry.',
    },
    check: [
      {
        id: '1.1-c1',
        id: '1.1-c1',
        stem: 'Claude returns one response with three tool_use blocks. How should the loop return the results?',
        options: [
          { id: 'a', text: 'Three user messages, one tool_result each, sent in the order the tools finished' },
          { id: 'b', text: 'One user message with three tool_result blocks, each matched by tool_use_id' },
          { id: 'c', text: 'One user message with a single text block summarizing all three tool outputs' },
          { id: 'd', text: 'Only the first tool\'s result, then wait for Claude to request the other two' },
        ],
        correct: 'b',
        why: 'All results for one assistant turn go back together in one user message, each tool_result paired to its tool_use_id. Separate messages in finishing order break that pairing, and a text summary or partial set leaves tool_use blocks without results.',
      },
      {
        id: '1.1-c2',
        id: '1.1-c2',
        stem: 'lookup_invoice times out. What should the loop send back to Claude?',
        options: [
          { id: 'a', text: 'Nothing for that call; send the other results and let Claude notice the gap itself' },
          { id: 'b', text: 'A tool_result with empty content, so Claude treats it as no invoice found' },
          { id: 'c', text: 'A tool_result with is_error: true saying the lookup timed out and may retry' },
          { id: 'd', text: 'Raise an exception, end the conversation, and log the timeout for support' },
        ],
        correct: 'c',
        why: 'An is_error result keeps the call paired and tells Claude what failed, so it can retry or explain. Empty content is tempting because it keeps the loop going, but it turns an access failure into a false "no invoice" answer.',
      },
      {
        id: '1.1-c3',
        id: '1.1-c3',
        stem: 'Logs show 8% of conversations end because the loop hit its 30-iteration cap. What is the best first step?',
        options: [
          { id: 'a', text: 'Raise the cap to 100 so the long-running conversations have room to finish' },
          { id: 'b', text: 'Lower the cap to 10 so runaway conversations cost less before they stop' },
          { id: 'c', text: 'Tell Claude in the system prompt to finish every task within 30 steps' },
          { id: 'd', text: 'Inspect those traces for the cause, e.g. a tool that keeps failing' },
        ],
        correct: 'd',
        why: 'The cap is a backstop, not the stopping mechanism. Frequent hits mean a real defect, such as repeated tool errors or missing tool_result blocks. Raising the cap only lets the same defect run longer and cost more.',
      },
    ],
    review: [
      { front: 'Which field decides whether the agent loop continues?', back: 'stop_reason. Continue on tool_use; finish on end_turn; handle max_tokens, pause_turn, stop_sequence, and refusal explicitly. Never parse the text.' },
      { front: 'How do tool results go back for a turn with several tool_use blocks?', back: 'One user message with a tool_result per tool_use, each tool_use_id matching, results first in the content; failures use is_error: true.' },
      { front: 'What is an iteration cap for?', back: 'A safety backstop against runaway loops. Frequent cap hits are a bug to investigate, not a setting to tune.' },
      { front: 'Model-driven tool selection or a pre-configured decision tree?', back: 'Model-driven when the next step depends on what earlier results revealed; a fixed tree or sequence when the steps are the same every time. Rules that must never be skipped get code gates either way.' },
    ],
    sources: ['guide-d1', 'api-tool-use', 'api-implement-tool-use', 'api-stop-reasons', 'eng-building-agents'],
    notes: [
      {
        date: '2026-11-21',
        text: 'The exam guide frames loop control around `tool_use` (continue) and `end_turn` (stop). The API defines further `stop_reason` values (`max_tokens`, `stop_sequence`, `pause_turn`, `refusal`), and the set has grown over time. Verify the current list against the stop-reasons docs, and give unknown values an explicit fallback branch rather than assuming success.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 1.2 Coordinator–subagent systems, delegation, aggregation
  // ---------------------------------------------------------------------------------------------
  {
    id: '1.2',
    title: 'Coordinator–subagent design, delegation, and aggregation',
    outcome:
      'Given a research request and a coordinator trace, decide how the work should be decomposed and delegated, what the coordinator must check before synthesis, and where to fix a final report that is too narrow.',
    minutes: 25,
    terms: [
      { term: 'Coordinator (orchestrator)', definition: 'The agent that receives the request, plans the work, delegates sub-tasks, and combines the results into the final answer.' },
      { term: 'Subagent', definition: 'A separate agent instance with its own prompt, tools, and context window that performs one delegated task and returns a result to the coordinator.' },
      { term: 'Hub-and-spoke', definition: 'A topology in which all communication goes through the coordinator; subagents do not talk to each other directly.' },
      { term: 'Task decomposition', definition: 'Splitting a request into sub-tasks with clear objectives, boundaries, and output formats that together cover the whole request.' },
      { term: 'Aggregation', definition: 'Combining subagent outputs into one result while keeping sources, surfacing conflicts, and noting gaps.' },
      { term: 'Coverage check', definition: 'A coordinator step that compares the gathered results against every part of the original request before synthesis and re-delegates any gaps.' },
      { term: 'Iterative refinement loop', definition: 'The coordinator evaluates the synthesized draft for gaps, sends targeted follow-up queries to the search or analysis subagents, and re-runs synthesis until coverage is sufficient or a round limit is reached.' },
    ],
    learningPoints: [
      'Explain hub-and-spoke: the coordinator owns all communication between subagents, error handling, and routing of information, and routing everything through it gives observability and consistent error handling.',
      'Explain that each subagent works in an isolated context and never automatically sees the coordinator\'s conversation, so the coordinator must hand it what it needs.',
      'Describe the coordinator\'s jobs: decomposing the task, delegating, aggregating results, and choosing which subagents a query actually needs based on its complexity.',
      'Partition scope across subagents (distinct subtopics or source types) so their work does not overlap.',
      'Trace a narrow final output back to an overly narrow decomposition instead of blaming subagents that did what they were asked.',
      'Run an iterative refinement loop: evaluate the synthesis for gaps, re-delegate targeted queries, and re-invoke synthesis until coverage is sufficient.',
      'Recognize when a single agent beats a multi-agent design: tightly coupled steps, small tasks, heavy shared context, or tight cost and latency budgets.',
    ],
    concept: `A coordinator–subagent system splits one big job across several agents. A **coordinator** reads the request, decides what work is needed, hands pieces to **subagents**, and builds the final answer from what they return. Each subagent works in its own **isolated** context with its own instructions and tools, so it can explore deeply without filling the coordinator's context with raw search results. The flip side: a subagent does not inherit the coordinator's conversation. It has not seen the user's question, their clarifications, or other subagents' findings unless the coordinator writes them into its task.

### Hub-and-spoke

All traffic flows through the coordinator. Subagents do not message each other; if the report writer needs the data analyst's numbers, the coordinator passes them along. When a subagent fails, the failure comes back to the coordinator, which decides whether to retry, re-scope, or report the gap. This keeps one place responsible for the plan, gives you one log of what each agent received (observability), controls what information flows where, and lets the coordinator apply consistent rules (citation format, error handling, budget) to everything. Direct agent-to-agent shortcuts save a little latency and lose all of that.

### Choosing which subagents to invoke

A coordinator should not push every query through the full pipeline. It first reads what the query needs: "What was Acme's 2024 revenue?" may need only the data analyst; a broad market question may need web research, document analysis, and data together. Invoking only the needed subagents saves cost and latency, and the coordinator can add more later if the first results show a need.

### Decomposition and delegation

The coordinator's most important output is the plan. Good delegated tasks are:

- **Scoped**: one clear objective with explicit boundaries ("EU rules only, 2023 onward").
- **Complete together**: the set of tasks covers every part of the request.
- **Partitioned**: each subagent gets a distinct slice (a subtopic, a region, or a source type such as filings versus news) and is told what belongs to the others, so two agents do not fetch and summarize the same material.
- **Specified**: each says what to return (claims with source URL and date, or a table) so results can be merged.

Vague delegation ("research battery regulation") produces overlapping, shallow, or mismatched results.

### Aggregation and coverage

When results come back, the coordinator merges them, keeps each claim tied to its source, and surfaces conflicts instead of silently picking one value. It then runs a **coverage check**: does each part of the original request have supporting results? If a region, time period, or sub-question is missing, the coordinator delegates again. This check belongs to the coordinator because only it holds the full request and the plan.

The check can also run on the synthesis itself, as an **iterative refinement loop**: the synthesis subagent drafts the report, the coordinator compares the draft with the request's dimensions, sends targeted follow-up queries for each gap to the search or analysis subagents, and re-invokes synthesis with the new findings. It repeats until coverage is sufficient, with a maximum number of rounds as a backstop and any remaining gaps stated in the report.

### Root-causing narrow output

If the final report covers only part of the question, look at the decomposition first. Subagents faithfully research what they are given. When every sub-task was about one region, the report will be about one region, however good each subagent is. Fix the coordinator's planning prompt and add a coverage check; tuning the subagents will not help.

### When one agent is better

Multi-agent systems cost more tokens and add latency and coordination overhead. They pay off for broad work that splits into independent, exploration-heavy parts. Choose a single agent when steps are tightly coupled, each step needs the full history, the task is small, or cost and latency matter more than breadth.`,
    example: {
      intro:
        'A research coordinator built with the Claude Agent SDK in TypeScript, its planning prompt, and a trace from a run that produced a report covering only one of the three regions the analyst asked about.',
      artifacts: [
        {
          lang: 'typescript',
          caption: 'coordinator.ts: the coordinator delegates through the Task tool to specialized subagents',
          code: `import { query } from '@anthropic-ai/claude-agent-sdk';
import { COORDINATOR_PROMPT } from './prompts';

const question =
  'How will battery-recycling regulations affect EV makers selling in the US, EU and China over the next five years?';

for await (const message of query({
  prompt: question,
  options: {
    systemPrompt: COORDINATOR_PROMPT,
    // Task lets the coordinator spawn subagents; the others are pre-approved for them.
    allowedTools: ['Task', 'WebSearch', 'WebFetch', 'Read', 'Grep', 'mcp__metrics__run_query'],
    agents: {
      'web-researcher': {
        description: 'Researches ONE scoped sub-question on the public web. Returns claims with URL, publisher and date.',
        prompt: 'You research exactly the sub-question you are given. Stay inside its scope. Return JSON: {claims:[{claim,url,publisher,date}], gaps:[...]}',
        tools: ['WebSearch', 'WebFetch'],
      },
      'doc-analyst': {
        description: 'Reads analyst-supplied PDFs and filings for a scoped question. Returns claims with file and page.',
        prompt: 'Answer only from the documents named in your task. Return JSON with file, page and quote for every claim.',
        tools: ['Read', 'Grep'],
      },
      'data-analyst': {
        description: 'Queries the internal metrics warehouse for figures requested by the coordinator.',
        prompt: 'Run read-only queries. Return the query, the result rows and the as-of date.',
        tools: ['mcp__metrics__run_query'],
      },
    },
  },
})) {
  if (message.type === 'result') console.log(message);
}`,
        },
        {
          lang: 'markdown',
          caption: 'prompts.ts (excerpt): the coordinator owns decomposition and the coverage check',
          code: `## Planning
1. List every dimension the question names (regions, time span, stakeholders, metrics).
2. Create sub-tasks so that every dimension is covered by at least one sub-task.
   Give each: objective, scope boundary, which subagent, and the return format.
3. Launch independent sub-tasks in the same response so they run in parallel.

## Before writing the report (coverage check)
- For each dimension from step 1, list the claims that support it.
- If any dimension has no supporting claims, delegate a new sub-task for it.
- Record conflicting values with their sources; do not pick one silently.
- Only then synthesize the report.`,
        },
        {
          lang: 'text',
          caption: 'Trace from a run BEFORE the planning prompt had the coverage check',
          code: `coordinator plan:
  T1 web-researcher : "US federal battery-recycling rules affecting EV makers"
  T2 web-researcher : "US state-level EV battery take-back laws"
  T3 doc-analyst    : "Recycling cost assumptions in the supplied US 10-K filings"
results:
  T1 ok  14 claims (all US)
  T2 ok   9 claims (all US)
  T3 ok   6 claims (all US)
final report: thorough US analysis; EU and China not mentioned`,
        },
      ],
      walkthrough: `1. The question names three regions. The trace shows the coordinator created three sub-tasks, all about the US. Every subagent succeeded and stayed in scope.
2. Because each subagent did exactly what it was asked, the narrow report is not a subagent defect. Adding "be comprehensive" to the web-researcher prompt would not make it research the EU, which it was never asked about.
3. The root cause is the coordinator's decomposition. The fixed planning prompt makes the coordinator enumerate the question's dimensions (US, EU, China; five-year span) and map each to at least one sub-task.
4. The coverage check runs **after** results return and **before** synthesis. If the EU sub-task came back empty or failed, the coordinator would see an uncovered dimension and delegate again instead of writing around the gap.
5. Hub-and-spoke is visible in the config: subagents have narrow tools and return structured JSON to the coordinator, which is the only agent that sees all results and writes the synthesis.`,
    },
    compare: {
      question: 'Should a new research feature use a coordinator with subagents or a single agent with all the tools?',
      a: {
        title: 'Single agent with all tools',
        body: 'One agent plans, searches, reads, and writes in one context. Simpler to build and debug, with lower token cost and latency, but its context fills up on broad tasks.',
        chooseWhen: 'The task is small or tightly sequential, each step needs everything learned so far, and cost or latency is a primary constraint.',
      },
      b: {
        title: 'Coordinator with specialized subagents',
        body: 'The coordinator decomposes the request and delegates independent sub-questions to subagents that each explore in a fresh context, often in parallel. Higher token cost and more moving parts, but much more breadth.',
        chooseWhen: 'The request splits into several independent, exploration-heavy parts whose raw material would overflow or clutter one context.',
      },
      decidingDetail:
        'Whether the work splits into independent parts. Subagents pay off when sub-questions can be researched separately and only their condensed findings need to meet. When each step depends on the full detail of the previous one, splitting forces you to pass large context around, and a single agent is cheaper and more reliable.',
    },
    mistake: {
      mistake:
        'When a multi-agent report misses part of the question, editing the subagent prompts ("be thorough", "cover all regions") or swapping in a stronger subagent model.',
      whyTempting:
        'Subagents do the visible research work, so missing content looks like a research failure. Prompt tweaks on the subagent are also the quickest change to make.',
      howToRecognize:
        'Compare the coordinator\'s plan with the original request. If every sub-task succeeded and stayed in scope, but the plan never assigned the missing part, the gap was created during decomposition.',
      fix:
        'Change the coordinator: make it enumerate the request\'s dimensions, map each to a sub-task, and run a coverage check before synthesis that re-delegates any uncovered dimension.',
    },
    exercise: {
      prompt: 'For each symptom, label where the fix belongs.',
      inputs: `Research system: coordinator plus web-researcher, doc-analyst, data-analyst. Each line is a symptom seen in review.

\`\`\`text
1. Request covered 2019-2024; every sub-task the coordinator issued was limited to 2023-2024.
2. Two subagents reported different 2024 market sizes; the report states one number with no mention of the other.
3. web-researcher was asked for EU rules and returned claims without URLs although its prompt requires them.
4. A one-paragraph "summarize this memo" request goes through four subagents and takes 3 minutes.
5. The doc-analyst failed on one PDF; the report was written anyway with no note of the gap.
6. Three web-researcher tasks ("market", "policy", "projects") each fetched and summarized the same EU policy document.
\`\`\``,
      labels: ['Coordinator decomposition', 'Coordinator aggregation or coverage check', 'Subagent execution', 'Use a single agent instead'],
      items: [
        { id: '1', text: 'Every sub-task limited to 2023-2024', answer: 'Coordinator decomposition', why: 'The subagents could not cover years they were never assigned. The coordinator\'s plan dropped part of the requested time span.' },
        { id: '2', text: 'Conflicting market sizes collapsed into one', answer: 'Coordinator aggregation or coverage check', why: 'Both subagents returned results; the coordinator merged them and hid the conflict instead of reporting both values with sources.' },
        { id: '3', text: 'Claims returned without required URLs', answer: 'Subagent execution', why: 'The task and its output format were clear, and the subagent did not follow them. Fix the subagent prompt, tools, or output validation.' },
        { id: '4', text: 'Four subagents for a one-paragraph summary', answer: 'Use a single agent instead', why: 'A small, single-source task gains nothing from parallel exploration and pays the coordination overhead in cost and latency.' },
        { id: '5', text: 'Report written despite a failed PDF', answer: 'Coordinator aggregation or coverage check', why: 'The coordinator should notice an uncovered part before synthesis and retry, re-delegate, or state the gap explicitly.' },
        { id: '6', text: 'Three tasks summarized the same policy document', answer: 'Coordinator decomposition', why: 'The scopes overlapped. The coordinator should partition the work into distinct subtopics or source types and tell each subagent what belongs to the others.' },
      ],
      solution:
        'Ask two questions for each symptom: was the work ever assigned, and did the assignee follow the assignment? Item 1 was never assigned (decomposition). Item 3 was assigned clearly and not followed (subagent). Items 2 and 5 came back fine or failed visibly, and the coordinator mishandled the merge (aggregation and coverage). Item 4 is an architecture choice: the task is too small to need delegation (a coordinator that chose subagents by query complexity would not have fanned out). Item 6 is a partitioning failure in the plan.',
    },
    check: [
      {
        id: '1.2-c1',
        id: '1.2-c1',
        stem: 'In a hub-and-spoke design, the report writer needs figures that the data analyst found. How do they reach it?',
        options: [
          { id: 'a', text: 'The data analyst sends its figures to the report writer in a direct message' },
          { id: 'b', text: 'The report writer reads the figures from the data analyst\'s context window' },
          { id: 'c', text: 'The coordinator passes the figures in the task it gives the report writer' },
          { id: 'd', text: 'Each subagent queries the warehouse itself so both have the same figures' },
        ],
        correct: 'c',
        why: 'All communication goes through the coordinator, which passes results explicitly in each task. A direct message bypasses the hub, and subagents never share context windows.',
      },
      {
        id: '1.2-c2',
        id: '1.2-c2',
        stem: 'A report about three markets discusses only one. Every subagent completed its task and stayed in scope. Where is the root cause most likely?',
        options: [
          { id: 'a', text: 'The web-researcher prompt did not demand thorough enough research per market' },
          { id: 'b', text: 'The subagents ran on a model too small to cover three markets in depth' },
          { id: 'c', text: 'The search tool returned too few results for the other two markets' },
          { id: 'd', text: 'The coordinator\'s decomposition never assigned the other two markets' },
        ],
        correct: 'd',
        why: 'If every subagent succeeded within its scope, the missing markets were never in scope, and decomposition belongs to the coordinator. A more thorough researcher prompt would only deepen the one market it was given.',
      },
      {
        id: '1.2-c3',
        id: '1.2-c3',
        stem: 'Which task is the strongest candidate for a single agent rather than a coordinator with subagents?',
        options: [
          { id: 'a', text: 'Surveying regulation across ten countries, each researched in parallel' },
          { id: 'b', text: 'Comparing five vendors, each needing deep independent web research' },
          { id: 'c', text: 'A broad market study drawing on web, document, and warehouse sources' },
          { id: 'd', text: 'Refactoring one function where each edit depends on the previous one' },
        ],
        correct: 'd',
        why: 'Tightly coupled sequential steps that need the full previous context gain little from splitting. The other three are broad and divide into independent parts, such as one subagent per vendor or per source type.',
      },
    ],
    review: [
      { front: 'Who owns decomposition, aggregation, and the coverage check?', back: 'The coordinator. It alone sees the full request, the plan, and all results.' },
      { front: 'A multi-agent report is too narrow but every subagent succeeded. First place to look?', back: 'The coordinator\'s decomposition: the missing parts were probably never assigned.' },
      { front: 'When does a single agent beat a multi-agent system?', back: 'Small or tightly coupled tasks where each step needs full shared context, or when cost and latency outweigh breadth.' },
      { front: 'What is the iterative refinement loop in a research coordinator?', back: 'Evaluate the synthesized draft for gaps, re-delegate targeted queries to search or analysis subagents, re-invoke synthesis, and stop when coverage is sufficient or a round limit is hit, stating any remaining gaps.' },
    ],
    sources: ['guide-d1', 'eng-multi-agent', 'eng-building-agents', 'sdk-subagents', 'sdk-overview'],
    notes: [
      {
        date: '2026-11-21',
        text: 'The exam guide names the Task tool as the subagent-spawning mechanism, and the example follows it. Current SDK releases may call the same tool Agent, and option names such as `allowedTools`, `systemPrompt`, and `agents` can change between versions. Check current docs before copying the configuration.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 1.3 Subagent invocation, spawning, explicit context passing
  // ---------------------------------------------------------------------------------------------
  {
    id: '1.3',
    title: 'Spawning subagents and passing context explicitly',
    outcome:
      'Given a coordinator configuration and a delegation call, decide whether the subagent can be spawned and has what it needs, and rewrite the call so context is passed explicitly and independent work runs in parallel.',
    minutes: 25,
    terms: [
      { term: 'Task tool', definition: 'The Agent SDK tool a coordinator calls to spawn a subagent. Its input names the subagent type and gives it a task prompt. The coordinator\'s allowedTools must include "Task".' },
      { term: 'AgentDefinition', definition: 'Configuration for a named subagent: description (when to use it), prompt (its system instructions), tools (what it may call), and optionally a model.' },
      { term: 'allowedTools', definition: 'Option listing tools that may run without a permission prompt. The coordinator needs the Task tool here to spawn subagents.' },
      { term: 'Context isolation', definition: 'A subagent starts with a fresh context. It does not see the coordinator\'s conversation, earlier tool results, or other subagents\' work.' },
      { term: 'Explicit context passing', definition: 'Putting everything a subagent needs (findings, identifiers, sources, constraints, output format) directly into its task prompt.' },
      { term: 'fork_session', definition: 'Session option that, when resuming, starts a new branch from an existing session\'s history without changing the original.' },
      { term: 'Goal-and-criteria prompt', definition: 'A delegation prompt that states what the subagent must achieve and how good the result must be (coverage, source standards, output format) instead of dictating each step.' },
    ],
    learningPoints: [
      'Explain that subagents are spawned through the Task tool, so "Task" must be in the coordinator\'s allowedTools.',
      'Configure an AgentDefinition per subagent type: a description the coordinator uses to choose it, a system prompt, and a restricted tool list.',
      'Explain that a subagent gets only its task prompt and its own system prompt: no parent conversation and no memory shared between invocations.',
      'Pass complete prior findings (for example search results and document-analysis output for a synthesis subagent) in the prompt, with content separated from metadata such as URL, document name, and page.',
      'Spawn independent subagents in parallel by emitting several Task calls in one coordinator response, and serialize only when one task needs another\'s output.',
      'Write coordinator prompts that state goals and quality criteria rather than step-by-step procedures, so subagents can adapt.',
      'Use a forked session, rather than a fresh subagent, when divergent approaches must start from the same full analysis baseline.',
    ],
    concept: `A coordinator spawns a subagent by calling a tool, usually named **Task**. The call names which subagent to use and gives it a task prompt. The subagent runs with its own context and tools, and its final answer comes back to the coordinator as that tool call's result. From the coordinator's point of view, delegating is just another tool call.

### Configuration

Subagents are declared as **AgentDefinition** entries keyed by name:

- \`description\`: when to use this subagent. The coordinator reads it to choose, so make it specific ("Reads analyst-supplied PDFs; returns claims with file and page").
- \`prompt\`: the subagent's own system instructions.
- \`tools\`: the tools it may use. Keep this narrow; a document analyst does not need web search.

The coordinator itself must be allowed to call the Task tool. If \`Task\` is missing from the coordinator's \`allowedTools\`, it cannot delegate, however well the agents are defined.

### Subagents start fresh

A subagent does **not** inherit the coordinator's conversation. It has not seen the user's request, earlier search results, or other subagents' outputs. "Verify the claims we found earlier" is meaningless to it. Everything it needs must be in the task prompt:

- the objective and scope boundary,
- the specific inputs (claims, file names, IDs), with **structured metadata** such as source URL, publisher, date, and page,
- constraints and the exact output format.

Pass the findings themselves, **complete**: a synthesis subagent should receive the actual web search results and the document analyst's output, not "the results from earlier". Structure them so **content is separate from metadata**: each entry has the claim or excerpt in one field and its source URL, document name, page number, and date in others. That separation lets downstream agents quote, merge, and re-cite without losing attribution. If a subagent receives claims stripped of their sources, it cannot return sourced conclusions.

Isolation also holds **between invocations**: calling the same subagent type twice does not give the second call any memory of the first. If the second call needs the first call's output, the coordinator passes it in.

### Goals and quality criteria, not procedures

Tell a subagent *what* to achieve and *how good* the result must be: the objective, the scope, what counts as sufficient evidence (for example "two independent sources, at least one primary"), and the output format. Avoid scripting its steps ("run these three queries, open the top five results, summarize each in 100 words"). A step list fails as soon as reality differs from the plan, such as paywalled results or an empty query; a goal with criteria lets the subagent change queries or sources and still meet the bar.

### Parallel spawning

When sub-tasks are independent, the coordinator should emit several Task calls **in the same response**; they run in parallel. Issuing one Task, waiting, and then issuing the next makes the run as slow as the sum of the parts. Run tasks in sequence only when one needs another's output.

### Scoped and forked context

Fresh context is a feature: each subagent sees only what is relevant, which keeps it focused and stops one subagent's noise from leaking into another. When you instead want a branch that keeps the **whole** history, use fork-based session management: resume the analysis session with \`fork_session\`, which creates a new branch from that shared baseline and leaves the original session unchanged. This suits exploring divergent approaches, such as two different fixes, when the baseline analysis is too large or nuanced to summarize into a task prompt. Choose a fresh subagent for a curated slice of context, and a fork for the full history (lesson 1.7 covers sessions in depth).`,
    example: {
      intro:
        'A Python coordinator using the Claude Agent SDK, followed by one coordinator response that spawns two subagents in parallel with all the context they need written into each task prompt.',
      artifacts: [
        {
          lang: 'python',
          caption: 'coordinator.py: Task is in allowed_tools; each subagent has scoped tools',
          code: `from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

options = ClaudeAgentOptions(
    system_prompt=COORDINATOR_PROMPT,
    allowed_tools=["Task", "WebSearch", "WebFetch", "Read", "Grep"],
    agents={
        "web-researcher": AgentDefinition(
            description="Verifies or extends ONE scoped set of claims using public web sources. "
                        "Returns JSON claims with url, publisher, date and a verdict.",
            prompt="Work only from the task you are given. Never drop source metadata. "
                   "If you cannot verify a claim, say so and explain why.",
            tools=["WebSearch", "WebFetch"],
        ),
        "doc-analyst": AgentDefinition(
            description="Answers a scoped question from analyst-supplied files only. "
                        "Returns JSON claims with file, page and a short quote.",
            prompt="Use only the files named in your task. Quote the passage behind every claim.",
            tools=["Read", "Grep"],
        ),
    },
)

async for message in query(prompt=analyst_question, options=options):
    handle(message)`,
        },
        {
          lang: 'json',
          caption: 'One coordinator response: two Task calls in the same turn run in parallel',
          code: `[
  { "type": "tool_use", "id": "toolu_07X", "name": "Task",
    "input": {
      "subagent_type": "web-researcher",
      "description": "Verify EU recycled-content claims",
      "prompt": "Objective: verify the three claims below about EU battery recycled-content targets. Scope: EU-level rules only; ignore member-state law.\\n\\nClaims (from earlier research):\\n1. {claim: 'Recycled cobalt target applies from 2031', source: 'https://example.org/eu-battery-reg', publisher: 'Example Policy Review', date: '2024-03-02'}\\n2. {claim: 'Targets rise in a second phase', source: 'https://example.org/eu-battery-reg', publisher: 'Example Policy Review', date: '2024-03-02'}\\n3. {claim: 'Lithium target is lower than cobalt', source: 'https://example.net/brief', publisher: 'Example Trade Brief', date: '2023-11-18'}\\n\\nReturn JSON: [{claim_no, verdict: confirmed|contradicted|unverified, evidence_url, publisher, date, note}]" } },
  { "type": "tool_use", "id": "toolu_07Y", "name": "Task",
    "input": {
      "subagent_type": "doc-analyst",
      "description": "Extract recycling cost assumptions",
      "prompt": "Objective: find recycling cost assumptions in these files only: filings/makerA_2024_10K.pdf, filings/makerB_2024_annual.pdf. Question: what per-kWh recycling or end-of-life cost does each company assume, and for which years?\\n\\nReturn JSON: [{company, assumption, years, file, page, quote}]. If a file has no such assumption, return an entry with assumption: null and a note." } }
]`,
        },
      ],
      walkthrough: `1. \`allowed_tools\` includes \`Task\`, so the coordinator can delegate. The subagents' own tools are narrow: the doc analyst cannot browse the web, and the web researcher cannot read local files.
2. Each \`description\` says what the subagent does and what it returns. That is the text the coordinator uses to choose \`subagent_type\`.
3. The web-researcher prompt does not say "check the claims from before". It lists each claim **with** its URL, publisher, and date, states the scope, and fixes the output format. The subagent can work without ever seeing the coordinator's history, and its answer keeps the source metadata the coordinator needs when it merges results.
4. The doc-analyst prompt names the exact files. Without that it would not know which documents the analyst supplied.
5. Both Task calls appear in the **same** assistant response, so they run in parallel. Neither needs the other's output. A later report-writing step that needs both results would be issued only after they return.`,
    },
    compare: {
      question: 'Should the coordinator spawn these subagents in one response or one after another?',
      a: {
        title: 'Parallel: several Task calls in one response',
        body: 'The coordinator emits all independent Task calls together; they run concurrently and their results come back to the coordinator to merge. Wall-clock time is roughly that of the slowest task.',
        chooseWhen: 'The sub-tasks are independent, such as researching different regions or analyzing different documents.',
      },
      b: {
        title: 'Sequential: one Task, wait, then the next',
        body: 'The coordinator waits for each result before deciding and issuing the next call, so later prompts can include earlier findings.',
        chooseWhen: 'A later task needs an earlier task\'s output, such as writing a report from the analysts\' findings or verifying claims the search has not produced yet.',
      },
      decidingDetail:
        'Whether any task needs another task\'s output as input. If not, sequential spawning only adds latency, so put the Task calls in one response. If it does, the dependent task must wait, and its prompt must carry the earlier results explicitly because the subagent cannot see them otherwise.',
    },
    mistake: {
      mistake:
        'Writing delegation prompts that refer to shared history, such as "Using the sources we found above, check the pricing claims", on the assumption that the subagent sees the coordinator\'s conversation.',
      whyTempting:
        'The coordinator wrote the earlier turns, so the context feels shared, and it works that way when one agent does everything. Short prompts also look tidier and cheaper.',
      howToRecognize:
        'Subagents ask what "above" refers to, re-search from scratch, return generic answers, or invent sources. Delegation prompts contain words like "earlier", "above", "those", or "as discussed" without the actual content.',
      fix:
        'Put everything the subagent needs in its task prompt: objective, scope, the specific inputs with structured metadata (source, publisher, date, page, IDs), constraints, and the output format.',
    },
    exercise: {
      prompt: 'Label each configuration or delegation by its main problem, or mark it as fine.',
      inputs: `A coordinator has subagents web-researcher, doc-analyst, and report-writer defined as AgentDefinition entries.

\`\`\`text
1. allowed_tools=["WebSearch", "Read"]; agents defined as above.
2. Task prompt to web-researcher: "Double-check the three statistics from the earlier search."
3. Coordinator issues Task(web-researcher: EU rules), waits for the result,
   then issues Task(web-researcher: China rules). The two are unrelated.
4. Task to report-writer must use the findings that web-researcher and doc-analyst return.
5. allowed_tools includes "Task"; prompt lists each claim with url, publisher and date,
   gives the scope, and specifies a JSON output.
\`\`\``,
      labels: [
        'Cannot spawn: Task not allowed',
        'Missing context',
        'Should be parallel',
        'Must be sequential',
        'Works as written',
      ],
      items: [
        { id: '1', text: 'allowed_tools without Task', answer: 'Cannot spawn: Task not allowed', why: 'Defining agents is not enough; the coordinator needs the Task tool in allowed_tools to invoke them.' },
        { id: '2', text: '"the three statistics from the earlier search"', answer: 'Missing context', why: 'The subagent never saw the earlier search. The statistics and their sources must be written into the prompt.' },
        { id: '3', text: 'EU then China, issued one at a time', answer: 'Should be parallel', why: 'The two tasks are independent, so both Task calls belong in one response to run concurrently.' },
        { id: '4', text: 'report-writer needs both analysts\' findings', answer: 'Must be sequential', why: 'The report writer depends on their output, so it must be spawned after they return, with their findings included in its prompt.' },
        { id: '5', text: 'Task allowed, full claims and metadata, scope, output format', answer: 'Works as written', why: 'The subagent can be spawned and has everything it needs in its own prompt.' },
      ],
      solution:
        'Check three things in order: can the coordinator call Task at all (item 1), does the prompt carry the actual content rather than references to history (item 2), and does the ordering follow real dependencies (items 3 and 4). Item 5 passes all three.',
    },
    check: [
      {
        id: '1.3-c1',
        id: '1.3-c1',
        stem: 'Agents are defined correctly, but the coordinator never delegates and does all the work itself. What is the most likely configuration cause?',
        options: [
          { id: 'a', text: 'The subagents\' tools lists are too narrow for the work being delegated' },
          { id: 'b', text: 'The coordinator\'s allowedTools list does not include the Task tool' },
          { id: 'c', text: 'The subagent definitions do not specify which model each should use' },
          { id: 'd', text: 'The coordinator prompt is too long, so delegation instructions get lost' },
        ],
        correct: 'b',
        why: 'Delegation happens through the Task tool. Without it in the coordinator\'s allowed tools, the coordinator cannot spawn any subagent. Narrow subagent tool lists would cause failures inside a subagent, not a coordinator that never delegates.',
      },
      {
        id: '1.3-c2',
        id: '1.3-c2',
        stem: 'A subagent must verify claims the coordinator collected from a previous subagent. What should the Task prompt contain?',
        options: [
          { id: 'a', text: 'A pointer, "verify the claims from the previous step", plus the scope' },
          { id: 'b', text: 'Only the scope and output format, since subagents inherit its context' },
          { id: 'c', text: 'The claims with source URL, publisher, and date, plus scope and format' },
          { id: 'd', text: 'The coordinator\'s entire conversation history, so that nothing gets lost' },
        ],
        correct: 'c',
        why: 'Subagents start fresh, so the needed findings and their metadata must be passed explicitly. A pointer to "the previous step" refers to context the subagent never saw, and pasting the whole history wastes context and buries the task.',
      },
      {
        id: '1.3-c3',
        id: '1.3-c3',
        stem: 'After a long investigation session, you want to try two different fixes, each starting from the full investigation history, without altering the original session. Which fits best?',
        options: [
          { id: 'a', text: 'Resume the session with fork_session, once for each attempt' },
          { id: 'b', text: 'Spawn a fresh subagent per attempt with a short summary of findings' },
          { id: 'c', text: 'Resume the original session twice in a row, once per fix' },
          { id: 'd', text: 'Start two new sessions and restate the investigation in each' },
        ],
        correct: 'a',
        why: 'Forking branches from the full existing history and leaves the original unchanged. Resuming twice without forking keeps adding to the same session, and a fresh subagent or new session gets only what you restate.',
      },
    ],
    review: [
      { front: 'Two requirements for a coordinator to spawn a subagent in the Agent SDK?', back: 'The subagent is defined (AgentDefinition: description, prompt, tools) and the coordinator\'s allowedTools includes the Task tool.' },
      { front: 'What does a subagent know about the coordinator\'s conversation?', back: 'Nothing. Pass findings, IDs, sources, scope, and output format explicitly in the task prompt.' },
      { front: 'How do you run independent subagents in parallel?', back: 'Emit multiple Task calls in the same coordinator response. Serialize only when a task needs another\'s output.' },
      { front: 'Step-by-step instructions or goals and criteria in a delegation prompt?', back: 'Goals and quality criteria (objective, scope, evidence standard, output format). Procedural scripts break when results differ from the plan; goals let the subagent adapt.' },
    ],
    sources: ['guide-d1', 'sdk-subagents', 'sdk-permissions', 'sdk-sessions', 'eng-multi-agent'],
    notes: [
      {
        date: '2026-11-21',
        text: 'The exam guide (v1.1) names the Task tool and requires "Task" in the coordinator\'s allowedTools; this lesson follows that. Current SDK and Claude Code releases may name the tool Agent, which changes what you list in allowedTools. The Task input fields shown (`subagent_type`, `description`, `prompt`), whether an omitted `tools` list inherits all tools, and whether subagents may spawn their own subagents can also vary by version. Verify against current docs.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 1.4 Prerequisites and handoffs in multi-step workflows
  // ---------------------------------------------------------------------------------------------
  {
    id: '1.4',
    title: 'Enforcing prerequisites and structured handoffs',
    outcome:
      'Given a multi-step support workflow, decide which rules need a deterministic gate instead of a prompt instruction, implement that gate, and write a handoff summary a human agent can act on without rereading the chat.',
    minutes: 25,
    terms: [
      { term: 'Prerequisite', definition: 'A condition that must be true before a step may run, such as identity verified before a refund.' },
      { term: 'Deterministic enforcement', definition: 'A rule enforced by code (a hook, a gate in the tool layer, or the backend) so it holds on every call regardless of what the model decides.' },
      { term: 'Probabilistic compliance', definition: 'Following a rule because the prompt asks for it. Usually reliable, never guaranteed.' },
      { term: 'PreToolUse hook', definition: 'Agent SDK hook that runs before a tool call executes and can allow, deny, or modify it.' },
      { term: 'Handoff summary', definition: 'A structured record passed to a human when the agent escalates mid-process: who the customer is, what was verified, the root cause found, what was done (with amounts), what is open, and the recommended next action.' },
      { term: 'Multi-concern request', definition: 'One customer message that contains several separate issues, each with its own prerequisites and outcome.' },
    ],
    learningPoints: [
      'Explain the difference between programmatic enforcement of workflow order (hooks, prerequisite gates) and prompt-based guidance.',
      'Explain why prompt instructions alone keep a non-zero failure rate, so rules that need deterministic compliance (identity verified before money moves) need code.',
      'Implement a prerequisite gate that blocks a downstream tool such as issue_refund until get_customer has returned a verified customer ID, with a reason Claude can act on.',
      'Decide when prompt guidance alone is acceptable: preferences and orderings where an occasional miss is cheap and recoverable.',
      'Split a multi-concern request into distinct items, investigate them in parallel with shared context (one verified customer, one account), and synthesize one unified resolution.',
      'Write a structured mid-process handoff (customer ID, root cause, refund amount, actions taken, recommended action) for a human who cannot see the conversation transcript.',
    ],
    concept: `Some rules must hold every single time. "Verify the customer's identity before issuing a refund" is one. Others are preferences, such as "check the invoice before the transaction log". A prompt instruction makes the model *very likely* to follow a rule; a code gate makes it *certain*. The design skill is knowing which rules need which.

### Probabilistic versus deterministic

Instructions in a system prompt are **probabilistic**. Claude follows them most of the time, but the failure rate is never zero: a long conversation, a persuasive customer, or an unusual path can lead to a skipped step. Capital letters, repetition, and few-shot examples lower the rate without removing it. When compliance must be deterministic, such as verifying identity before any financial operation, prompt guidance alone is the wrong tool. A **deterministic** gate is code that runs on every tool call and refuses the action when the prerequisite is not met. In the Agent SDK, a \`PreToolUse\` hook can inspect a pending call such as \`issue_refund\` and deny it unless verification has succeeded for that customer in this case. The denial reason goes back to Claude, which can then do the missing step. Where you control the backend, enforce the same rule there too, so no client can bypass it.

### When prompt guidance is enough

Prompt guidance is acceptable when a miss is cheap and recoverable: tone, the order of read-only lookups, when to summarize, or which of two harmless tools to try first. Use gates for anything irreversible, financial, security-related, or required by policy: refunds, account changes, refund limits, and data disclosure.

### Handoffs to humans

When the agent escalates partway through a process, the human usually works in a different tool and **cannot see the conversation transcript**. Everything they need must travel in a **structured handoff summary**:

- customer ID and verification status (and how verification was done),
- the root cause the agent found (or its best analysis of it),
- the customer's concerns, each with its current status,
- actions already taken, with amounts (for example the refund amount at issue) and reference IDs,
- why the case is escalating,
- a recommended next action.

Structured fields let the ticket system route the case and let the human act at once. A free-text recap tends to omit the one detail that matters, such as a refund already issued.

### Multi-concern requests

Customers often raise several issues at once: "I was double-charged, I want a cheaper plan, and update my address." Treat these as separate concerns:

1. **Decompose** the message into distinct items.
2. **Investigate them in parallel** using shared context: verify the customer once, then issue the independent lookups for every concern together (several tool calls in one turn), all keyed to the same verified customer and account.
3. **Synthesize one unified resolution**: a single reply that addresses every concern, checks cross-concern effects (two credits counted against one case cap; a plan change that alters the disputed charge), and states the outcome of each.

Actions that move money or change the account still pass their own gates. If one concern needs a human, the agent can still resolve the others and then hand off only what remains, with a summary that says which concerns are already done.`,
    example: {
      intro:
        'A Python PreToolUse hook that gates refunds for the Lumen Mobile support agent, followed by the handoff summary the agent produces when one concern exceeds its refund limit.',
      artifacts: [
        {
          lang: 'python',
          caption: 'refund_gate.py: deterministic prerequisite and limit checks before issue_refund runs',
          code: `from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

REFUND_CAP = 150.00  # per-case policy limit for agent-issued refunds and credits


def deny(reason: str) -> dict:
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }


async def gate_refund(input_data, tool_use_id, context):
    case_id = input_data["session_id"]
    args = input_data["tool_input"]
    customer_id = args.get("customer_id")

    # Verification state is recorded by the backend when get_customer completes
    # identity checks; the hook reads it, it never trusts the model's claim.
    if not verification_store.is_verified(case_id, customer_id):
        return deny(
            "Refund blocked: customer identity is not verified in this case. "
            "Call get_customer and complete verification first."
        )

    already = refund_ledger.total_for_case(case_id)
    if already + float(args.get("amount", 0)) > REFUND_CAP:
        return deny(
            f"Refund blocked: case total would exceed the {REFUND_CAP:.0f} USD agent limit "
            f"({already:.2f} already issued). Escalate with escalate_to_human."
        )
    return {}  # no objection: the call proceeds


options = ClaudeAgentOptions(
    mcp_servers={"support": support_server},
    allowed_tools=["mcp__support__get_customer", "mcp__support__lookup_invoice",
                   "mcp__support__issue_refund", "mcp__support__escalate_to_human"],
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="mcp__support__issue_refund", hooks=[gate_refund]),
        ],
    },
)`,
        },
        {
          lang: 'json',
          caption: 'escalate_to_human input: a structured handoff for a three-concern conversation',
          code: `{
  "customer_id": "C-88213",
  "verification": { "status": "verified", "method": "account PIN + last invoice amount" },
  "concerns": [
    { "id": 1, "summary": "Charged twice for October roaming pass (INV-5531)",
      "status": "resolved", "action": "issue_refund 25.00 USD, ref RF-30418" },
    { "id": 2, "summary": "Move from Unlimited 5G to Essentials plan",
      "status": "resolved", "action": "change_plan effective next cycle, ref PC-7712" },
    { "id": 3, "summary": "Disputes 310.00 USD device-protection charges since March",
      "status": "open", "action": "none; amount exceeds agent refund limit" }
  ],
  "root_cause": "Device-protection add-on billed monthly since March; no opt-in record found in the order history",
  "refund_amount_requested": 310.00,
  "escalation_reason": "Requested refund above the 150 USD per-case agent limit",
  "recommended_action": "Review device-protection enrollment date; if the customer never opted in, refund 310.00 USD and remove the add-on.",
  "customer_expectation": "Told a specialist will reply within 1 business day"
}`,
        },
      ],
      walkthrough: `1. The hook matches only \`issue_refund\` (as an SDK MCP tool it is named \`mcp__support__issue_refund\`). Every attempt to call it passes through \`gate_refund\` before anything executes.
2. Verification is checked against state the **backend** recorded, keyed by case and customer, not against what Claude says or what the conversation contains. A customer who claims "I already verified earlier" cannot talk past it.
3. A denial carries a reason written for Claude: what is missing and what to do. Claude receives it and can call \`get_customer\` or escalate instead of retrying blindly.
4. The same hook enforces the 150 USD per-case cap using a running total, so splitting one large refund into several small ones does not get around it.
5. The handoff covers a three-concern conversation. After one verification, the agent looked up all three concerns in parallel, resolved concerns 1 and 2 (marked resolved, with reference IDs), and found the root cause of concern 3. Only concern 3 is open. The human sees who the customer is, that identity is verified, the root cause, the amount at stake, what has already been refunded, why the case escalated, and what to do next. They never need the transcript, which their queue tool cannot show anyway.`,
    },
    compare: {
      question: 'How should the agent ensure identity is verified before account changes?',
      a: {
        title: 'Instruction in the system prompt',
        body: 'Tell Claude: "Always call get_customer and confirm verification before issue_refund or change_plan." Quick to add and usually followed, but not guaranteed on every path.',
        chooseWhen: 'The step is low-stakes and a rare miss is cheap and reversible, such as preferring to look up the invoice before the transaction log.',
      },
      b: {
        title: 'PreToolUse hook or code gate (plus backend check)',
        body: 'Code checks recorded verification state before the call runs and denies it with an actionable reason. Holds on every call, independent of the model\'s reasoning.',
        chooseWhen: 'A single violation causes real harm or breaks policy: money moves, account changes, refund limits, or disclosure of personal data.',
      },
      decidingDetail:
        'The cost of one violation. If skipping the step even once leads to a wrongful refund, an unauthorized account change, or a policy breach, the rule needs deterministic enforcement. If a miss only makes the conversation slightly less efficient and can be corrected, prompt guidance is enough and is cheaper to maintain.',
    },
    mistake: {
      mistake:
        'Responding to a wrongful-refund incident by strengthening the prompt ("CRITICAL: you MUST ALWAYS verify identity before ANY refund") and adding more examples of verification.',
      whyTempting:
        'Prompt edits are fast, need no code deployment, and often reduce the failure rate in testing, so the fix appears to work.',
      howToRecognize:
        'The policy is only written in prompt text; no hook, tool-layer check, or backend rule can block the call. Incidents fall but do not reach zero, and they cluster in long or unusual conversations.',
      fix:
        'Add a PreToolUse hook (or a check inside the tool implementation) that denies issue_refund and change_plan unless verification is recorded for this case, and enforce the same rule in the backend. Keep the prompt instruction so Claude usually verifies first and the gate rarely has to fire.',
    },
    exercise: {
      prompt: 'For each requirement or situation in the Lumen Mobile support agent, choose how it should be handled.',
      inputs: `Policy: identity verification before any account change; agent refunds and credits capped at 150 USD per case; legal threats and suspected fraud go to humans.

\`\`\`text
1. issue_refund must never run for an unverified customer.
2. Greet the customer by first name and restate their issue before calling tools.
3. Customer asks for a 240 USD refund for a billing error.
4. When both could apply, check lookup_invoice before lookup_transaction.
5. change_plan must never run on an account whose identity check failed.
6. Customer writes: "If this isn't fixed today my lawyer will contact you."
\`\`\``,
      labels: ['Deterministic gate (hook or code)', 'Prompt guidance is enough', 'Hand off to a human'],
      items: [
        { id: '1', text: 'No refund without verification', answer: 'Deterministic gate (hook or code)', why: 'One violation is a wrongful refund and a policy breach, so it must hold on every call.' },
        { id: '2', text: 'Greeting and restating the issue', answer: 'Prompt guidance is enough', why: 'A missed greeting is a minor style lapse with no lasting harm.' },
        { id: '3', text: '240 USD refund request', answer: 'Hand off to a human', why: 'It exceeds the 150 USD agent cap. The gate blocks the refund, and the agent escalates with a structured summary.' },
        { id: '4', text: 'Invoice lookup before transaction lookup', answer: 'Prompt guidance is enough', why: 'Both are read-only lookups; the wrong order costs at most one extra call.' },
        { id: '5', text: 'No plan change after failed verification', answer: 'Deterministic gate (hook or code)', why: 'An account change for an unverified caller is exactly the irreversible action a gate exists to stop.' },
        { id: '6', text: 'Legal threat', answer: 'Hand off to a human', why: 'Policy routes legal threats to humans. The handoff should still include the customer ID, verification status, and actions already taken.' },
      ],
      solution:
        'Ask what one miss would cost. Irreversible or policy-bound actions (items 1 and 5) get code gates. Preferences with cheap misses (items 2 and 4) stay in the prompt. Items 3 and 6 are outside the agent\'s authority, so it hands off with a structured summary; for item 3 the refund gate also guarantees the over-limit refund cannot run even if Claude attempts it.',
    },
    check: [
      {
        id: '1.4-c1',
        id: '1.4-c1',
        stem: 'Despite a clear prompt instruction, about 1 in 400 conversations issue a refund before identity is verified. What is the most effective fix?',
        options: [
          { id: 'a', text: 'Repeat the rule at the start and end of the system prompt in capital letters' },
          { id: 'b', text: 'Add few-shot examples that show verification happening before every refund' },
          { id: 'c', text: 'Add a PreToolUse hook that blocks issue_refund until verification is logged' },
          { id: 'd', text: 'Lower the temperature and remind the model of the rule on every user turn' },
        ],
        correct: 'c',
        why: 'Prompt changes and examples can reduce the rate but cannot guarantee zero. A hook that checks recorded verification blocks every unverified refund deterministically.',
      },
      {
        id: '1.4-c2',
        id: '1.4-c2',
        stem: 'Which handoff note best lets a human continue the case without rereading the transcript?',
        options: [
          { id: 'a', text: '"Customer upset about billing; please review the chat and help them out."' },
          { id: 'b', text: 'The full chat transcript attached so the human can read every detail first' },
          { id: 'c', text: 'The model\'s confidence score, a sentiment rating, and the conversation length' },
          { id: 'd', text: 'Customer ID, root cause, actions and amounts, and recommended next step' },
        ],
        correct: 'd',
        why: 'Structured fields tell the human who the customer is, what is already done, and what to do next. A full transcript is complete but makes the human reconstruct all of that, which the handoff is meant to avoid.',
      },
      {
        id: '1.4-c3',
        id: '1.4-c3',
        stem: 'A customer asks, in one message, for a duplicate-charge refund, a plan downgrade, and an address change. How should the agent proceed?',
        options: [
          { id: 'a', text: 'Split it into three concerns, verify once, look up all three in parallel, then send one reply' },
          { id: 'b', text: 'Handle the refund first, then ask the customer to open new chats for the other two requests' },
          { id: 'c', text: 'Escalate the whole conversation to a human, since it contains several unrelated issues at once' },
          { id: 'd', text: 'Call issue_refund, change_plan, and the address update in parallel, then verify identity after' },
        ],
        correct: 'a',
        why: 'Decomposing the request and investigating the concerns in parallel with shared context (one verified customer) is fast, keeps each action\'s gates intact, and ends in one unified resolution. Escalating is unnecessary because the agent can resolve each issue itself.',
      },
    ],
    review: [
      { front: 'Prompt instruction or hook: "never refund an unverified customer"?', back: 'Hook or code gate (and ideally a backend check). One violation is costly, so it must hold every time.' },
      { front: 'When is prompt-only guidance acceptable?', back: 'When a miss is cheap and recoverable: tone, ordering of read-only lookups, and similar preferences.' },
      { front: 'Core fields of a handoff summary?', back: 'Customer ID, verification status, root cause, amount at issue, concerns with status, actions taken with references, escalation reason, recommended next action. Assume the human cannot see the transcript.' },
      { front: 'How should the agent handle one message with three separate problems?', back: 'Decompose into distinct items, investigate them in parallel using shared context (one verified customer), then synthesize one unified reply that covers each item.' },
    ],
    sources: ['guide-d1', 'sdk-hooks', 'sdk-permissions', 'sdk-mcp', 'eng-building-agents'],
    notes: [
      {
        date: '2026-11-21',
        text: 'The exam guide confirms the pattern (programmatic prerequisites and hooks that block downstream tool calls). The hook example uses the Python Agent SDK shape as the author understands it: `HookMatcher`, a callback taking `(input_data, tool_use_id, context)`, and a `hookSpecificOutput` with `permissionDecision: "deny"`. The `mcp__<server>__<tool>` naming applies to tools served over MCP. Field names and return shapes may differ between SDK versions. Verify against current docs.',
      },
    ],
  },
];
