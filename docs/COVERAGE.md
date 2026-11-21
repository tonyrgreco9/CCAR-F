# Source coverage report

Checked 2026-11-20. The interactive version is the **Coverage** page in the app (`#/coverage`).

## Sources that were unavailable

| Source | Status | What is missing |
| --- | --- | --- |
| CCAR-F exam guide (`docs/`) | Not present in the repository | Version; effective date; official passing score; every "Knowledge of" and "Skills in" bullet for the 30 task statements; preparation exercises; sample questions and their explanations |
| Claude Certified Developer – Foundations path (anthropic-partners.skilljar.com) | HTTP 403 from the environment's network policy; no `docs/academy/` exports | All lessons, learning objectives, transcripts and slides for: 1. MSO Foundations; 2. Production-Grade Prompting, Agents & Tool Use; 3. Claude Code, MCP & Integration; 4. Production Engineering, Evals & Security; 5. Accelerators & IP Contribution |
| Prerequisite courses | Not reachable | Claude 101; Claude Code 101; Claude Platform 101; Claude Code in Action; AI Fluency: Framework & Foundations; Building with the Claude API; Introduction to Model Context Protocol; Model Context Protocol: Advanced Topics; AI Capabilities and Limitations |
| Anthropic documentation (docs.claude.com, anthropic.com/engineering, modelcontextprotocol.io) | HTTP 403 | Live verification of every command, config key, API behaviour and SDK example. All cited pages are marked "not verified" in the app |

## What was used instead

- Task statements, domain weights, scenario families, and exam format: restated in the build request.
- Product facts: the author's knowledge, limited to well-established behaviour. Anything version-sensitive is flagged in a dated lesson note (2026-11-20).
- Developer path: module order and titles only. Architect-lesson links are **inferred from titles** and labelled that way. 0 verified Academy learning objectives are mapped.
- Refreshers and diagnostic: original content on each course's public subject. They don't claim to reflect course content.

## Architect coverage (measured against task statements, not guide bullets)

All 30 task statements have a lesson with a worked example, a design comparison, a common mistake, a labelled exercise, 3 knowledge checks, review cards, and 5–8 bank question families. Each lesson's `learningPoints` are app-authored sub-objectives. They can't be checked against the guide's bullets until the guide is supplied. **This is not a claim of complete coverage.**

## Points flagged for verification against current docs

Authors flagged these as uncertain. Each appears in a dated lesson note or is kept out of the deciding detail of a question:

- Agent SDK: Task vs Agent tool name; `AgentDefinition` fields; hook callback signatures and output fields (`permissionDecision`, `hookSpecificOutput`, replacing MCP tool output in PostToolUse); `HookMatcher` pattern syntax; `resume` / `fork_session` option names; whether hooks on a coordinator apply to subagents.
- Claude Code: skill frontmatter (`context: fork`, `allowed-tools` semantics: restrict or pre-approve); commands-into-skills merge and name precedence; `@import` depth and approval; when subdirectory CLAUDE.md and `paths:` rules load; plan-mode entry; Explore subagent name and tools; `/compact` focus instructions; MCP scope names and the default scope for `claude mcp add`; `--json-schema` availability and its result field; `--allowedTools` syntax.
- API: forced `tool_choice` with extended thinking; `pause_turn` handling; exact Message Batches result types, limits and ordering; structured-outputs parameter names and supported JSON Schema keywords.
- MCP: field names such as `errorCategory` and `isRetryable` are app conventions, not spec fields.
