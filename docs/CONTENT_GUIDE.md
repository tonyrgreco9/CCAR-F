# Content authoring guide

This app is **independent exam preparation** for Claude Certified Architect – Foundations (CCAR-F).
All lessons, questions, and case studies are original. Do not copy official exam questions or
private course content. Do not invent citations — cite only IDs from `src/content/sources.ts`.

Read these first: `src/content/types.ts` (contracts), `src/content/blueprint.ts` (domains,
task statements, scenario briefs), `src/content/sources.ts` (citable source IDs).

## Source status

- The CCAR-F exam guide was **not supplied** (no file in `docs/`). Its "Knowledge of" / "Skills in"
  bullets are unavailable. Teach each task statement fully using your own decomposition
  (`learningPoints`), and never claim the lesson matches the guide's bullets.
- Anthropic docs could not be fetched. Write only product facts you are confident are current and
  well established. When behavior is version-sensitive or may have changed (tool renames, flags,
  config keys), say so in a lesson `notes` entry dated `2026-11-20`, e.g. "Verify against current docs".
- Never claim complete coverage.

## Facts you may rely on (state carefully)

- Messages API tool use: assistant `tool_use` blocks carry `id`, `name`, `input`; the client runs the
  tool and returns a `user` message whose content has `tool_result` blocks with matching `tool_use_id`,
  optional `is_error: true`. All tool results for one assistant turn go back in one user message.
- `stop_reason` values: `end_turn`, `tool_use`, `max_tokens`, `stop_sequence`, `pause_turn`, `refusal`.
  An agent loop continues while `stop_reason == "tool_use"`; it should not decide completion by
  parsing assistant text, nor rely only on an arbitrary iteration cap as the primary stop signal
  (a cap is a safety backstop).
- `tool_choice`: `{"type":"auto"}` (default), `{"type":"any"}` (must call some tool),
  `{"type":"tool","name":"..."}` (must call that tool), `{"type":"none"}`.
- MCP tool results can set `isError: true` with content describing the failure; useful structured
  errors distinguish transient vs. validation vs. business-rule vs. permission errors and say whether
  a retry can help.
- Agent SDK: subagents are invoked through the Task tool (newer releases may name it Agent); the
  coordinator's `allowedTools` must include it. Subagents do **not** inherit the coordinator's
  conversation — anything they need must be passed explicitly in the prompt. Multiple Task calls in
  one coordinator response run in parallel. `AgentDefinition` has description, prompt, tools.
  Hooks: `PreToolUse` (can block/modify a call — deterministic enforcement), `PostToolUse` (can
  transform/normalize results before the model sees them). Sessions: `resume` with a session ID;
  `fork_session` to branch from a resumed session without mutating the original.
- Prompt instructions are probabilistic; hooks/code gates are deterministic. Use deterministic
  enforcement when a rule must hold every time (e.g. identity verified before refund).
- Claude Code: `~/.claude/CLAUDE.md` (user, not shared), `./CLAUDE.md` or `./.claude/CLAUDE.md`
  (project, committed), subdirectory CLAUDE.md files load when Claude works in that directory,
  `@path` imports, `.claude/rules/*.md` with `paths:` glob frontmatter for conditional loading,
  `/memory` to see loaded memory. Custom commands: `.claude/commands/name.md` (project) and
  `~/.claude/commands/` (personal), `$ARGUMENTS`. Skills: `.claude/skills/<name>/SKILL.md` with
  frontmatter (`name`, `description`, optional `allowed-tools`, `context: fork` to run in an isolated
  subagent context, `argument-hint`). Skills are loaded on demand by description; CLAUDE.md is always loaded.
  Plan mode: read-only exploration and a proposed plan before edits; good for multi-file,
  architectural, or ambiguous changes; direct execution for small, well-specified changes.
  `/compact` summarizes context; `/clear` resets. Explore subagent isolates verbose discovery.
- MCP in Claude Code: project scope `.mcp.json` (committed, shared) with `${ENV_VAR}` expansion for
  secrets; user scope (`~/.claude.json`) for personal servers; `claude mcp add --scope project|user|local`.
- Built-in tools: Grep searches file contents by regex; Glob finds files by name pattern; Read reads
  a file (supports offset/limit); Edit does exact unique-string replacement (fails if the anchor
  text is not unique — then Read and use a more specific anchor, or Write the whole file); Write
  creates/overwrites a whole file; Bash runs commands.
- CI: `claude -p "<prompt>"` (non-interactive/print mode), `--output-format json` (or `stream-json`),
  `--json-schema` for schema-constrained output in recent versions, `--allowedTools` / `--disallowedTools`,
  `--max-turns`. A session that wrote code is a poor reviewer of that code — use an independent
  instance. Pass prior review findings so re-runs report only new/unresolved issues.
- Message Batches API: ~50% cost, results within 24 h (often faster), no latency SLA, each request has
  a `custom_id` for matching results; requests are independent (no multi-turn tool loop inside a
  batch request). Good for overnight/backlog work, wrong for blocking pre-merge checks or live chat.
  Resubmit only failed `custom_id`s, after fixing the cause (e.g. chunk oversized docs).
