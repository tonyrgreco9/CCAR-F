import type { BulletCoverage } from '../types';

// Domain 2: official guide bullet -> lesson section + assessing questions. Filled by content audit (2026-11-21).
export const coverage: Record<string, BulletCoverage> = {
  // ---------------------------------------------------------------- 2.1
  '2.1.K1': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept opens by explaining that the model sees only name, description, and schema, so the description is the main routing signal and a one-line description forces guessing; the example shows two one-line "billing records" tools misrouting, and check c1 tests identical descriptions.',
    questions: ['support-tool-desc-invoice-vs-txn-v1', 'research-tool-description-boundaries-v1', 'extraction-tool-descriptions-overlap-v1', 'devprod-tracker-desc-v1'],
  },
  '2.1.K2': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept lists what a strong description covers (purpose, input formats, output incl. empty results, example and edge cases, boundaries); the "after" definitions in the example show input formats, an enum, empty-result meaning, and "Does NOT ... use X" boundaries; review card 1 recaps.',
    questions: ['support-change-plan-typed-inputs-v1', 'extraction-supplier-lookup-contract-v1', 'research-tool-description-boundaries-v1', 'devprod-tracker-desc-v1'],
  },
  '2.1.K3': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept explains how overlapping wording (lookup_invoice vs lookup_transaction; analyze_content vs analyze_document both "analyzes text") leaves the model no basis to choose; the example walkthrough traces a $49.99 question matching both tools; exercise e5 covers a name collision across servers.',
    questions: ['research-tool-description-boundaries-v1', 'extraction-tool-descriptions-overlap-v1', 'devprod-tracker-desc-v1', 'support-tool-desc-invoice-vs-txn-v1'],
  },
  '2.1.K4': {
    sections: ['concept', 'example', 'exercise', 'review'],
    how: 'Concept section "Check the system prompt too" shows "whenever the customer mentions an order, look the order up" pulling return requests to lookup_order despite clear descriptions; the example walkthrough warns about a "bill" keyword undoing the rewrite; exercise e7 and a review card cover the same pattern.',
    questions: ['support-keyword-prompt-override-v1'],
  },
  '2.1.S1': {
    sections: ['concept', 'example', 'check'],
    how: 'The example rewrites two overlapping definitions so each states its record type, trigger phrases, input formats, output, and when to use the sibling tool instead; check c1 asks for the same fix on get_order vs get_shipment.',
    questions: ['support-tool-desc-invoice-vs-txn-v1', 'research-tool-description-boundaries-v1', 'extraction-tool-descriptions-overlap-v1'],
  },
  '2.1.S2': {
    sections: ['concept', 'exercise'],
    how: 'Concept paragraph "Names are part of the description" walks through renaming analyze_content to extract_web_results with a web-specific description and boundary; exercise e5 renames a colliding fetch_doc to fetch_ticket_attachment.',
    questions: ['devprod-tracker-desc-v1'],
  },
  '2.1.S3': {
    sections: ['concept', 'compare', 'exercise', 'check'],
    how: 'Concept splits a generic analyze_document(doc, instruction) into extract_data_points, summarize_content, and verify_claim_against_source, each with a stated output contract; compare contrasts splitting with enum consolidation; exercise e6 and check c3 apply splitting.',
    questions: ['research-split-generic-analyzer-v1'],
  },
  '2.1.S4': {
    sections: ['concept', 'mistake', 'exercise'],
    how: 'Concept tells the learner to search the system prompt for keyword-triggered instructions when misrouting persists and to reword them around the situation; the mistake fix adds reviewing the prompt for such keywords; exercise e7 labels "Reword system prompt".',
    questions: ['support-keyword-prompt-override-v1'],
  },

  // ---------------------------------------------------------------- 2.2
  '2.2.K1': {
    sections: ['concept', 'example'],
    how: 'Concept explains that a failed tool call returns a normal result with isError: true (is_error on the API tool_result) so the model sees and reasons about the failure, distinct from protocol errors; the example shows four results with isError false/true.',
    questions: ['research-structured-mcp-errors-v1', 'ci-mcp-transient-error-v1', 'extraction-ocr-empty-vs-failed-v1', 'devprod-replica-errors-v1'],
  },
  '2.2.K2': {
    sections: ['concept', 'example', 'exercise', 'review'],
    how: 'Concept defines transient (timeouts, service unavailable), validation (bad input), permission, and business (policy violation) categories; the example and exercise give one outcome per category, and a review card maps each to its default response.',
    questions: ['research-structured-mcp-errors-v1', 'extraction-erp-error-categories-v1', 'devprod-replica-errors-v1', 'support-business-rule-error-v1'],
  },
  '2.2.K3': {
    sections: ['concept', 'mistake'],
    how: 'Concept states that a uniform "Operation failed" makes a timeout, a typo, and a policy refusal look identical, so the agent retries hopeless calls and abandons recoverable ones; the mistake section covers bare "Operation failed" and empty-list catch-alls.',
    questions: ['research-structured-mcp-errors-v1', 'extraction-erp-error-categories-v1', 'devprod-replica-errors-v1'],
  },
  '2.2.K4': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept explains that an isRetryable boolean stops the agent resending calls the server says will fail the same way; the TypeScript helper derives the flag from the category; the exercise and check c2 separate retry-with-backoff cases from no-retry cases.',
    questions: ['extraction-erp-error-categories-v1', 'research-structured-mcp-errors-v1', 'support-business-rule-error-v1', 'support-refund-timeout-no-idempotency-v1', 'support-refund-timeout-no-idempotency-v2', 'support-refund-timeout-idempotent-key-v1'],
  },
  '2.2.S1': {
    sections: ['concept', 'example'],
    how: 'Concept lists the payload fields errorCategory, isRetryable, and a human-readable message (plus field, limit, retry-after); the example shows JSON results and a server helper that builds them consistently.',
    questions: ['research-structured-mcp-errors-v1', 'devprod-replica-errors-v1', 'extraction-ocr-empty-vs-failed-v1', 'extraction-erp-error-categories-v1'],
  },
  '2.2.S2': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept paragraph "Business-rule violations need one more thing" calls for retriable: false plus a customer-friendly explanation separate from internal detail; example result 4 carries retriable: false and a customerMessage, and the walkthrough and a review card explain why.',
    questions: ['support-business-rule-error-v1'],
  },
  '2.2.S3': {
    sections: ['concept', 'compare', 'check'],
    how: 'Concept says subagents retry transient errors locally and fix validation errors, propagating only unresolved ones with what was attempted, the category, partial results, and alternatives; the compare section contrasts local recovery with propagation, and check c2 applies it.',
    questions: ['devprod-subagent-local-recovery-v1'],
  },
  '2.2.S4': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept separates a valid empty result (search ran, nothing matched) from an access failure disguised as an empty list; example result 1 and exercise item o2 show a truthful empty result, and check c1 asks about an outage returned as an empty list.',
    questions: ['research-empty-vs-access-failure-v1', 'extraction-ocr-empty-vs-failed-v1', 'ci-mcp-transient-error-v1'],
  },

  // ---------------------------------------------------------------- 2.3
  '2.3.K1': {
    sections: ['concept', 'check'],
    how: 'Concept opens with 18 tools versus the 4–5 a role needs making selection less reliable through near-misses, unneeded options, and context cost; check c1 has a 40-tool agent whose role uses six.',
    questions: ['ci-tool-distribution-v1'],
  },
  '2.3.K2': {
    sections: ['concept', 'example'],
    how: 'Concept explains that tools outside an agent\'s specialization invite misuse, using a synthesis agent with web search that starts searching instead of synthesizing; the example gives the synthesis agent no search tools and explains why.',
    questions: ['support-subagent-tool-scope-v1', 'extraction-subagent-tool-scoping-v1', 'research-constrained-document-loader-v1'],
  },
  '2.3.K3': {
    sections: ['concept', 'example', 'compare'],
    how: 'Concept presents least-privilege tool lists per role plus a narrow cross-role tool for a high-frequency need; the example config gives each role two or three tools and the synthesis agent one verify_fact tool; compare weighs that against routing via the coordinator.',
    questions: ['research-scoped-verify-fact-v1', 'support-subagent-tool-scope-v1', 'extraction-subagent-tool-scoping-v1'],
  },
  '2.3.K4': {
    sections: ['concept', 'exercise', 'check', 'review'],
    how: 'Concept lists tool_choice auto, any, forced {"type":"tool","name":...} (and none) with when to use each; the exercise has learners pick a setting per request, check c2 tests any, and a review card recaps.',
    questions: ['support-tool-choice-forced-triage-v1', 'research-tool-choice-any-v1', 'extraction-tool-choice-any-v1', 'extraction-tool-choice-any-v2'],
  },
  '2.3.S1': {
    sections: ['concept', 'example', 'mistake'],
    how: 'The example Agent SDK config restricts each subagent (web search, doc analysis, synthesis) to its role\'s tools; the mistake section covers giving every agent the full union of tools and the fix of per-role lists.',
    questions: ['support-subagent-tool-scope-v1', 'extraction-subagent-tool-scoping-v1', 'ci-tool-distribution-v1'],
  },
  '2.3.S2': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept replaces a generic fetch_url with load_document that accepts only approved document-store URLs and rejects others with a validation error; the example config gives the doc agent load_document, and a review card recaps.',
    questions: ['research-constrained-document-loader-v1'],
  },
  '2.3.S3': {
    sections: ['concept', 'example', 'compare'],
    how: 'Concept and the compare section give the synthesis agent a narrow verify_fact tool for frequent simple checks while complex verification still goes through the coordinator to the search agent; the example walkthrough shows the same split.',
    questions: ['research-scoped-verify-fact-v1'],
  },
  '2.3.S4': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept forces extract_metadata as the first step and notes forcing applies to one request, with enrichment continued in follow-up turns; the example walkthrough describes that two-request sequence, and exercise e4 labels it.',
    questions: ['support-tool-choice-forced-triage-v1'],
  },
  '2.3.S5': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept describes any as "must call some tool but picks which"; the example walkthrough uses any for documents of unknown type; exercise e3 and check c2 test choosing any to guarantee a tool call instead of text.',
    questions: ['research-tool-choice-any-v1', 'extraction-tool-choice-any-v1', 'extraction-tool-choice-any-v2'],
  },

  // ---------------------------------------------------------------- 2.4
  '2.4.K1': {
    sections: ['concept', 'exercise', 'review'],
    how: 'Concept contrasts project-level .mcp.json (committed, shared team tooling) with user-level ~/.claude.json (personal and experimental servers), noting the local variant; the exercise labels servers by these two homes and a review card recaps.',
    questions: ['codegen-mcp-shared-scope-v1', 'codegen-mcp-personal-scope-v1', 'devprod-mcp-shared-v1', 'devprod-mcp-personal-v1', 'ci-mcp-project-config-v1'],
  },
  '2.4.K2': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'Concept explains ${GITHUB_TOKEN}-style expansion so the repo holds the shape and people hold credentials; the example .mcp.json uses ${GITHUB_TOKEN}, ${TRACKER_TOKEN}, and ${WIKI_TOKEN}; the mistake covers pasted tokens and check c1 tests the pattern.',
    questions: ['codegen-mcp-shared-scope-v1', 'devprod-mcp-shared-v1', 'ci-mcp-project-config-v1'],
  },
  '2.4.K3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept states that the client connects to every configured server at session start, discovers their tools, and makes all of them available simultaneously with no switching; the example walkthrough lists project and personal server tools side by side, and check c2 tests it.',
    questions: ['codegen-mcp-multi-server-v1'],
  },
  '2.4.K4': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept presents resources as URI-addressed content for catalogs (issue summaries, documentation hierarchies, database schemas) that spare exploratory tool calls; the example lists wiki, schema, and tracker resources, and a review card contrasts tools and resources.',
    questions: ['devprod-catalog-resource-v1'],
  },
  '2.4.S1': {
    sections: ['example', 'mistake', 'check'],
    how: 'The example shows a committed .mcp.json with three shared servers whose tokens are ${VAR} placeholders and `claude mcp add --scope project`; the mistake fix and check c1 reinforce project scope plus env expansion.',
    questions: ['codegen-mcp-shared-scope-v1', 'devprod-mcp-shared-v1', 'ci-mcp-project-config-v1'],
  },
  '2.4.S2': {
    sections: ['example', 'exercise'],
    how: 'The example adds a personal notes server with `--scope user`, which lands in ~/.claude.json and follows the engineer across projects; exercise e2 and e3 place personal and experimental servers in user-level config.',
    questions: ['codegen-mcp-personal-scope-v1', 'devprod-mcp-personal-v1'],
  },
  '2.4.S3': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept explains that thin MCP descriptions make the agent fall back to Grep or curl; the example gives a find_symbol_usages description stating cross-repo coverage, alias resolution, returned fields, and when to prefer it over Grep; exercise e5/e6 and check c3 apply it.',
    questions: ['devprod-mcp-desc-vs-grep-v1'],
  },
  '2.4.S4': {
    sections: ['concept', 'example', 'compare'],
    how: 'Concept recommends existing community servers for standard integrations such as Jira and custom servers only for team-specific workflows; the example uses a community GitHub server, and the compare section sets out when each is right.',
    questions: ['ci-community-vs-custom-mcp-v1'],
  },
  '2.4.S5': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept recommends exposing content catalogs as resources; the example lists catalog resources (wiki spaces and tree, opsdb schema, open-issue summaries) and points query_replica\'s description at the schema resource; exercise e4 turns 15 discovery searches into a resource.',
    questions: ['devprod-catalog-resource-v1'],
  },

  // ---------------------------------------------------------------- 2.5
  '2.5.K1': {
    sections: ['concept', 'exercise', 'review'],
    how: 'Concept defines Grep as searching inside files, with examples of callers of a function, an error message, and an import statement; exercise e1 and a review card contrast it with Glob.',
    questions: ['codegen-grep-content-search-v1', 'devprod-grep-trace-v1', 'devprod-migration-search-v1'],
  },
  '2.5.K2': {
    sections: ['concept', 'exercise', 'check'],
    how: 'Concept defines Glob as matching file paths (e.g. **/*.test.tsx) without reading contents; exercise e2 lists YAML files by path and check c1 finds *.spec.ts files.',
    questions: ['devprod-migration-search-v1', 'codegen-grep-content-search-v1'],
  },
  '2.5.K3': {
    sections: ['concept', 'exercise'],
    how: 'Concept presents Read and Write as the whole-file operations and Edit as a targeted change anchored on unique text; exercise items e3–e5 assign Read, Edit, and Write to matching steps.',
    questions: ['codegen-write-full-restructure-v1', 'codegen-edit-nonunique-anchor-v1', 'ci-edit-anchor-v1'],
  },
  '2.5.K4': {
    sections: ['concept', 'compare', 'review'],
    how: 'Concept states that when Edit fails on non-unique text the reliable fallback is Read the full current file and Write it back, warning against writing from memory; compare sets Read + Write against extending the anchor, and a review card recaps.',
    questions: ['codegen-edit-nonunique-anchor-v1', 'ci-edit-anchor-v1'],
  },
  '2.5.S1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'The example trace starts with Grep for issueRefund and greps onward for wrapper names and callers; exercise e1 picks Grep to find every file referencing a class.',
    questions: ['codegen-grep-content-search-v1', 'devprod-grep-trace-v1'],
  },
  '2.5.S2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept gives **/*.test.tsx as a Glob pattern; example step 6 Globs for a test file once the question becomes about paths; check c1 selects Glob for src/**/*.spec.ts.',
    questions: ['devprod-migration-search-v1'],
  },
  '2.5.S3': {
    sections: ['example', 'compare', 'check'],
    how: 'The second example artifact shows an Edit failing on two matches, then a full Read and a Write of the modified file verified with git diff; compare explains when to use this fallback, and check c2 makes Read + Write the answer.',
    questions: ['codegen-edit-nonunique-anchor-v1', 'ci-edit-anchor-v1'],
  },
  '2.5.S4': {
    sections: ['concept', 'example', 'mistake', 'review'],
    how: 'Concept "Explore incrementally" describes Grep for an entry point, then Read and follow imports one hop at a time; the example answers a question in seven targeted calls, and the mistake section covers reading every file up front.',
    questions: ['devprod-grep-trace-v1', 'codegen-large-file-navigation-v1'],
  },
  '2.5.S5': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Follow wrappers" says to first list every name a wrapper module exports, then Grep for each; example steps 2–4 Read the wrapper\'s export list, grep both aliases, and follow a second wrapper; check c3 applies it.',
    questions: ['devprod-wrapper-export-trace-v1'],
  },
};
