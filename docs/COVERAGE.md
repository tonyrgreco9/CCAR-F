# Source coverage report

Updated 2026-11-21. The interactive version is the **Coverage** page in the app (`#/coverage`).

## Sources

| Source | Status |
| --- | --- |
| Claude Certified Architect – Foundations Exam Guide **v1.1, effective November 2026** | Downloaded from Anthropic's public course file storage and read in full. Authority for exam scope. Local copy: `docs/source/` (not committed; link in the app). |
| Claude Certified Developer – Foundations path (5 courses) | Public course landing pages (descriptions, objectives, durations) read via web search. Lessons require a Claude Partner Network login and were **not** used. |
| Anthropic / MCP documentation | Pages could not be opened from the build environment (network policy). Version-sensitive details carry dated notes in lessons. |

## Architect coverage against the official guide

- 30 task statements, official titles.
- **240 / 240** Knowledge/Skills bullets mapped to the lesson sections that teach them, each with a description reviewed against the lesson text.
- **240 / 240** bullets assessed by at least one bank question (one bullet, 3.5.S2, has a partial-coverage note: the performance-requirements aspect is taught but not separately assessed).
- 12 guide sample questions mapped by topic to lessons; bank items that closely copied a sample were rewritten into different situations.
- 4 preparation exercises mapped to lessons and case studies.
- Out-of-scope topics removed from assessed items (e.g. key rotation).
- Bank: 256 questions, 244 families, all six scenarios; every 4-scenario combination yields a valid 60-item form, and the first two forms for a new learner share no family.

## Developer Foundations

| Course | Minutes | Public objectives | Architect lessons | Companion lessons |
| --- | --- | --- | --- | --- |
| 1. MSO Foundations | 57 | 5 | 4.2, 4.5 | tokens & context, model selection, API access |
| 2. Production-Grade Prompting, Agents & Tool Use | not published | 6 | 1.1, 1.4, 1.6, 2.1, 4.1, 4.2, 5.2 | prompts & extended thinking |
| 3. Claude Code, MCP & Integration | not published | 5 | 1.3, 1.5, 2.4, 3.1, 3.2, 3.4 | MCP server, Claude Code extensions |
| 4. Production Engineering, Evals & Security | 211 | 5 | 2.2, 4.5, 5.3 | evals, security, cost |
| 5. Accelerators & IP Contribution | 155 | 4 | — | accelerators, deployment platforms |

Still unavailable for every course: the lesson list, transcripts, slides and in-course exercises (partner login). The expansion of "MSO" is not stated publicly.

## Points flagged for verification against current docs

Lessons keep dated notes (2026-11-21) wherever current product behaviour may differ from the guide or from the author's knowledge, for example: hook output field names, exact permission-mode names, plugin manifest paths, MCP SDK method names, structured-output parameter names, extended-thinking budget rules, and model availability on cloud platforms.