- Structured output: forcing a tool with an `input_schema` (or structured outputs / JSON schema) removes
  JSON syntax errors but does **not** prevent semantic errors (values in wrong fields, sums that don't
  add, fabricated values for required fields). Make fields that may be absent nullable/optional so the
  model is not pushed to fabricate; add "unclear"/"other"+detail enum values; validate semantically;
  retry with the specific validation error when the information is in the source — retries do not
  help when the information is absent.
- Few-shot examples: 2–4 targeted examples showing ambiguous cases and the reasoning for the choice
  generalize better than long rule lists; they fix inconsistent format and judgment on edge cases.
- Explicit criteria ("flag only when X and Y; do not flag style preferences") reduce false positives
  better than "be conservative" or "only report high-confidence issues". High false-positive categories
  erode trust in all categories — disable or tighten them while improving.
- Multi-pass review: per-file local passes plus a separate cross-file integration pass beat one
  giant pass over many files (attention dilution).
- Context: progressive summarization loses exact numbers/dates/IDs — keep a structured "case facts"
  block outside summarized history. Lost-in-the-middle: put key facts at start/end, use headers.
  Trim verbose tool results to relevant fields. Scratchpad/notes files survive `/compact`.
- Escalation: escalate on explicit customer request for a human, policy gaps/exceptions, or inability
  to make progress — not on sentiment or the model's self-reported confidence. Ask for clarification
  when multiple records match instead of guessing.
- Error propagation: subagents return structured failure context (what was attempted, error type,
  partial results, alternatives) — not silent empty results and not a whole-workflow abort.
  "No results found" (valid empty) differs from "search failed" (access failure).
- Human review: aggregate accuracy can hide poor accuracy on specific document types/fields; validate
  per segment with stratified samples before reducing review; route by field-level confidence that
  has been calibrated against labeled data.
- Provenance: keep claim→source mappings (URL/doc, page, date, quote) through every summarization step;
  preserve conflicting values with attribution rather than picking one; include dates to separate
  "changed over time" from "contradiction".

## Writing rules for questions

- One realistic technical decision per item. The stem must contain the facts that decide it
  (e.g. what the backend records, whether a status lookup exists, whether retries are idempotent).
- Exactly 4 options for single-answer items; 5 or 6 options for multiple-response items.
  Every stem ends with an explicit instruction: "Select ONE.", "Select TWO.", or "Select THREE."
- Distractors must be plausible — each should be the right answer under some different, realistic
  condition. Put that condition in `wouldBeRightIf` (strongly encouraged for every distractor).
- No trivia (no "what is the exact flag name" unless the decision depends on it), no trick wording,
  no "all of the above", no "none of the above", no option that is obviously longer/more qualified
  than the others, no negative stems ("Which is NOT...").
- Vary which authored option ID is correct (the app shuffles, but authored order must also vary).
- Option text must not reference other options by letter. **Rationale fields must never mention
  option letters (A–F) or say "X is better"** — they are shown next to shuffled options. Every
  rationale field must be specific to that option and the scenario (≥ 60 characters). Generic text
  like "This is incorrect because another answer is best" is rejected by tests.
- Distractor fields: `assumption` (what the learner assumed), `refutingFact` (the specific stem fact
  that breaks it — quote or closely paraphrase the stem), `consequence` (what would happen if you did
  it), `wouldBeRightIf` (one realistic changed condition).
- Correct-option fields: `whyItWorks` (how it meets the requirements), `supportingClue` (the stem
  detail that supports it).
- `decidingClue`: the one detail that decides the item. `explanation`: 2–4 sentences.
- `remediation`: `{ lesson: '<objective>', section: <one of concept|example|compare|mistake|exercise|check|review> }`
  pointing at the section that teaches the missed decision (usually `compare` or `mistake`).
- `sources`: 1–3 IDs from `sources.ts`; always include the relevant `guide-dN`.
- Family IDs: `<scenario>-<short-slug>`. Question IDs: `<familyId>-v1` (and `-v2` for a close variant).
  A new family requires a meaningfully different decision, failure mode, or constraint — re-skinning,
  renaming, or paraphrasing is a variant (same family). When a changed constraint flips the right
  answer, that is a **different family**.
- Stems may extend the scenario brief with specifics (names, numbers, traces, config). Keep stems
  self-contained and 40–160 words; code/config/trace snippets in fenced blocks are encouraged.

## Writing rules for lessons

Each lesson follows: concept → example → compare → mistake → exercise → check → review.
- `outcome`: one concrete sentence ("Given an agent trace, decide whether to continue the loop...").
- `concept`: plain English first, then terminology; 250–450 words.
- `example`: realistic code/config/tool trace/sample data in `artifacts`, with a walkthrough.
- `compare`: two plausible designs; `decidingDetail` names the detail that makes each appropriate.
- `mistake`: a common mistake, why it seems reasonable, how to recognize it, the fix.
- `exercise`: sample inputs and 4–6 items the learner labels; each item has the answer and why.
- `check`: 3 closed-book items (4 options each, one correct) with explanations.
- `review`: 2–3 flash cards.
- `learningPoints`: 4–7 app-authored sub-objectives covering the concept, its application, and
  when another approach is better.
- Lesson markdown supports: paragraphs, `### headings`, **bold**, *italic*, `code`, fenced code,
  `- ` bullets, `1. ` lists, `> ` callouts, [links](url). No HTML, no tables.
