import type { BulletCoverage } from '../types';

// Domain 1: official guide bullet -> lesson section + assessing questions. Filled by content audit.
export const coverage: Record<string, BulletCoverage> = {
  // ---------------------------------------------------------------- 1.1
  '1.1.K1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'The concept walks through one loop pass (send, read stop_reason, run tools, return results, call again); the Python loop artifact implements it, and the exercise has learners pick the next action for six stop_reason cases.',
    questions: ['support-loop-stop-reason-v1', 'ci-triage-loop-stop-reason-v1', 'research-parallel-tool-results-v1'],
  },
  '1.1.K2': {
    sections: ['concept', 'example', 'check'],
    how: 'The concept explains that each request carries the whole history, which is the only thing Claude reasons from, so the assistant turn and its tool_result blocks must be appended; the walkthrough shows why dropping tool_use blocks breaks pairing, and check 1.1-c1 tests it.',
    questions: ['support-loop-parallel-results-v1', 'research-parallel-tool-results-v1', 'extraction-parallel-tool-results-v1'],
  },
  '1.1.K3': {
    sections: ['concept', 'compare', 'review'],
    how: 'A "Who decides the next step?" concept section contrasts model-driven tool selection with pre-configured decision trees and fixed sequences; the compare section weighs the two designs and a review card states when each fits.',
    questions: ['support-model-driven-tools-v1'],
  },
  '1.1.S1': {
    sections: ['concept', 'example', 'exercise', 'mistake'],
    how: 'The loop artifact continues on tool_use and returns on end_turn with explicit branches for the other stop reasons; the exercise and the mistake fix both drill branching on stop_reason rather than text.',
    questions: ['support-loop-stop-reason-v1', 'ci-triage-loop-stop-reason-v1', 'ci-triage-max-tokens-v1', 'extraction-max-tokens-truncation-v1'],
  },
  '1.1.S2': {
    sections: ['example', 'check', 'review'],
    how: 'The JSON trace shows two tool_use blocks answered by two tool_result blocks in one user message (one with is_error), and checks 1.1-c1 and 1.1-c2 plus a review card test returning results correctly between iterations.',
    questions: ['support-loop-parallel-results-v1', 'research-parallel-tool-results-v1', 'extraction-parallel-tool-results-v1'],
  },
  '1.1.S3': {
    sections: ['concept', 'mistake', 'check', 'exercise'],
    how: 'The concept rejects parsing phrases like "Final answer", treating any text block as completion, and using the iteration cap as the stop condition; the mistake section covers the "DONE" string match plus small cap, and check 1.1-c3 treats frequent cap hits as a defect.',
    questions: ['support-loop-stop-reason-v1', 'ci-triage-loop-stop-reason-v1'],
  },

  // ---------------------------------------------------------------- 1.2
  '1.2.K1': {
    sections: ['concept', 'example', 'check'],
    how: 'The hub-and-spoke section says all traffic, failures, and routing go through the coordinator; the SDK config shows subagents returning to the coordinator only, and check 1.2-c1 asks how one subagent\'s figures reach another.',
    questions: ['research-hub-and-spoke-v1', 'support-coordinator-case-cap-v1'],
  },
  '1.2.K2': {
    sections: ['concept'],
    how: 'The opening concept paragraph states that each subagent has an isolated context and does not inherit the coordinator\'s conversation, including the user\'s clarifications, unless the coordinator writes them into the task.',
    questions: ['extraction-subagent-isolated-context-v1'],
  },
  '1.2.K3': {
    sections: ['concept', 'exercise', 'review'],
    how: 'The concept covers decomposition, delegation, aggregation, and a "Choosing which subagents to invoke" section on matching subagents to query complexity; exercise item 4 (a memo summary fanned out to four subagents) applies it.',
    questions: ['research-subagent-selection-v1', 'research-coverage-refinement-loop-v1', 'devprod-flow-fanout-v1'],
  },
  '1.2.K4': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'The "Root-causing narrow output" section and the US-only trace show a decomposition that omitted two regions; the mistake section warns against tuning subagents, and check 1.2-c2 tests locating the cause in the coordinator.',
    questions: ['research-narrow-decomposition-v1', 'research-narrow-decomposition-v2'],
  },
  '1.2.S1': {
    sections: ['concept', 'exercise'],
    how: 'The concept explains invoking only the subagents a query needs (a single-figure lookup goes to the data analyst alone) and adding more if early results call for it; the exercise solution links the over-delegated memo task to this.',
    questions: ['research-subagent-selection-v1'],
  },
  '1.2.S2': {
    sections: ['concept', 'exercise'],
    how: 'The decomposition rules require partitioned tasks by subtopic, region, or source type, with each subagent told what belongs to the others; exercise item 6 labels three tasks summarizing the same policy document as a decomposition fault.',
    questions: ['research-overlapping-scopes-v1'],
  },
  '1.2.S3': {
    sections: ['concept', 'example', 'review'],
    how: 'The concept describes the iterative refinement loop (evaluate the synthesis draft for gaps, re-delegate targeted queries, re-invoke synthesis, stop at sufficient coverage or a round limit); the planning prompt artifact shows the coverage check and a review card summarizes the loop.',
    questions: ['research-coverage-refinement-loop-v1'],
  },
  '1.2.S4': {
    sections: ['concept', 'check'],
    how: 'The hub-and-spoke section explains that routing everything through the coordinator gives one log of what each agent received, controlled information flow, and consistent error handling, and that direct shortcuts lose this; check 1.2-c1 reinforces it.',
    questions: ['research-hub-and-spoke-v1', 'support-coordinator-case-cap-v1'],
  },

  // ---------------------------------------------------------------- 1.3
  '1.3.K1': {
    sections: ['concept', 'example', 'exercise', 'check', 'review'],
    how: 'The concept and Python config show subagents spawned via the Task tool with "Task" in allowed_tools; exercise item 1 and check 1.3-c1 diagnose a coordinator that cannot delegate because Task is missing.',
    questions: ['research-allowedtools-task-v1'],
  },
  '1.3.K2': {
    sections: ['concept', 'mistake', 'exercise', 'check'],
    how: 'The "Subagents start fresh" section says subagents see only their task prompt and keep no memory between invocations; the mistake section covers prompts that say "the sources we found above", and check 1.3-c2 asks what the Task prompt must contain.',
    questions: ['codegen-subagent-context-pass-v1', 'devprod-subagent-brief-v1', 'research-explicit-context-passing-v1'],
  },
  '1.3.K3': {
    sections: ['concept', 'example', 'review'],
    how: 'The Configuration section explains AgentDefinition description (used by the coordinator to choose), prompt, and narrow tools; the example defines web-researcher and doc-analyst with scoped tools and the walkthrough explains each field.',
    questions: ['devprod-agentdefinition-config-v1'],
  },
  '1.3.K4': {
    sections: ['concept', 'check'],
    how: 'The "Scoped and forked context" section explains resuming with fork_session to explore divergent approaches from a shared baseline that is too large to summarize; check 1.3-c3 picks forking for two fixes from one investigation.',
    questions: ['codegen-fork-vs-subagent-baseline-v1'],
  },
  '1.3.S1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'The concept says to pass complete findings, such as search results and document-analysis output for a synthesis subagent; the example Task prompt lists each claim in full, and exercise item 4 sequences a report writer after the analysts with their findings included.',
    questions: ['research-explicit-context-passing-v1', 'devprod-subagent-brief-v1', 'codegen-subagent-context-pass-v1'],
  },
  '1.3.S2': {
    sections: ['concept', 'example'],
    how: 'The concept requires structured entries that keep content (claim or excerpt) separate from metadata (URL, document name, page, date); the example Task prompts pass claims with source, publisher, and date and require JSON with file, page, and quote.',
    questions: ['research-explicit-context-passing-v1'],
  },
  '1.3.S3': {
    sections: ['concept', 'example', 'compare', 'exercise', 'review'],
    how: 'The "Parallel spawning" section and the JSON artifact show two Task calls in one coordinator response; the compare section contrasts parallel and sequential spawning, and exercise item 3 flags unrelated tasks issued one at a time.',
    questions: ['research-parallel-task-calls-v1'],
  },
  '1.3.S4': {
    sections: ['concept', 'review'],
    how: 'A "Goals and quality criteria, not procedures" section contrasts scripted step lists with prompts that state objective, scope, evidence standard, and output format, explaining why scripts break when results differ; a review card restates it.',
    questions: ['research-coordinator-goals-not-steps-v1'],
  },

  // ---------------------------------------------------------------- 1.4
  '1.4.K1': {
    sections: ['concept', 'compare', 'review'],
    how: 'The "Probabilistic versus deterministic" section contrasts prompt instructions with PreToolUse hooks and code gates; the compare section sets a prompt instruction against a hook plus backend check for verification before account changes.',
    questions: ['support-verification-gate-v1', 'ci-gate-prerequisite-v1', 'support-gate-trusts-model-flag-v1'],
  },
  '1.4.K2': {
    sections: ['concept', 'mistake', 'check'],
    how: 'The concept states prompt instructions keep a non-zero failure rate that emphasis and examples only reduce, so verification before financial operations needs code; the mistake section and check 1.4-c1 (1 in 400 refunds unverified) apply it.',
    questions: ['support-verification-gate-v1', 'ci-gate-prerequisite-v1', 'extraction-validation-bound-to-record-v1'],
  },
  '1.4.K3': {
    sections: ['concept', 'example', 'check', 'review'],
    how: 'The "Handoffs to humans" section lists handoff fields (customer, verification, root cause, concerns, actions with amounts, escalation reason, recommended action) for a human without transcript access; the escalate_to_human JSON shows a mid-process handoff with root_cause.',
    questions: ['support-handoff-summary-v1'],
  },
  '1.4.S1': {
    sections: ['example', 'exercise', 'mistake'],
    how: 'refund_gate.py denies issue_refund unless backend-recorded verification exists for the case and customer, returning an actionable reason; exercise items 1 and 5 and the mistake fix apply gates to refunds and plan changes.',
    questions: ['support-verification-gate-v1', 'support-gate-trusts-model-flag-v1', 'ci-gate-prerequisite-v1', 'extraction-validation-bound-to-record-v1'],
  },
  '1.4.S2': {
    sections: ['concept', 'example', 'check', 'review'],
    how: 'The "Multi-concern requests" section gives decompose, investigate in parallel with shared context (one verification), and synthesize one unified reply; the walkthrough applies it to a three-concern case and check 1.4-c3 tests it.',
    questions: ['support-multi-concern-parallel-v1'],
  },
  '1.4.S3': {
    sections: ['example', 'check', 'review'],
    how: 'The example escalate_to_human payload carries customer ID, root cause, refund amount, per-concern status with references, and recommended action; check 1.4-c2 and a review card test which fields a human needs.',
    questions: ['support-handoff-summary-v1'],
  },

  // ---------------------------------------------------------------- 1.5
  '1.5.K1': {
    sections: ['concept', 'example', 'review'],
    how: 'The concept\'s "Cleanup after a tool returns" explains PostToolUse hooks transforming results before the model sees them; hooks.py shows normalize_billing replacing an MCP tool result, and the trace shows what the model receives.',
    questions: ['support-hook-normalize-legacy-v1', 'devprod-timestamp-hook-v1', 'ci-hook-normalize-results-v1', 'extraction-posttooluse-normalize-v1'],
  },
  '1.5.K2': {
    sections: ['concept', 'example', 'check'],
    how: 'The concept\'s "Gatekeeping before a tool runs" explains PreToolUse interception of an over-limit refund; hooks.py implements refund_gate with a per-case running total, and check k1 picks the PreToolUse hook as the guarantee.',
    questions: ['support-hook-cumulative-cap-v1', 'extraction-pretooluse-vendor-erp-v1'],
  },
  '1.5.K3': {
    sections: ['concept', 'compare', 'review'],
    how: 'The terminology and rule of thumb contrast deterministic hooks with probabilistic prompt guidance; the compare section decides the refund cap by the cost of one violation, and a review card explains why the prompt alone is not enough.',
    questions: ['support-hook-cumulative-cap-v1', 'extraction-pretooluse-vendor-erp-v1', 'codegen-posttooluse-formatter-v1'],
  },
  '1.5.S1': {
    sections: ['example', 'exercise', 'check'],
    how: 'normalize_billing converts Unix seconds, ISO dates, and numeric status codes from two MCP tools into ISO 8601 UTC and readable statuses; exercise items e1 and e4 and check k2 apply PostToolUse normalization and trimming.',
    questions: ['support-hook-normalize-legacy-v1', 'devprod-timestamp-hook-v1', 'ci-hook-normalize-results-v1', 'extraction-posttooluse-normalize-v1'],
  },
  '1.5.S2': {
    sections: ['example', 'exercise', 'review'],
    how: 'refund_gate denies refunds that would exceed the case limit and its reason redirects to escalate_to_human, which the trace shows the agent then calling; exercise item e5 and a review card cover denial reasons that point to the alternative workflow.',
    questions: ['support-hook-cumulative-cap-v1', 'extraction-pretooluse-vendor-erp-v1'],
  },
  '1.5.S3': {
    sections: ['compare', 'mistake', 'exercise'],
    how: 'The compare section picks a PreToolUse hook plus prompt over prompt-only for the refund cap; the mistake section covers treating a prompt rule as enforced, and the exercise sorts requirements into hooks or prompt instructions.',
    questions: ['support-hook-cumulative-cap-v1', 'extraction-pretooluse-vendor-erp-v1', 'codegen-posttooluse-formatter-v1'],
  },

  // ---------------------------------------------------------------- 1.6
  '1.6.K1': {
    sections: ['concept', 'compare', 'check', 'review'],
    how: 'The concept frames the choice as who decides the split and when, contrasting code-defined prompt chains with model-generated subtasks; the compare section (60 contracts with a fixed clause list) and check k3 (over-engineered extraction) apply it.',
    questions: ['research-dynamic-decomposition-v1', 'research-fixed-pipeline-digest-v1', 'devprod-table-pipeline-v1', 'codegen-decompose-adaptive-v1'],
  },
  '1.6.K2': {
    sections: ['concept', 'example'],
    how: 'The concept describes a chain that analyzes each file then checks how files fit together; the review_pr sketch runs per-file calls, a validation gate, then an integration pass over summaries and changed signatures.',
    questions: ['ci-review-integration-pass-v1', 'codegen-decompose-fixed-pipeline-v1'],
  },
  '1.6.K3': {
    sections: ['concept', 'example'],
    how: 'The concept explains adaptive decomposition and why its subtasks come from findings; the orchestrator trace shows a profiling subtask (W3) that exists only because earlier workers pointed at one endpoint and migration.',
    questions: ['codegen-decompose-adaptive-v1', 'devprod-adaptive-trace-v1', 'ci-adaptive-investigation-v1'],
  },
  '1.6.S1': {
    sections: ['exercise', 'check', 'review'],
    how: 'The exercise labels six tasks as fixed pipeline, dynamic decomposition, or single call using the whiteboard test; check k2 and a review card reinforce chaining for predictable reviews and dynamic decomposition for investigations.',
    questions: ['research-dynamic-decomposition-v1', 'research-fixed-pipeline-digest-v1', 'devprod-table-pipeline-v1', 'devprod-adaptive-trace-v1', 'ci-adaptive-investigation-v1', 'codegen-decompose-fixed-pipeline-v1'],
  },
  '1.6.S2': {
    sections: ['concept', 'example', 'mistake', 'check', 'review'],
    how: 'The "Single giant pass" failure mode and the mistake section describe attention dilution on a 40-file review; the fix, check k1, and a review card prescribe per-file passes plus a separate integration pass.',
    questions: ['ci-review-integration-pass-v1'],
  },
  '1.6.S3': {
    sections: ['concept', 'exercise', 'review'],
    how: 'A "map, prioritize, adapt" concept section decomposes adding tests to a legacy codebase (map structure, rank high-impact untested areas, re-plan when a dependency such as an untestable database wrapper appears); exercise item e6 and a review card apply it.',
    questions: ['codegen-legacy-tests-plan-v1'],
  },

  // ---------------------------------------------------------------- 1.7
  '1.7.K1': {
    sections: ['concept', 'example', 'review'],
    how: 'The concept explains naming long investigations and returning with claude --resume <session-name> versus --continue for the most recent; the CLI artifact shows a resume by name and a review card contrasts the two.',
    questions: ['codegen-named-session-resume-v1'],
  },
  '1.7.K2': {
    sections: ['concept', 'example', 'check', 'review'],
    how: 'The concept explains fork_session as creating an independent session from a copied baseline; the Python artifact forks two fix designs from one analysis, and check k1 picks forking to keep the analysis unchanged.',
    questions: ['support-session-fork-experiment-v1', 'codegen-fork-compare-v1', 'research-fork-hypotheses-v1', 'devprod-fork-fixes-v1', 'ci-fork-hypotheses-v1'],
  },
  '1.7.K3': {
    sections: ['concept', 'mistake', 'check'],
    how: 'The concept explains that old tool results in history look current to the model; the mistake section covers resuming after teammates changed files without saying so, and check k2 tests stating changes on resume.',
    questions: ['devprod-resume-changed-v1', 'devprod-resume-changed-v2'],
  },
  '1.7.K4': {
    sections: ['concept', 'compare', 'check'],
    how: 'The concept explains why a fresh session with a structured summary is more reliable than a stale resume (stale results are absent, valid conclusions carried forward); the compare section (18 of 25 files changed) and check k3 apply it.',
    questions: ['codegen-session-stale-context-v1', 'codegen-session-stale-context-v2'],
  },
  '1.7.S1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'The concept and CLI artifact show resuming a named investigation days later; exercise item e6 has a developer continue the "invoice-rounding" session by name when it is not the most recent.',
    questions: ['codegen-named-session-resume-v1'],
  },
  '1.7.S2': {
    sections: ['example', 'exercise', 'check'],
    how: 'The Python artifact forks fix A and fix B from the same baseline; exercise items e2 and e5 choose forks for comparing approaches and speculative work, and check k1 compares two refactoring strategies.',
    questions: ['support-session-fork-experiment-v1', 'codegen-fork-compare-v1', 'research-fork-hypotheses-v1', 'devprod-fork-fixes-v1', 'ci-fork-hypotheses-v1'],
  },
  '1.7.S3': {
    sections: ['compare', 'exercise', 'check'],
    how: 'The compare section decides resume-with-notice versus fresh-with-summary by how much history is still true; the exercise sorts five situations into resume, fork, or fresh start, and check k3 tests when to start fresh.',
    questions: ['codegen-session-stale-context-v1', 'codegen-session-stale-context-v2', 'devprod-resume-changed-v2'],
  },
  '1.7.S4': {
    sections: ['concept', 'example', 'exercise'],
    how: 'The CHANGE_NOTICE artifact names each changed file, says to re-read them, and states what did not change; the concept notes this targeted re-analysis is cheaper than re-exploring, and exercise item e4 applies it.',
    questions: ['devprod-resume-changed-v1', 'devprod-resume-changed-v2'],
  },
};
