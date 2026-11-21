import type { DevLesson } from '../types';

// Developer Foundations companion lessons, modules 1 and 2.
// Original, app-authored teaching written from general knowledge of Anthropic's public
// documentation. These are NOT the Developer Foundations course lessons, which sit behind a
// partner login and were neither read nor imitated. Learning points are an app decomposition
// of the public module objectives listed in src/content/devpath.ts.

const NOTE_DATE = '2026-11-21';

export const devLessons: DevLesson[] = [
  // ---------------------------------------------------------------------------------------
  // Module 1: tokens, the context window, sampling and non-determinism
  // ---------------------------------------------------------------------------------------
  {
    id: 'dev-tokens-context',
    module: 1,
    title: 'Tokens, the context budget, and outputs that vary',
    outcome:
      'Given a request that is truncated, rejected for length, or flaky in tests, account for every part of its token budget, set max_tokens deliberately, and rewrite its tests to assert on properties across several samples instead of exact strings.',
    minutes: 25,
    terms: [
      { term: 'Token', definition: 'The unit the model reads and writes: a word, part of a word, punctuation, or whitespace chunk. Usage, limits and billing are all counted in tokens, not characters or words.' },
      { term: 'Context window', definition: 'The maximum number of tokens a single request can involve: everything sent in (system prompt, tool definitions, message history, tool results) plus everything the model generates in reply.' },
      { term: 'max_tokens', definition: 'A required request parameter that caps how many tokens the model may generate in this response. Hitting it stops generation mid-thought and sets stop_reason to "max_tokens".' },
      { term: 'Sampling', definition: 'Choosing each next token from a probability distribution rather than always taking the single most likely one. Parameters such as temperature shape that distribution.' },
      { term: 'Property-based assertion', definition: 'A test check on a characteristic every acceptable answer must have (valid JSON, correct label, cites the order ID) rather than on one exact output string.' },
    ],
    learningPoints: [
      'Explain what a token is and why limits, latency and cost are measured in tokens.',
      'List every part of a request that draws on the context window, including tool definitions and tool results.',
      'Choose a max_tokens value from the expected output size and detect truncation through stop_reason.',
      'Explain why sampling makes two identical requests return different text, and what temperature does and does not control.',
      'Write tests that assert on properties or rubric scores, run several samples, and use a fixed eval set.',
      'Decide when to trim, summarize, or move content out of the prompt instead of hoping it fits.',
    ],
    concept: `Think of a request to Claude as a suitcase with a fixed size. Everything you pack goes in: your system prompt, the tool definitions, every earlier message in the conversation, the documents and tool results you pasted in, and also the answer the model is about to write. If you fill the suitcase with history, there is less room for the answer.

The suitcase is measured in **tokens**. A token is a chunk of text the model works with: often a short word or part of a longer word. Code, numbers and non-English text usually take more tokens per character than plain English prose. You do not need the tokenizer's internals (and they are out of scope for the architect exam); you need the habit of measuring. The API reports input and output tokens on every response, and a token-counting endpoint can estimate a request before you send it.

### The budget is shared

The **context window** is the total that one request may use. Input and output share it. A long agent conversation grows every turn because the API is stateless and you resend the history, and large tool results (a whole file, a 500-row query) can quietly consume most of it.

**max_tokens** is the output part of the budget that you choose. Set it from the size of answer you expect, with headroom. Too low and replies stop mid-sentence with \`stop_reason: "max_tokens"\`; too high only matters if it no longer fits alongside the input. Always check stop_reason before trusting an answer.

### Why the same request gives different answers

The model picks each token by **sampling** from a probability distribution. **Temperature** controls how spread out that choice is: lower values favour the most likely tokens, higher values allow more variety. Even at low temperature, outputs are not guaranteed to be identical, and small prompt changes shift them further.

That changes how you test. An exact-string assertion that passed once will fail later for no real reason. Instead:

- Assert on **properties**: parses as JSON, label is one of the allowed values, mentions the order ID.
- For open-ended text, score against a **rubric** (by code or a calibrated grader model).
- Run **several samples** per case and track pass rate, not a single pass.
- Keep a **fixed eval set** so that a change in score reflects your change, not a change in inputs.

> Determinism comes from your code, not the model. If a value must be exact every time, compute or validate it outside the model.`,
    example: {
      intro:
        'Harbor Freight Desk (a fictional logistics support bot) began returning half-finished summaries after a release that attached full shipment histories as tool results. Its unit test also fails roughly one run in five. Below are the usage block from a failing response and the old and new versions of the test.',
      artifacts: [
        {
          lang: 'json',
          caption: 'Response metadata from a truncated reply',
          code: `{
  "stop_reason": "max_tokens",
  "usage": {
    "input_tokens": 61840,
    "output_tokens": 300
  },
  "content": [
    { "type": "text", "text": "Summary for shipment HF-20931: The container left Rotterdam on 3 Oct, was held at customs for" }
  ]
}`,
        },
        {
          lang: 'python',
          caption: 'Before: an exact-match test on one sample',
          code: `def test_summary():
    out = summarize(SHIPMENT_HF_20931)
    assert out == "Shipment HF-20931 was delayed 4 days by a customs hold."`,
        },
        {
          lang: 'python',
          caption: 'After: property checks over several samples from a fixed eval set',
          code: `import json

EVAL_CASES = load_cases("evals/shipment_summaries.jsonl")  # fixed, versioned file
SAMPLES = 5

def check(case, out):
    data = json.loads(out)                        # property 1: valid JSON
    assert data["shipment_id"] == case["id"]      # property 2: right shipment
    assert data["status"] in {"on_time", "delayed", "lost"}
    if case["expected_status"] == "delayed":
        assert data["delay_days"] == case["delay_days"]
    assert len(data["summary"]) <= 400            # property 3: stays short

def test_summaries_pass_rate():
    passed = total = 0
    for case in EVAL_CASES:
        for _ in range(SAMPLES):
            resp = summarize_raw(case["input"], max_tokens=800)
            assert resp.stop_reason == "end_turn"  # never grade a truncated reply
            total += 1
            try:
                check(case, resp.text); passed += 1
            except (AssertionError, KeyError, json.JSONDecodeError):
                pass
    assert passed / total >= 0.95`,
        },
      ],
      walkthrough: `The metadata tells the story. **stop_reason is "max_tokens"** and output_tokens equals the 300 the code requested, so the model was cut off; the text is not a bad answer, it is an unfinished one. The input side is also large: about 62,000 tokens, most of it the raw shipment history added in the release. Two fixes follow: raise max_tokens to fit a complete summary with headroom, and pass only the events the summary needs instead of the whole history, so the input does not keep growing toward the window limit.

The old test compared one sample to one exact sentence. A correct reply that says "held at customs for four days" fails it. The new test asserts on **properties** every good answer shares (valid JSON, correct ID, allowed status, correct delay, length limit), refuses to grade a truncated reply, runs **five samples per case** on a **fixed, versioned eval file**, and passes on a pass-rate threshold. A drop in pass rate now means something changed in the prompt or model, which is what a test should tell you.`,
    },
    compare: {
      question: 'A classification feature gives occasional different labels for the same ticket. Should the team pin temperature to its lowest value and keep exact-match tests, or keep the default and test pass rates on properties?',
      a: {
        title: 'Lower temperature and exact-match tests',
        body: 'Set temperature low, record one output per test case as the "golden" answer, and assert equality. Simple to write and quick to run.',
        chooseWhen: 'The output is a single constrained token or enum value, the label set is small, and you also validate the value in code, so exact match is effectively a property check.',
      },
      b: {
        title: 'Property and rubric checks over multiple samples',
        body: 'Define what every acceptable output must satisfy, sample each fixed eval case several times, and gate releases on pass rate per case and overall.',
        chooseWhen: 'Outputs are free text or structured objects with more than one acceptable phrasing, or you need to know how often a case fails rather than whether it failed once.',
      },
      decidingDetail: 'The deciding detail is whether more than one output is acceptable. If only one exact value is ever correct (an enum label), a low temperature plus an equality check on that value is a fine property test. If several phrasings are correct, exact match measures wording, not quality, and lowering temperature only hides variance that real traffic will still show. Either way, run more than one sample: lower temperature reduces variation but does not guarantee identical outputs.',
    },
    mistake: {
      mistake: 'Treating the context window as the input limit only: filling it with long history and full tool results, leaving max_tokens at a small default, and then reading a truncated reply as the model\'s complete answer.',
      whyTempting: 'Input size is what developers see and control while building the prompt, and short test conversations always fit. The truncation only shows up later, on long real conversations, and the cut-off text still looks like plausible prose.',
      howToRecognize: 'Replies that end mid-sentence or with unclosed JSON; stop_reason of "max_tokens" in logs; output_tokens equal to the configured cap; failures concentrated in long sessions or requests with large tool results.',
      fix: 'Check stop_reason on every response and treat "max_tokens" as an error or a reason to continue, not a result. Size max_tokens from the real output, measure input tokens per request, and trim, summarize, or filter history and tool results so input plus output stays well inside the window.',
    },
    exercise: {
      prompt: 'Each finding below comes from a team reviewing its Claude integration. Label the most likely cause.',
      inputs: `Integration facts:
- Support agent with 14 tool definitions and a long system prompt.
- max_tokens is 512 for all calls.
- Tests use exact string matching on a single sample.
- Tool results are returned in full (no filtering).`,
      labels: ['Context budget exhausted by input', 'Output capped by max_tokens', 'Normal sampling variation', 'Brittle test design'],
      items: [
        { id: 'e1', text: 'A request with a 40-turn history and three full database dumps is rejected for exceeding the model\'s context length.', answer: 'Context budget exhausted by input', why: 'The input alone is too large. History and unfiltered tool results are the parts that grew; trimming or summarizing them is the fix.' },
        { id: 'e2', text: 'A generated migration plan stops after step 6 of 10, and the log shows stop_reason "max_tokens".', answer: 'Output capped by max_tokens', why: 'stop_reason names the cause directly: the 512-token output cap was reached before the plan was complete.' },
        { id: 'e3', text: 'Two runs of the same request produce greetings worded differently but both correct and on-policy.', answer: 'Normal sampling variation', why: 'Both answers are acceptable. Different wording on identical input is expected behaviour of sampling, not a defect.' },
        { id: 'e4', text: 'CI fails intermittently because the reply said "Your refund is on its way" instead of "Your refund has been issued".', answer: 'Brittle test design', why: 'The test checks exact wording on one sample. It should assert on properties (refund action taken, correct amount) and use a pass rate.' },
        { id: 'e5', text: 'A JSON reply fails to parse and ends with an unclosed array; output_tokens equals 512.', answer: 'Output capped by max_tokens', why: 'Output tokens hit the configured cap exactly, so the JSON was cut off rather than malformed by the model.' },
      ],
      solution: `Read the evidence before blaming the model. **stop_reason and output_tokens** separate truncation (e2, e5) from bad answers. A **length rejection** with large history and tool dumps points at input (e1). Different but acceptable wording is **sampling variation** (e3), and the only real defect in e4 is the **test**, which should check properties across samples. Note that e3 and e4 describe the same underlying behaviour; what makes e4 a problem is how it is tested.`,
    },
    check: [
      {
        id: 'dev-tokens-context-k1',
        stem: 'Which statement about the context window is accurate?',
        options: [
          { id: 'a', text: 'It limits only the user\'s latest message; history and tool results are stored server-side.' },
          { id: 'b', text: 'Input (system prompt, tools, history, tool results) and generated output share one token budget.' },
          { id: 'c', text: 'It limits output only; input size is unlimited if max_tokens is small.' },
          { id: 'd', text: 'It is measured in characters, so non-English text uses less of it.' },
        ],
        correct: 'b',
        why: 'Everything sent and everything generated counts against the same window, and the API stores no history for you. The window is measured in tokens, and non-English text usually costs more tokens per character, not fewer.',
      },
      {
        id: 'dev-tokens-context-k2',
        stem: 'A reply ends abruptly, and the response shows stop_reason "max_tokens". What is the right interpretation?',
        options: [
          { id: 'a', text: 'The model judged that it had finished and chose to stop.' },
          { id: 'b', text: 'The input exceeded the context window and was silently truncated.' },
          { id: 'c', text: 'A tool call is pending and the application should run the tool.' },
          { id: 'd', text: 'Generation hit the output cap; the reply is incomplete and should not be used as-is.' },
        ],
        correct: 'd',
        why: '"max_tokens" means the configured output cap was reached. A natural finish is "end_turn" and a pending tool call is "tool_use". Treat the reply as incomplete: raise the cap, shorten the task, or continue generation.',
      },
      {
        id: 'dev-tokens-context-k3',
        stem: 'A team wants a reliable regression test for a free-text summarizer. Which approach fits best?',
        options: [
          { id: 'a', text: 'Score several samples per case from a fixed eval set against properties or a rubric, and gate on pass rate.' },
          { id: 'b', text: 'Set temperature to its lowest value and assert one sample equals a stored golden summary.' },
          { id: 'c', text: 'Regenerate the eval inputs each run so the test covers more variety.' },
          { id: 'd', text: 'Run each case once and retry failures until they pass.' },
        ],
        correct: 'a',
        why: 'Free text has many acceptable phrasings, so properties or rubrics measure quality, multiple samples expose variance, and a fixed set keeps runs comparable. Lowering temperature does not guarantee identical outputs, and retry-until-pass hides real failure rates.',
      },
    ],
    review: [
      { front: 'Name four things that draw on the context window in an agent request.', back: 'System prompt, tool definitions, message history (resent every turn), tool results, plus the generated output.' },
      { front: 'How do you tell a truncated reply from a finished one?', back: 'stop_reason: "max_tokens" means truncated; "end_turn" means the model finished. Check it on every response.' },
      { front: 'Three habits for testing non-deterministic outputs?', back: 'Assert on properties or rubric scores, run several samples per case and track pass rate, keep a fixed versioned eval set.' },
    ],
    sources: ['api-context-windows', 'api-token-counting', 'api-stop-reasons', 'guard-consistency', 'eval-tests', 'dev-course-pages', 'app-authored'],
    notes: [
      {
        date: NOTE_DATE,
        text: 'Context window sizes differ by model and some models offer larger windows as an option; how the API behaves when input plus max_tokens exceeds the window (validation error versus a dedicated stop reason) has changed across model generations. Some newer models also restrict which sampling parameters (temperature, top_p, top_k) may be set together or with extended thinking. Check the current context-window and model docs before relying on specific numbers or parameter combinations.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  // Module 1: model selection
  // ---------------------------------------------------------------------------------------
  {
    id: 'dev-model-selection',
    module: 1,
    title: 'Choosing a model tier on evidence',
    outcome:
      'Given a workload with stated quality, latency and cost requirements, pick a starting model tier, test it and one alternative on your own eval set, and decide separately whether extended thinking is worth enabling.',
    minutes: 20,
    terms: [
      { term: 'Model tier', definition: 'A family position such as most capable, balanced, or fastest. Higher tiers usually handle harder reasoning; lower tiers usually answer faster and cost less per token.' },
      { term: 'Eval set', definition: 'A fixed collection of representative inputs with expected results or grading rules, used to compare prompts or models on your task rather than on public benchmarks.' },
      { term: 'Extended thinking', definition: 'A request option that lets a model reason in a separate thinking block before answering. It is configured per request and is independent of which model you call.' },
      { term: 'Routing', definition: 'Sending each request to a model chosen by rules or a cheap classifier, for example easy requests to a fast tier and hard ones to a capable tier.' },
    ],
    learningPoints: [
      'Describe the capability, latency and cost trade-off between model tiers without relying on fixed prices or model IDs.',
      'Compare candidate models on your own eval set using quality, latency and cost per successful task.',
      'Treat model choice and extended thinking as two separate settings, and test them as separate variables.',
      'Recognize workloads where a smaller, faster model is sufficient (classification, extraction, short rewrites).',
      'Design a simple routing scheme and know what it costs in complexity and evaluation.',
      'Re-run the comparison when models, prompts or traffic change rather than treating the choice as permanent.',
    ],
    concept: `Picking a model is like staffing a task. You would not give a senior architect a stack of address labels to retype, and you would not give a new hire the system redesign. Claude models come in **tiers** that trade the same three things: how hard a problem the model can handle, how quickly it responds, and how much each token costs. The most capable tier is the strongest at multi-step reasoning, hard code and nuanced judgement; the fastest tier responds quickest at the lowest price; a middle tier balances the two.

### Decide on your own evidence

Public benchmarks tell you about other people's tasks. What matters is how each tier does on **your** inputs. Build a small **eval set** of real, representative cases (including hard and edge cases), then run the candidate tiers on it and record three numbers: pass rate, latency, and cost per *successful* task. A cheap model that fails a third of the time and needs human cleanup may cost more in total than a stronger one.

A good default process: start with a capable model to learn what "good" looks like, then test whether a faster tier meets the same bar. Many workloads, such as routing tickets, pulling fields from forms, tagging sentiment, or short rewrites, are well within a fast tier's ability and benefit greatly from its speed.

### Keep two dials apart

**Extended thinking** is a separate dial from the model. It lets the model reason before answering, which can help on maths, planning and multi-constraint problems, at the price of more output tokens and more latency. If you switch to a bigger model *and* turn on thinking in the same experiment, you cannot tell which change helped. Test them as separate variables: a fast model with thinking may beat a larger model without it on some tasks, and the reverse on others.

### Routing

When traffic mixes easy and hard requests, **routing** sends each to an appropriate tier: rules (request type, length, customer plan) or a fast classifier decide. Routing saves cost and latency but adds a component to evaluate: misrouted hard requests fail quietly. Measure the router's accuracy, and route uncertain cases upward.

> Model names and prices change often. Write your configuration so the model is a setting, not a constant scattered through the code.`,
    example: {
      intro:
        'Lumen Insurance (fictional) has a claims assistant that does two jobs: tagging incoming emails with a claim category, and drafting a coverage explanation that cites policy clauses. The team ran a fixed eval set of 300 emails and 120 coverage questions against three configurations. Tier names are generic; numbers are illustrative.',
      artifacts: [
        {
          lang: 'yaml',
          caption: 'Model configuration kept as data, not code',
          code: `# config/models.yaml - model IDs live here only; update after re-running evals
tasks:
  email_tagging:
    model: \${FAST_TIER_MODEL_ID}
    thinking: off
    max_tokens: 50
  coverage_explanation:
    model: \${BALANCED_TIER_MODEL_ID}
    thinking: { enabled: true, budget_tokens: 4000 }
    max_tokens: 6000
routing:
  coverage_explanation:
    escalate_to: \${CAPABLE_TIER_MODEL_ID}
    when: ["policy_count > 2", "router_confidence < 0.7"]`,
        },
        {
          lang: 'text',
          caption: 'Eval summary (illustrative)',
          code: `Task: email_tagging (300 cases, 3 samples each)
config                       pass   p50 latency   relative cost/success
fast tier, no thinking       97.8%  0.6 s         1.0x
balanced tier, no thinking   98.1%  1.4 s         3.1x

Task: coverage_explanation (120 cases, rubric-graded, 3 samples each)
config                          pass   p50 latency   relative cost/success
balanced tier, no thinking      81%    6 s           1.0x
balanced tier, thinking 4k      92%    11 s          1.4x
capable tier, no thinking       90%    9 s           2.6x
capable tier, thinking 4k       95%    16 s          3.6x`,
        },
      ],
      walkthrough: `For **email tagging**, the fast tier is within a fraction of a point of the balanced tier, more than twice as fast, and about a third of the cost per success. The task is a short, well-defined classification, so the fast tier is sufficient; paying more buys nothing users would notice.

For **coverage explanations**, the team tested model and thinking as **separate variables**. Turning on thinking with the balanced tier raised the pass rate from 81% to 92% at modest extra cost. Moving to the capable tier without thinking reached 90% at a much higher cost. Had they changed both at once, they would have credited the bigger model for a gain that thinking mostly delivered.

They chose balanced tier with thinking as the default and added **routing**: claims touching more than two policies, or where the router is unsure, escalate to the capable tier. Model IDs sit in one config file as placeholders filled per environment, so the next model release means editing config and re-running the same evals, not hunting through code.`,
    },
    compare: {
      question: 'For a mixed workload, should a team run one capable model for everything or route between a fast and a capable tier?',
      a: {
        title: 'One capable model for all requests',
        body: 'A single configuration, one prompt to maintain, one eval suite. Quality is high on hard cases, but every easy request pays the capable tier\'s latency and price.',
        chooseWhen: 'Volume is modest, most requests are genuinely hard, or the cost of a wrong answer is high enough that simplicity and maximum quality outweigh savings.',
      },
      b: {
        title: 'Route easy requests to a fast tier, hard ones to a capable tier',
        body: 'A rule or a small classifier picks the tier per request. Easy traffic gets faster, cheaper answers; hard traffic still gets the strong model.',
        chooseWhen: 'Volume is high, a large share of requests are simple, the fast tier passes your eval set on that share, and you can measure and tune the router.',
      },
      decidingDetail: 'The deciding detail is evidence that the fast tier meets the bar on a large, identifiable share of traffic. If your eval set shows the fast tier passes on the easy segment and you can identify that segment reliably, routing saves real latency and cost. If you cannot separate easy from hard cases reliably, misroutes silently lower quality and a single capable model is the safer choice.',
    },
    mistake: {
      mistake: 'Upgrading to the most capable model and enabling extended thinking in the same change whenever quality is poor, without an eval set to show which change (if either) helped.',
      whyTempting: 'Both changes sound like "more intelligence", quality usually improves a little, and it feels faster than building an eval set. Defaulting to the biggest model also feels safe.',
      howToRecognize: 'Latency and cost jump after a "quality fix"; nobody can say what the pass rate was before; simple tasks such as tagging run on the most expensive configuration; model IDs are hard-coded in many places.',
      fix: 'Build a fixed eval set first. Change one variable at a time (model tier, then thinking on or off, then budget) and record pass rate, latency and cost per success. Keep the cheapest configuration that meets the bar, and keep model IDs in configuration so re-testing is easy.',
    },
    exercise: {
      prompt: 'For each workload, pick the most sensible starting configuration to test first against your eval set.',
      inputs: `Assume three generic tiers (fast, balanced, capable) and that extended thinking can be enabled on any of them.
Each workload has an eval set ready.`,
      labels: ['Fast tier, no thinking', 'Balanced or capable tier, no thinking', 'Model tier plus extended thinking', 'Route between tiers'],
      items: [
        { id: 'm1', text: 'Tag 2 million product reviews per day as positive, neutral or negative; latency per call must stay low.', answer: 'Fast tier, no thinking', why: 'A short classification at high volume. A fast tier usually meets the bar, and thinking adds tokens and latency without benefit on a three-way label.' },
        { id: 'm2', text: 'Produce a multi-step tax-allocation plan that must satisfy a dozen interacting constraints; a user waits up to a minute.', answer: 'Model tier plus extended thinking', why: 'Multi-constraint reasoning is where thinking tends to help, and the latency budget allows it. Test thinking on and off as a separate variable.' },
        { id: 'm3', text: 'A help desk where 80% of questions are password resets and 20% are complex integration problems.', answer: 'Route between tiers', why: 'A large, identifiable easy segment plus a hard segment is the classic case for routing, provided the router is measured.' },
        { id: 'm4', text: 'Write customer-facing replies that need nuanced tone and accurate policy references, with responses expected in a few seconds.', answer: 'Balanced or capable tier, no thinking', why: 'Quality matters more than a fast tier usually offers, but the tight latency budget argues against adding thinking first. Test thinking later if quality falls short.' },
        { id: 'm5', text: 'Extract invoice number, date and total from short, clean PDFs converted to text.', answer: 'Fast tier, no thinking', why: 'Field extraction from clean text is well within a fast tier. Validate fields in code and only move up if the eval set shows failures.' },
      ],
      solution: `Match the configuration to the difficulty and the latency budget, then **prove it on the eval set**. Simple, high-volume tasks (m1, m5) start on the fast tier. Hard multi-constraint reasoning with time to spare (m2) is where thinking earns its cost. Quality-sensitive but time-sensitive work (m4) starts on a stronger tier without thinking. A clearly split workload (m3) is a routing case. Each answer is only a starting point: the eval numbers decide.`,
    },
    check: [
      {
        id: 'dev-model-selection-k1',
        stem: 'A team switched to a larger model and enabled extended thinking in one release; quality rose 10 points. What can they conclude?',
        options: [
          { id: 'a', text: 'The larger model caused the improvement, since thinking only affects latency.' },
          { id: 'b', text: 'Extended thinking caused it, since model size does not affect quality.' },
          { id: 'c', text: 'They cannot attribute the gain to either change without testing each separately.' },
          { id: 'd', text: 'Both changes contributed equally, about 5 points each.' },
        ],
        correct: 'c',
        why: 'Model tier and extended thinking are independent settings. Changing both at once confounds the result; only separate runs on the same eval set show which change (or combination) matters.',
      },
      {
        id: 'dev-model-selection-k2',
        stem: 'When is a fast, low-cost tier most likely to be the right choice?',
        options: [
          { id: 'a', text: 'High-volume, well-defined tasks such as classification where it meets the bar on your eval set.' },
          { id: 'b', text: 'Any task, because cost always matters more than quality.' },
          { id: 'c', text: 'Only when public benchmarks rank it above larger models.' },
          { id: 'd', text: 'Open-ended research tasks that need many reasoning steps.' },
        ],
        correct: 'a',
        why: 'Fast tiers shine on simple, high-volume work, and the confirmation should come from your own eval set. Public benchmarks measure other tasks, and long multi-step reasoning is where larger tiers or thinking usually help.',
      },
      {
        id: 'dev-model-selection-k3',
        stem: 'Which metric best captures the real cost of a model choice for a task?',
        options: [
          { id: 'a', text: 'Price per input token alone.' },
          { id: 'b', text: 'Average output length.' },
          { id: 'c', text: 'Rank on a public leaderboard.' },
          { id: 'd', text: 'Cost per successful task, including retries and human cleanup of failures.' },
        ],
        correct: 'd',
        why: 'A cheaper model that fails more often may cost more overall once retries, escalations and human fixes are counted. Per-token price and leaderboards ignore your failure rate.',
      },
    ],
    review: [
      { front: 'Three trade-offs between model tiers?', back: 'Capability (hard reasoning), latency, and cost per token. Measure them on your own eval set.' },
      { front: 'Why test model tier and extended thinking separately?', back: 'They are independent settings; changing both at once makes it impossible to tell which caused a quality, latency or cost change.' },
      { front: 'What does routing need to be safe?', back: 'A reliable way to identify easy requests, measured router accuracy, and a rule that sends uncertain cases to the stronger tier.' },
    ],
    sources: ['api-models', 'api-extended-thinking', 'eval-tests', 'dev-course-pages', 'app-authored'],
    notes: [
      {
        date: NOTE_DATE,
        text: 'This lesson deliberately avoids model IDs and prices: both change with each release, and which models support extended thinking (and in what form, for example a fixed budget versus an adaptive or effort-based setting) varies by model generation. Check the current models overview and pricing pages before choosing. Performance benchmarking and model comparison metrics are listed as out of scope for the CCAR-F exam; the selection process here is still useful for developers.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  // Module 1: API access (SDKs vs REST, sync vs streaming, async and batches)
  // ---------------------------------------------------------------------------------------
  {
    id: 'dev-api-access',
    module: 1,
    outOfScopeForCCARF: true,
    title: 'Calling Claude: SDKs, streaming, and high-volume patterns',
    outcome:
      'Given a feature\'s volume and latency needs, choose between an SDK and raw HTTP, between a synchronous and a streaming response, and between concurrent real-time calls and the Message Batches API, and write the request with history resent correctly.',
    minutes: 30,
    terms: [
      { term: 'Messages API', definition: 'The HTTP endpoint that takes a model, max_tokens, an optional system prompt and a list of messages, and returns the assistant\'s reply plus stop_reason and token usage.' },
      { term: 'Stateless', definition: 'The API keeps no conversation memory between calls. Each request must include all prior turns the model should see.' },
      { term: 'Streaming', definition: 'Receiving the response incrementally as server-sent events while it is generated, instead of waiting for the complete message.' },
      { term: 'Message Batches API', definition: 'An asynchronous endpoint that accepts many Messages requests at once, processes them within a time window at a reduced price, and returns results matched by custom_id.' },
      { term: 'Official SDK', definition: 'An Anthropic-maintained client library that handles headers, retries with backoff, timeouts, typed request and response objects, and streaming helpers.' },
    ],
    learningPoints: [
      'Explain why the Messages API is stateless and how to resend conversation history correctly.',
      'Compare an official SDK with raw HTTP in terms of headers, retries, typing and maintenance.',
      'Decide when streaming improves user experience and describe its event sequence at a high level.',
      'Run many real-time requests concurrently with bounded parallelism and retry handling.',
      'Choose the Message Batches API for large, non-urgent jobs and correlate results by custom_id.',
      'Know which of these topics the CCAR-F exam treats as out of scope.',
    ],
    concept: `> Scope note: streaming and server-sent events are listed as out of scope for the CCAR-F architect exam, as are rate limits and authentication details. This lesson is for the developer path; the Message Batches material does also appear in the architect guide.

Calling Claude is an HTTP request: send a model name, a **max_tokens** cap, an optional **system** prompt, and a list of **messages**, and get back a message with content blocks, a **stop_reason**, and token **usage**.

### The API has no memory

The Messages API is **stateless**. It does not remember your last call. For a conversation, your application stores the turns and sends the whole list each time, alternating user and assistant roles, including any tool-use and tool-result blocks. Forgetting to append the assistant's previous reply is the classic bug: the model then answers as if it never spoke.

### SDK or raw HTTP

You can call the endpoint with any HTTP client by setting the API key header, a version header and a JSON content type. The **official SDKs** (for example Python and TypeScript) do the same thing but also add typed request and response objects, automatic **retries with backoff** for rate-limit and transient server errors, timeouts, and streaming helpers. Raw HTTP makes sense in a language without an SDK or when you need a tiny dependency footprint; otherwise the SDK removes a lot of error-prone plumbing. Either way, read the key from the environment or a secret store, never from source code.

### Wait or stream

A **synchronous** call returns once the full answer is ready. That suits back-end jobs. For a chat UI, waiting several seconds on a blank screen feels broken, so **streaming** sends the answer as it is produced. At a high level the stream opens with a message start event, then for each content block a start, many deltas (text pieces or partial tool input), and a stop, then a message delta carrying the final stop_reason and usage, and finally a message stop. Streaming improves perceived speed, not total time, and it also helps long generations avoid HTTP timeouts.

### Lots of requests

For many requests that a user is waiting on, run them **concurrently** with a bounded pool (a semaphore) and let retries handle occasional overload errors. For large jobs nobody is waiting on, such as nightly classification of 50,000 records, use the **Message Batches API**: submit all requests with a **custom_id** each, poll until processing ends, then match results by custom_id. It costs less but can take up to a day, and it cannot run a multi-turn tool loop inside one request.`,
    example: {
      intro:
        'Fernbrook Library (fictional) has two features: a chat assistant on its website, and a nightly job that writes short catalogue descriptions for newly acquired books. Below are a raw HTTP call, the SDK equivalent with history and streaming, and a batch submission for the nightly job.',
      artifacts: [
        {
          lang: 'bash',
          caption: 'Raw HTTP: the key comes from the environment, never pasted into code',
          code: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "MODEL_ID_FROM_CONFIG",
    "max_tokens": 400,
    "system": "You are the Fernbrook Library assistant. Answer only about library services.",
    "messages": [
      {"role": "user", "content": "Can I renew a book online?"}
    ]
  }'`,
        },
        {
          lang: 'python',
          caption: 'SDK: resend history every turn and stream the reply to the chat UI',
          code: `import anthropic

client = anthropic.Anthropic()            # reads ANTHROPIC_API_KEY; retries transient errors
history = []                              # the app, not the API, owns the conversation

def chat_turn(user_text, send_to_browser):
    history.append({"role": "user", "content": user_text})
    with client.messages.stream(
        model=settings.CHAT_MODEL,
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=history,                 # full history, every call
    ) as stream:
        for text in stream.text_stream:   # deltas arrive as they are generated
            send_to_browser(text)
        final = stream.get_final_message()
    history.append({"role": "assistant", "content": final.content})  # keep the reply
    return final.stop_reason`,
        },
        {
          lang: 'python',
          caption: 'Nightly job: Message Batches API with custom_id correlation',
          code: `requests = [
    {
        "custom_id": f"isbn-{book.isbn}",
        "params": {
            "model": settings.BULK_MODEL,
            "max_tokens": 200,
            "messages": [{"role": "user", "content": describe_prompt(book)}],
        },
    }
    for book in new_acquisitions()
]
batch = client.messages.batches.create(requests=requests)
save_batch_id(batch.id)                   # a later scheduled step polls and collects

# --- later run ---
batch = client.messages.batches.retrieve(load_batch_id())
if batch.processing_status == "ended":
    for r in client.messages.batches.results(batch.id):
        isbn = r.custom_id.removeprefix("isbn-")   # results may arrive in any order
        if r.result.type == "succeeded":
            store_description(isbn, r.result.message.content[0].text)
        else:
            queue_for_retry(isbn, r.result.type)    # errored / expired / canceled`,
        },
      ],
      walkthrough: `The **curl** call shows what every request contains: the key header (read from an environment variable), a version header, and a JSON body with model, max_tokens, system and messages. The model ID is a configuration value, not a literal scattered through code.

The **chat** code makes statelessness explicit. The app keeps \`history\`, appends the user turn, sends the whole list, and after the stream ends appends the assistant's reply. Without that last append, the next turn would arrive with two user messages in a row and no memory of the answer. Streaming forwards each text delta to the browser so the reader sees words immediately; \`get_final_message()\` then gives the assembled message with stop_reason and usage for logging. The SDK supplies retries and typed objects that the curl version would have to build by hand.

The **nightly job** has no user waiting, so it uses the Batches API. Each request carries a **custom_id** built from the ISBN, because results are not guaranteed to come back in submission order. The job polls in a later run instead of blocking, handles succeeded and non-succeeded results separately, and re-queues failures. A real-time loop over thousands of books would cost more and need its own concurrency and retry logic for no user benefit.`,
    },
    compare: {
      question: 'A newsroom wants AI-generated summaries for 30,000 archived articles, and also a "summarize this article" button for readers. Should both use the same calling pattern?',
      a: {
        title: 'Concurrent real-time calls (with streaming for the button)',
        body: 'Each summary is a normal Messages call. The archive job uses a bounded worker pool; the reader button streams its answer so text appears at once.',
        chooseWhen: 'A person is waiting for the result, or the job must finish within minutes, or each item needs a multi-turn tool loop.',
      },
      b: {
        title: 'Message Batches API for the archive, real-time only for the button',
        body: 'The 30,000 archive requests go into batches with custom_ids and are collected when processing ends; the reader button stays a streamed real-time call.',
        chooseWhen: 'The bulk work is non-urgent, each item is a single self-contained request, and lower cost matters more than finishing quickly.',
      },
      decidingDetail: 'The deciding detail is whether anyone is waiting and how soon results are needed. The reader button has a person waiting, so it must be real-time (and streaming helps). The archive has no deadline tighter than a day and each summary is one independent request, which is exactly what batches are for. Use real-time concurrency for bulk work only if results are needed within the hour or each item needs multiple tool-use turns.',
    },
    mistake: {
      mistake: 'Assuming the API remembers the conversation (sending only the newest user message), or the opposite error of resending history but dropping the assistant\'s previous replies and tool results.',
      whyTempting: 'Chat products remember context, so developers expect the API to as well. Short demos with one question work fine, and storing assistant replies feels redundant because "the model wrote them".',
      howToRecognize: 'The assistant asks for information the user already gave, repeats earlier answers, contradicts itself across turns, or the API rejects a request because a tool result has no matching tool use in the previous assistant turn.',
      fix: 'Keep the conversation in your application. On each call send the full ordered list: user turn, the assistant\'s complete content (including tool-use blocks), the tool results, and so on. Trim or summarize old turns deliberately when the history grows too large, instead of dropping them by accident.',
    },
    exercise: {
      prompt: 'Choose the most appropriate calling pattern for each scenario.',
      inputs: `Patterns available: synchronous call, streaming call, concurrent real-time calls with a bounded pool, Message Batches API.
All requests use the same model and prompt style.`,
      labels: ['Synchronous call', 'Streaming call', 'Concurrent real-time calls', 'Message Batches API'],
      items: [
        { id: 'a1', text: 'A chat widget where users complained that the screen stays blank for several seconds before a long answer appears.', answer: 'Streaming call', why: 'A person is waiting and the answer is long; streaming shows text as it is produced and improves perceived speed.' },
        { id: 'a2', text: 'Re-tag 120,000 support tickets with a new taxonomy for next week\'s quarterly report.', answer: 'Message Batches API', why: 'Large, non-urgent, single-request items with no one waiting: batches are cheaper and need no concurrency code.' },
        { id: 'a3', text: 'A back-end webhook that classifies one incoming email and writes the label to a database.', answer: 'Synchronous call', why: 'One short request with no human watching the text appear; a plain synchronous call is simplest.' },
        { id: 'a4', text: 'A user uploads 40 contracts and waits on a progress bar for risk summaries of each.', answer: 'Concurrent real-time calls', why: 'Someone is waiting, so a batch\'s processing window is too slow; run the 40 calls in parallel with a bounded pool.' },
        { id: 'a5', text: 'A nightly agent that must call several tools in sequence for each of 5,000 accounts.', answer: 'Concurrent real-time calls', why: 'Each item needs a multi-turn tool loop, which a single batch request cannot perform; use real-time calls with bounded concurrency (batches could still handle any single-turn steps).' },
      ],
      solution: `Ask two questions in order. **Is a person waiting?** If yes and the answer is long, stream it (a1); if yes and there are many items, run them concurrently (a4). **If nobody is waiting**, is each item a single request? Then batches win on cost and simplicity (a2), and a lone short request is just a synchronous call (a3). Multi-turn tool loops (a5) rule out batches for the loop itself.`,
    },
    check: [
      {
        id: 'dev-api-access-k1',
        stem: 'On the third turn of a conversation, what must the request\'s messages array contain?',
        options: [
          { id: 'a', text: 'Only the newest user message; the API retrieves earlier turns by session.' },
          { id: 'b', text: 'Only the user messages, since the API stores its own replies.' },
          { id: 'c', text: 'A conversation ID header and the newest message.' },
          { id: 'd', text: 'All earlier user and assistant turns in order, followed by the newest user message.' },
        ],
        correct: 'd',
        why: 'The Messages API is stateless: it has no sessions or stored replies. The application resends the full ordered history, including assistant turns and any tool-use and tool-result blocks.',
      },
      {
        id: 'dev-api-access-k2',
        stem: 'What is the main benefit of streaming a response?',
        options: [
          { id: 'a', text: 'It lowers the price of output tokens.' },
          { id: 'b', text: 'Users see the answer as it is generated, improving perceived responsiveness.' },
          { id: 'c', text: 'It removes the need for max_tokens.' },
          { id: 'd', text: 'It lets the API keep conversation history between calls.' },
        ],
        correct: 'b',
        why: 'Streaming delivers deltas while the model generates, so text appears immediately. Total generation time, price, max_tokens and statelessness are unchanged.',
      },
      {
        id: 'dev-api-access-k3',
        stem: 'Results from a Message Batch come back. How should the application match each result to its input record?',
        options: [
          { id: 'a', text: 'By position, since results are returned in submission order.' },
          { id: 'b', text: 'By comparing the output text with each input.' },
          { id: 'c', text: 'By the custom_id assigned to each request when the batch was created.' },
          { id: 'd', text: 'By the timestamp on each result.' },
        ],
        correct: 'c',
        why: 'Results are not guaranteed to be in submission order. Each request carries a custom_id that you set, and you use it to join results back to your records.',
      },
    ],
    review: [
      { front: 'What does "the Messages API is stateless" mean in practice?', back: 'Your app stores the conversation and resends all prior turns (including assistant replies and tool blocks) on every call.' },
      { front: 'Two things an official SDK gives you over raw HTTP?', back: 'Any two of: typed requests/responses, automatic retries with backoff, timeouts, streaming helpers, header handling.' },
      { front: 'When do you choose the Message Batches API?', back: 'Many independent single-request jobs that nobody is waiting on; lower cost, results within a processing window, matched by custom_id. Not for multi-turn tool loops.' },
    ],
    sources: ['api-client-sdks', 'api-streaming', 'api-batch', 'api-stop-reasons', 'guide-format', 'dev-course-pages', 'app-authored'],
    notes: [
      {
        date: NOTE_DATE,
        text: 'Version-sensitive details: the anthropic-version header value, SDK method names and default retry counts, streaming event names, and Message Batches limits (discount size, maximum requests or bytes per batch, the processing window, how long results stay available, and which features combine with batches). Verify against the current API and SDK docs. The CCAR-F exam guide lists streaming/server-sent events, rate limits, and authentication details as out of scope; batch basics (cost saving, processing window, custom_id, no multi-turn tool calling) are listed as in scope.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  // Module 2: production prompts, diagnosis, extended thinking
  // ---------------------------------------------------------------------------------------
  {
    id: 'dev-prompts-thinking',
    module: 2,
    title: 'Production prompts, diagnosis, and extended thinking',
    outcome:
      'Given an underperforming production prompt, restructure it with a system prompt, XML-tagged sections, examples and output constraints, find the cause of its failures one variable at a time against an eval set, and configure extended thinking with a budget while preserving thinking blocks across tool-use turns.',
    minutes: 35,
    terms: [
      { term: 'System prompt', definition: 'The top-level instruction field of a request, used for the model\'s role, standing rules and constraints that apply to the whole conversation.' },
      { term: 'XML tags', definition: 'Named delimiters such as <instructions> and <document> that separate parts of a prompt so the model (and your parser) can tell instructions, data and examples apart.' },
      { term: 'Few-shot examples', definition: 'A small set of worked input/output pairs in the prompt that show the expected format and judgement, including edge cases.' },
      { term: 'Thinking budget', definition: 'The maximum number of tokens a request lets the model spend in its thinking block before answering; it must fit within max_tokens.' },
      { term: 'Thinking block', definition: 'The content block holding the model\'s reasoning when extended thinking is on. It carries a signature, and during a tool-use loop it must be sent back unchanged with the assistant turn.' },
    ],
    learningPoints: [
      'Place role and standing rules in the system prompt and task-specific material in the user turn.',
      'Use XML tags to separate instructions, context documents and examples, and to define output sections.',
      'Write few-shot examples that cover edge cases and match the required output format exactly.',
      'Diagnose an underperforming prompt by reading failures, grouping them, and changing one variable at a time against a fixed eval set.',
      'Decide when extended thinking is worth its latency and tokens, and size its budget.',
      'Preserve thinking blocks unmodified when returning tool results in a tool-use loop.',
      'Recognize when a failure needs a different tool, a code check, or a split prompt rather than more instructions.',
    ],
    concept: `A production prompt is closer to a specification than to a chat message. Someone new to the task should be able to read it and know their role, the rules, what material to use, what good output looks like, and what format to return.

### Structure

- **System prompt**: the role and rules that apply to every turn ("You are a billing support agent for Acme. Never promise refunds over the policy limit.").
- **XML tags** in the user turn to separate kinds of content: \`<instructions>\`, \`<policy>\`, \`<customer_message>\`, \`<examples>\`. Tags stop the model mixing up your instructions with the data it should work on, and let you refer to sections by name ("use only facts in <policy>").
- **Few-shot examples**: two to five worked cases, including at least one tricky edge case, in exactly the output format you want. Examples teach format and judgement faster than paragraphs of description.
- **Output constraints**: state the format (JSON fields, tags such as \`<answer>\`, length limits) and validate it in code, since instructions are followed most but not all of the time.

### Diagnosing a weak prompt

When quality is poor, do not rewrite everything. **Read the failures**, group them (wrong format, missing facts, wrong judgement, ignored rule), then **change one variable at a time** and re-run a **fixed eval set**. Typical fixes map to failure types: format failures need an example or schema; invented facts need grounding instructions and the source in tags; bad judgement needs explicit criteria; a rule ignored deep in a long prompt may need moving to the system prompt or into code.

### Extended thinking

**Extended thinking** gives the model room to reason in a separate thinking block before it answers. It helps most on multi-step maths, planning, complex code and problems with many interacting constraints; it adds little to simple lookups or classification. You set a **thinking budget** in tokens, which must be smaller than max_tokens; start modestly, raise it only if the eval set improves, and remember that thinking tokens add latency and cost.

In a **tool-use loop** with thinking enabled, the assistant turn that requested a tool contains a thinking block (with a signature) before the tool-use block. When you send the tool result back, include that assistant content **unchanged**, thinking block included. Dropping or editing it breaks the model's reasoning chain and the API can reject the request.`,
    example: {
      intro:
        'Quillmark Payroll (fictional) has an assistant that answers employee questions about pay rules and can call a `get_payslip` tool. Below are the restructured prompt and the request flow for a tool call with extended thinking.',
      artifacts: [
        {
          lang: 'python',
          caption: 'Structured prompt: system role and rules, tagged context, examples, output constraint',
          code: `SYSTEM = """You are Quillmark's payroll help assistant for UK employees.
Rules:
- Answer only from <pay_policy> and tool results. If they do not cover the question, say so and suggest HR.
- Never state another employee's pay.
- Return your reply inside <answer> tags, at most 120 words."""

def build_user_turn(policy_text, question):
    return f"""<pay_policy>
{policy_text}
</pay_policy>

<examples>
<example>
<question>Is overtime paid on bank holidays?</question>
<answer>Yes. Section 4.2 pays bank-holiday overtime at 2x the hourly rate.</answer>
</example>
<example>
<question>What does my manager earn?</question>
<answer>I can't share another employee's pay. For pay-band questions, contact HR.</answer>
</example>
</examples>

<question>{question}</question>"""`,
        },
        {
          lang: 'python',
          caption: 'Extended thinking with a budget, and returning a tool result with the thinking block preserved',
          code: `first = client.messages.create(
    model=settings.PAYROLL_MODEL,
    max_tokens=8000,
    thinking={"type": "enabled", "budget_tokens": 3000},   # budget < max_tokens
    system=SYSTEM,
    tools=[GET_PAYSLIP_TOOL],
    messages=[{"role": "user", "content": build_user_turn(POLICY, q)}],
)
# first.content == [thinking block (with signature), tool_use block]

tool_use = next(b for b in first.content if b.type == "tool_use")
payslip = get_payslip(**tool_use.input)

second = client.messages.create(
    model=settings.PAYROLL_MODEL,
    max_tokens=8000,
    thinking={"type": "enabled", "budget_tokens": 3000},
    system=SYSTEM,
    tools=[GET_PAYSLIP_TOOL],
    messages=[
        {"role": "user", "content": build_user_turn(POLICY, q)},
        {"role": "assistant", "content": first.content},  # unchanged: thinking + tool_use
        {"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": tool_use.id, "content": payslip}
        ]},
    ],
)`,
        },
      ],
      walkthrough: `The **system prompt** holds what never changes: the role, grounding rule, privacy rule and output format. The **user turn** holds what changes per request, separated by **XML tags**: the policy text, the examples, and the question. Because the policy sits in \`<pay_policy>\`, the rule "answer only from <pay_policy>" has a clear referent. The two **examples** show the exact \`<answer>\` format and include the edge case the team cares about most (asking about someone else's pay). Application code still checks that the reply has an \`<answer>\` tag and enforces the word limit, since prompt rules are not guarantees.

The second artifact enables **extended thinking** with a 3,000-token budget inside an 8,000-token max_tokens. The first response contains a thinking block followed by a tool-use request. When the app returns the payslip, it sends **first.content exactly as received** as the assistant turn, so the thinking block and its signature travel back with the tool-use block. The tool_result references the tool_use id. If the code had rebuilt the assistant turn from the tool-use block alone, it would discard the reasoning that led to the call and the API may reject the request.`,
    },
    compare: {
      question: 'A contract-review prompt misses about 15% of risky clauses. Should the team enable extended thinking, or first restructure the prompt with explicit criteria and examples?',
      a: {
        title: 'Enable extended thinking with a moderate budget',
        body: 'Keep the prompt, turn on thinking, and let the model reason about each clause before answering. Quick to try; costs extra latency and tokens on every request.',
        chooseWhen: 'Failure analysis shows the model has the right criteria but makes reasoning errors on clauses with several interacting conditions, and the latency budget allows it.',
      },
      b: {
        title: 'Restructure: explicit risk criteria, tagged contract text, edge-case examples',
        body: 'Define what counts as risky, put the contract in tags, add examples of subtle risky and safe clauses, and re-run the eval set.',
        chooseWhen: 'The missed clauses fall in categories the prompt never defined, or the model\'s answers show it did not know what counted as risky.',
      },
      decidingDetail: 'The deciding detail comes from reading the misses. If the model never knew a clause type was risky, no amount of thinking will supply the missing criterion: fix the prompt first. If the criteria are clear and the model still fumbles multi-condition clauses, thinking targets that failure. Test each change separately on the same eval set so you know which one moved the score.',
    },
    mistake: {
      mistake: 'Rebuilding the assistant turn from only the tool-use block (or stripping "internal" thinking blocks to save tokens) before sending the tool result back during an extended-thinking tool loop.',
      whyTempting: 'Thinking looks like internal scratch work the app does not need, many codebases already rebuild messages from just the fields they use, and dropping it seems to save tokens.',
      howToRecognize: 'API errors on the second request of a tool loop mentioning thinking blocks, or (where not rejected) the model losing track of why it called a tool and repeating calls. The bug only appears when thinking and tools are both on.',
      fix: 'Append the assistant response content exactly as received, all blocks in order, before the user message with tool_result blocks. Do not edit thinking blocks or their signatures. Trim history between completed exchanges if needed, not inside the current tool loop.',
    },
    exercise: {
      prompt: 'An extraction prompt for shipping invoices is underperforming. For each observed failure, pick the change you would test first.',
      inputs: `Current prompt (single user message, no system prompt):
"Extract the details from this invoice and return them as JSON. Be accurate. <invoice text pasted directly after this sentence>"

Fixed eval set: 200 labelled invoices. Failures were read and grouped.`,
      labels: ['Add few-shot examples', 'Separate content with XML tags', 'Add explicit criteria or output constraint', 'Enable extended thinking'],
      items: [
        { id: 'p1', text: 'On some invoices the model treats a line in the invoice reading "Ignore prior charges" as an instruction and omits charges.', answer: 'Separate content with XML tags', why: 'Instructions and data are mixed. Wrapping the invoice in <invoice> tags and saying it is data to extract from separates the two (validation in code still helps).' },
        { id: 'p2', text: 'Field names vary between runs: "total", "invoice_total", "amount_due".', answer: 'Add explicit criteria or output constraint', why: 'The prompt never states the schema. Listing the exact fields and types (and validating them) fixes format drift directly.' },
        { id: 'p3', text: 'Multi-currency invoices with credits, partial refunds and tax on some lines produce totals that do not reconcile.', answer: 'Enable extended thinking', why: 'The fields are right but the arithmetic over several interacting conditions fails, which is where reasoning before answering helps. Test it separately and keep a code check on the sum.' },
        { id: 'p4', text: 'The model returns "N/A", null, or an empty string inconsistently when a PO number is missing.', answer: 'Add few-shot examples', why: 'An example invoice without a PO number showing the exact expected value teaches the edge case faster than prose.' },
        { id: 'p5', text: 'Dates appear as "03/04/2026" with no way to tell day from month.', answer: 'Add explicit criteria or output constraint', why: 'State the required format (ISO 8601) and how to interpret ambiguous source dates; then validate the format in code.' },
      ],
      solution: `Map each **failure group** to the change that targets it, then test **one change at a time** on the fixed 200-invoice set. Mixed instructions and data (p1) need tags. Format drift (p2, p5) needs explicit output constraints, backed by code validation. Inconsistent edge-case handling (p4) is best taught by an example. Only the reconciliation failures (p3) are a reasoning problem, so extended thinking is the change to try there, and it should not be the first response to format or grounding problems.`,
    },
    check: [
      {
        id: 'dev-prompts-thinking-k1',
        stem: 'In a tool-use loop with extended thinking enabled, how should the application send back a tool result?',
        options: [
          { id: 'a', text: 'Include the previous assistant content unchanged, thinking block first, then add a user message with the tool_result.' },
          { id: 'b', text: 'Send only the tool_result; the API restores earlier blocks automatically.' },
          { id: 'c', text: 'Remove the thinking block to save tokens and keep only the tool_use block.' },
          { id: 'd', text: 'Summarize the thinking block in plain text inside the tool_result.' },
        ],
        correct: 'a',
        why: 'The API is stateless, and during a tool loop the thinking block (with its signature) must travel back unmodified with the tool-use block. Removing, editing or paraphrasing it breaks continuity and can be rejected.',
      },
      {
        id: 'dev-prompts-thinking-k2',
        stem: 'A prompt underperforms. Which diagnostic approach is most reliable?',
        options: [
          { id: 'a', text: 'Rewrite the whole prompt in a new style and check a few outputs by eye.' },
          { id: 'b', text: 'Switch to the most capable model and enable thinking together.' },
          { id: 'c', text: 'Read and group failures, then change one variable at a time against a fixed eval set.' },
          { id: 'd', text: 'Add "be accurate and careful" to the system prompt.' },
        ],
        correct: 'c',
        why: 'Grouping real failures shows what kind of problem you have, and single-variable changes on a fixed set show which fix worked. Whole rewrites, bundled changes and vague exhortations hide cause and effect.',
      },
      {
        id: 'dev-prompts-thinking-k3',
        stem: 'Which task is the strongest candidate for extended thinking?',
        options: [
          { id: 'a', text: 'Labelling short reviews as positive or negative at high volume.' },
          { id: 'b', text: 'Scheduling 30 shifts across staff with availability, skills and overtime limits that interact.' },
          { id: 'c', text: 'Returning a stored FAQ answer that matches a keyword.' },
          { id: 'd', text: 'Reformatting a date string into ISO 8601.' },
        ],
        correct: 'b',
        why: 'Thinking pays off on multi-step problems with interacting constraints. Simple classification, lookups and reformatting gain little and pay extra latency and tokens.',
      },
    ],
    review: [
      { front: 'What belongs in the system prompt versus the user turn?', back: 'System: role, standing rules, output format. User turn: per-request material (documents, question), separated with XML tags, plus examples.' },
      { front: 'Rule for the thinking budget?', back: 'Set budget tokens below max_tokens; start modestly and raise only if your eval set improves, since thinking adds latency and cost.' },
      { front: 'What must you preserve when returning a tool result with thinking on?', back: 'The previous assistant content exactly as received, including the thinking block and its signature, before the tool_result.' },
    ],
    sources: ['pe-system-prompts', 'pe-xml-tags', 'pe-multishot', 'pe-clear-direct', 'pe-overview', 'api-extended-thinking', 'api-implement-tool-use', 'eval-tests', 'dev-course-pages', 'app-authored'],
    notes: [
      {
        date: NOTE_DATE,
        text: 'Extended thinking details vary by model and over time: the minimum budget, whether models return full or summarized thinking, interleaved thinking between tool calls (which can relax the budget-below-max_tokens rule), adaptive or effort-based alternatives to a fixed budget, restrictions on tool_choice and sampling parameters while thinking is on, and how earlier-turn thinking blocks are counted. Check the current extended-thinking docs for your model.',
      },
    ],
  },
];
