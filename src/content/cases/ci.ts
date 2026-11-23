import type { CaseStudy } from '../types';

// Original guided case study for the ci scenario (Quarry Labs). Not an official exam item.

export const caseStudy: CaseStudy = {
  scenario: 'ci',
  title: 'Rebuilding Quarry\'s PR review bot',
  brief: `Quarry Labs' first Claude review bot has lost the team's trust. It runs \`claude -p\` on every push to a pull request in the main monorepo and posts its free-text output as PR comments. A parser script tries to pull severities out of that text to feed the merge gate.

Three complaints dominate the retro:

- **Broken automation.** About one PR in eight produces output the parser cannot read, so the merge gate fails open and someone has to re-run the job.
- **Noise and repetition.** Every push reposts the full list of findings, including issues the author already fixed. Large PRs get detailed comments on the first handful of files and almost nothing on the rest.
- **Cost.** A 60-file platform PR last week cost more than a typical day of reviews, and the nightly tech-debt scan of about 3,000 modules is now the single largest line item.

You are the platform engineer asked to redesign the pipeline over the next sprint. The review must keep running on ephemeral runners, the pre-merge check must stay fast enough that developers do not walk away, and finance wants monthly spend down by about a third.`,
  constraints: [
    'Runners are ephemeral: no session state survives between jobs, and only uploaded artifacts persist from one run to the next.',
    'The pre-merge review check blocks the merge button; developers wait on it and expect it to finish within about 10 minutes.',
    'Findings must be posted as inline comments (path, line, severity) by a script, and blocker severity feeds the merge gate.',
    'The model API key and the code-host token come only from the CI system\'s masked secrets as environment variables; nothing credential-like is committed.',
    'Monthly Claude spend must drop by roughly 30% without removing the pre-merge review.',
    'The nightly tech-debt report is read by engineering leads during the following day; a report a few hours late is acceptable.',
  ],
  decisions: [
    {
      id: 'output-contract',
      prompt: `**Decision 1: the output contract.** The parser fails on about one PR in eight because the bot's prose changes shape between runs: tables one time, numbered lists the next, sometimes a friendly preamble. Inline comments need a path, a line, a severity, and a message for each finding. How should the review step produce its results?`,
      options: [
        {
          id: 'a',
          text: 'Keep free text, add a strict format instruction to the prompt ("one finding per line: path:line | severity | message") with examples, and harden the regex parser.',
          consequence: 'Failures drop for a while, but formats still drift on unusual diffs. Each new variation needs another regex patch, and the merge gate keeps failing open at random.',
        },
        {
          id: 'b',
          text: 'Use schema-constrained JSON output, check each finding against the diff (line inside a changed hunk), and re-prompt failures with the specific error.',
          consequence: 'Parse failures disappear. The validation step catches the remaining well-formed but wrong values, such as lines outside the diff, and fixes most of them with a targeted retry. The gate reads severity reliably.',
        },
        {
          id: 'c',
          text: 'Post the raw output as one summary comment so nothing can fail to parse, and have the merge gate block whenever the comment contains the word "blocker".',
          consequence: 'Nothing fails to parse, but authors lose inline anchoring and the gate trips on any mention of "blocker", including "no blockers found". Developers start ignoring the summary.',
        },
      ],
      best: 'b',
      walkthrough: `The deciding fact is that a **program** consumes the output: an inline-comment poster and a merge gate. Prompt instructions about format are probabilistic, so free text will keep drifting however strict the wording. Schema-constrained JSON removes syntax and shape errors.

It does not remove *semantic* errors, though. A finding can be valid JSON with a line number outside any changed hunk, or with the code snippet in the message field. That is why the right design adds a validation step against the real diff and retries with the specific error. The retry works because the correct information (the hunk ranges) exists. A summary comment avoids parsing but gives up the inline anchoring the constraints require, and string-matching "blocker" is a fragile gate. Flag names for schema-constrained output vary between CLI versions, so check the current CLI reference when you implement this.`,
    },
    {
      id: 'large-pr',
      prompt: `**Decision 2: large PRs.** The 60-file platform PR touched a shared configuration library and nine consuming services. The bot reviewed all 60 diffs in one prompt, after first exploring the repository "to understand context". It made about 200 tool calls, gave detailed comments on the first several files and almost none on the rest, and missed that a renamed config key broke two consumers. How should large PRs be reviewed?`,
      options: [
        {
          id: 'a',
          text: 'Gather context from the diff outward (callers and definitions of changed symbols), run per-file passes, then an integration pass over changed interfaces.',
          consequence: 'Each file gets full attention, and the integration pass catches the renamed-key breakage across modules. Targeted search replaces open-ended exploration, cutting tool calls and tokens sharply.',
        },
        {
          id: 'b',
          text: 'Keep one pass with a larger context budget, let it explore the repository first, and instruct it to review every file equally and check cross-module consistency.',
          consequence: 'Cost rises further, later files still get thin coverage because attention is spread across 60 diffs plus exploration output, and cross-module breaks are still easy to miss.',
        },
        {
          id: 'c',
          text: 'Send PRs over 30 files to the Message Batches API at half the cost, letting authors merge without waiting and addressing findings in a follow-up PR.',
          consequence: 'Cost per large PR falls, but the riskiest PRs merge unreviewed, and batch results arrive with no latency guarantee, after the code is already merged.',
        },
      ],
      best: 'a',
      walkthrough: `Two separate failures show up here. **Attention dilution:** one pass over 60 diffs gives uneven coverage. **Unscoped context:** open-ended exploration of a huge monorepo burns tokens on code that has nothing to do with the change.

Per-file passes restore depth, and a dedicated integration pass looks at what crosses module boundaries, which is exactly where the renamed config key broke consumers. Gathering context from the diff outward (Grep for the changed symbols, then read only those regions) gives each pass what it needs without exploring the whole repository. Splitting files across independent reviewers would help depth but not cross-module consistency. Moving a *blocking* check to batch processing contradicts the constraint that developers wait on it.`,
    },
    {
      id: 'reruns',
      prompt: `**Decision 3: re-runs on new pushes.** A PR with five pushes collected the same 18 comments five times, including comments on issues the author had already fixed. The author has replied in several threads. Each run is a fresh invocation on an ephemeral runner. What should a re-run do?`,
      options: [
        {
          id: 'a',
          text: 'Store the session ID as an artifact and resume the previous run\'s Claude Code session, so the model remembers what it posted and what was discussed.',
          consequence: 'The resume fails or starts empty because the earlier runner and its session files are gone. Even on a persistent host, the old session would reason over stale code from earlier commits.',
        },
        {
          id: 'b',
          text: 'Delete all earlier bot comments at the start of each run and post the full new set, so the PR only ever shows findings for the latest commit.',
          consequence: 'The PR shows only the latest findings, but the author\'s discussion threads are destroyed on every push and open issues reappear as if they were new.',
        },
        {
          id: 'c',
          text: 'Save validated findings with stable IDs as an artifact; on re-runs, pass them in with the current diff and report only new or unresolved issues.',
          consequence: 'Each push adds only new findings and marks resolved ones, existing threads stay intact, and authors can see progress. Prompt size grows only by the compact findings list.',
        },
      ],
      best: 'c',
      walkthrough: `The deciding constraint is that **runners are ephemeral and only artifacts persist**. Session resumption is a good tool when a session survives on a persistent host, but here there is nothing to resume. Even where there is, the old context would describe code that has since changed.

Passing the structured findings from the previous run as explicit input gives a fresh invocation exactly the state it needs: what was already reported and with what IDs. It can then report only new or unresolved issues and mark fixed ones. Deleting and reposting looks like a clean slate but destroys the human discussion that makes review comments useful.`,
    },
    {
      id: 'cost',
      prompt: `**Decision 4: meeting the cost target.** After the first three changes, spend is down about 12%. The nightly tech-debt scan (about 3,000 module-level requests) is now the largest single cost. Finance still wants roughly 30% off. What should you change?`,
      options: [
        {
          id: 'a',
          text: 'Move both the pre-merge review and the nightly scan to the Message Batches API, polling for results every 30 seconds so the pre-merge check stays responsive.',
          consequence: 'Costs fall, but pre-merge checks now take unpredictable lengths of time, sometimes hours, because polling does not speed up batch processing. Developers stop waiting and merge around the gate.',
        },
        {
          id: 'b',
          text: 'Batch the nightly scan with a custom_id per module, keep the pre-merge check synchronous, and resubmit only failed IDs once their cause is fixed.',
          consequence: 'The largest cost line drops by about half. The blocking check keeps its latency. Failed items, such as oversized modules that must be chunked first, are recovered without paying again for the thousands that succeeded.',
        },
        {
          id: 'c',
          text: 'Keep everything synchronous and cap the pre-merge review at the 10 largest files per PR, since the largest files carry most of the token cost.',
          consequence: 'Savings are modest and come from the wrong place: small high-risk changes, like the renamed config key, go unreviewed while the expensive nightly scan is unchanged.',
        },
      ],
      best: 'b',
      walkthrough: `Match each workload to its latency need. The **nightly scan** tolerates delay (leads read it the next day), so it is a strong fit for batch processing: roughly half the cost, results usually well within the processing window, and a \`custom_id\` per module so results can be matched regardless of order. The **pre-merge check** blocks developers, so it needs synchronous calls; batch processing has no latency guarantee.

Recovery matters too. When some batch items fail, resubmit only those \`custom_id\`s after addressing the cause: chunk inputs that exceeded the context window, and resubmit transient failures as they are. Never re-run the whole batch. Cutting review coverage saves little and removes protection where it matters most.`,
    },
  ],
  wrapUp: `The redesigned pipeline treats the bot as a component of a system rather than a chat partner:

- A **schema-constrained output contract** with semantic validation, so automation never parses prose.
- **Scoped, multi-pass review**: per-file depth plus an integration pass, with context gathered from the diff outward.
- **Explicit state between runs**: prior findings passed in as an artifact, because ephemeral runners have no session to resume.
- **Workload-appropriate APIs**: synchronous calls for the blocking check, batch processing with custom_id recovery for the nightly scan.

Around these sit the CI basics from the constraints: non-interactive mode, a tool allowlist and turn cap for each job, and secrets supplied only through masked environment variables. In practice, CLI flag names for structured output and tool permissions change between versions, so confirm them against the current CLI reference when implementing.`,
  lessons: ['3.6', '4.3', '4.6', '5.4', '1.7', '4.5'],
};
