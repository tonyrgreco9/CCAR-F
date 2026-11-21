import type { BulletCoverage } from '../types';

// Domain 5: official guide bullet -> lesson section + assessing questions. Filled by content audit.
export const coverage: Record<string, BulletCoverage> = {
  // ---------------------------------------------------------------- 5.1
  '5.1.K1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept explains how summaries round numbers and percentages, blur dates, and soften customer-stated expectations ("before my 12 May bill" becomes "soon"); the example contrasts a lossy summary with the facts block, and exercise item i7 pins a stated expectation.',
    questions: ['support-case-facts-block-v1', 'research-brief-facts-block-v1', 'codegen-progress-notes-file-v1'],
  },
  '5.1.K2': {
    sections: ['concept', 'check', 'review'],
    how: 'Concept defines lost in the middle (beginning and end used reliably, middle findings may be skipped); check 5.1-c2 and a review card apply placement and headers as the fix.',
    questions: ['support-policy-prompt-placement-v1', 'research-findings-first-aggregation-v1'],
  },
  '5.1.K3': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept explains that each tool result stays in history and is re-sent every turn, using an order lookup with 40+ fields where 5 matter; the example trims a 58-field transaction record to 7 fields and the exercise trims a 41-field profile.',
    questions: ['support-trim-customer-profile-v1'],
  },
  '5.1.K4': {
    sections: ['concept', 'example'],
    how: 'Concept section "Every request carries the whole conversation" explains the stateless Messages API, that each request must include all user/assistant turns and tool_use/tool_result pairs, and what breaks when only the newest message is sent; the walkthrough notes the facts block sits on top of the full history.',
    questions: ['support-full-history-resend-v1'],
  },
  '5.1.S1': {
    sections: ['concept', 'example', 'compare', 'mistake', 'exercise', 'check'],
    how: 'Concept and example build a case-facts block (order/invoice IDs, amounts, dates, statuses, commitments) kept outside summarized history and included in every prompt; compare, mistake, exercise, and check 5.1-c1 contrast it with summarizer instructions.',
    questions: ['support-case-facts-block-v1', 'research-brief-facts-block-v1'],
  },
  '5.1.S2': {
    sections: ['concept', 'example'],
    how: 'Concept bullet "Give each issue its own layer" and the example\'s `issues` object keep a separate structured record (invoice, amount, date, status, commitment) per issue; the walkthrough explains how this prevents cross-issue mix-ups.',
    questions: ['support-multi-issue-context-layer-v1'],
  },
  '5.1.S3': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept recommends trimming in a post-tool hook or wrapper (keeping only return-relevant order fields); the example shows a trimmed lookup_transaction result and exercise items i2 and i5 are trimming decisions.',
    questions: ['support-trim-customer-profile-v1'],
  },
  '5.1.S4': {
    sections: ['concept', 'check', 'review'],
    how: 'Concept bullet "Position and structure aggregated inputs" opens combined inputs with a key-findings summary and puts details under explicit per-source headers; check 5.1-c2 applies it.',
    questions: ['research-findings-first-aggregation-v1', 'support-policy-prompt-placement-v1'],
  },
  '5.1.S5': {
    sections: ['concept', 'check'],
    how: 'Concept requires subagent returns to carry dates, source locations, and methodological context (survey, filing, model estimate); check 5.1-c3 asks for claim, source, page, date, and quote fields instead of a prose paragraph.',
    questions: ['research-upstream-structured-returns-v1'],
  },
  '5.1.S6': {
    sections: ['concept', 'mistake'],
    how: 'Concept says that when the downstream agent has a limited context budget, the upstream agent should return key facts, citations, and relevance scores instead of verbose content and reasoning chains; the mistake fix repeats structured returns over prose.',
    questions: ['research-upstream-structured-returns-v1'],
  },

  // ---------------------------------------------------------------- 5.2
  '5.2.K1': {
    sections: ['concept', 'compare', 'exercise', 'review'],
    how: 'Concept lists the three triggers (explicit human request, policy exception/gap, no meaningful progress) and notes that "complex" alone is not a trigger; compare, exercise, and a review card apply them.',
    questions: ['support-escalation-triggers-v1'],
  },
  '5.2.K2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept contrasts a customer who asks for a person up front (escalate at once, no investigation) with a frustrated customer whose issue is straightforward (offer the fix); example conversations 1 and 2 and exercise items i1/i2 show both.',
    questions: ['support-escalate-explicit-request-v1', 'support-angry-but-resolvable-v1'],
  },
  '5.2.K3': {
    sections: ['concept', 'compare', 'mistake'],
    how: 'Concept explains that sentiment does not track complexity and that self-reported confidence is uncalibrated (agents are often confidently wrong on hard cases); compare and mistake show the resulting mis-routing.',
    questions: ['support-escalation-triggers-v1'],
  },
  '5.2.K4': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept "Ambiguity is not escalation" explains asking for a distinguishing identifier when several records match; example conversation 3, exercise item i4, and check 5.2-c2 apply it.',
    questions: ['support-multiple-records-ask-id-v1', 'support-multiple-records-ask-id-v2', 'devprod-ambiguous-bug-v1', 'devprod-ambiguous-bug-v2'],
  },
  '5.2.S1': {
    sections: ['concept', 'example', 'mistake'],
    how: 'Concept section "Write the criteria down, with examples" explains why "escalate complex cases" miscalibrates; the example artifact is a system-prompt excerpt with explicit criteria and three few-shot cases with reasons, and the mistake fix starts there.',
    questions: ['support-escalation-criteria-fewshot-v1'],
  },
  '5.2.S2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept says to honor a request for a human immediately without first investigating; example conversation 2 and check 5.2-c1 escalate before any account work.',
    questions: ['support-escalate-explicit-request-v1'],
  },
  '5.2.S3': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept "Frustrated customer, simple issue" says acknowledge, offer the in-capability fix, and escalate if the customer reiterates; example conversation 1 and exercise items i1 and i6 walk through both steps.',
    questions: ['support-angry-but-resolvable-v1'],
  },
  '5.2.S4': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept gives the competitor price-match case (policy covers only own-site price drops) as policy silence that must be escalated; the system-prompt example includes it as a few-shot case and exercise item i7 applies it.',
    questions: ['support-policy-silent-competitor-match-v1', 'support-escalation-triggers-v1'],
  },
  '5.2.S5': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept and example conversation 3 (two same-name accounts) show asking for an email or phone digits instead of a heuristic pick; exercise i4 and check 5.2-c2 apply it.',
    questions: ['support-multiple-records-ask-id-v1', 'support-multiple-records-ask-id-v2', 'devprod-ambiguous-bug-v1', 'devprod-ambiguous-bug-v2'],
  },

  // ---------------------------------------------------------------- 5.3
  '5.3.K1': {
    sections: ['concept', 'example', 'check', 'review'],
    how: 'Concept lists structured error fields (failure type, what was attempted, partial results, retryability, alternatives); the example contrasts a suppressing return with a structured one and shows the coordinator using it; check 5.3-c1 applies it.',
    questions: ['research-timeout-partial-results-v1', 'research-timeout-partial-results-v2', 'devprod-replica-failover-v1', 'research-coordinator-nonretryable-failure-v1'],
  },
  '5.3.K2': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept "Access failure is not no results" separates failures needing a retry decision from successful empty queries; the example coverage note states a valid empty web search, exercise item i2 and check 5.3-c2 apply it.',
    questions: ['research-silent-empty-false-negative-v1', 'ci-subagent-partial-results-v1', 'devprod-replica-failover-v1'],
  },
  '5.3.K3': {
    sections: ['concept', 'exercise'],
    how: 'Concept explains that a generic "search unavailable" status hides failure type, query, partial results, and alternatives from the coordinator; exercise item i6 replaces such a draft with structured context.',
    questions: ['research-timeout-partial-results-v1', 'research-timeout-partial-results-v2', 'devprod-replica-failover-v1'],
  },
  '5.3.K4': {
    sections: ['concept', 'compare', 'mistake', 'review'],
    how: 'Concept "Two failure modes to avoid" covers silent suppression and whole-workflow abort; the mistake section dissects try/except-returns-empty, compare shows when stopping is justified, and a review card names both anti-patterns.',
    questions: ['research-silent-empty-false-negative-v1', 'extraction-ocr-partial-failure-v1', 'ci-subagent-partial-results-v1'],
  },
  '5.3.S1': {
    sections: ['example', 'exercise', 'check'],
    how: 'The example JSON returns partial findings plus an errors array (failure_type, attempted query, retries, retryable, alternatives); exercise items i4-i6 and check 5.3-c1 require this structure.',
    questions: ['research-timeout-partial-results-v1', 'research-timeout-partial-results-v2', 'extraction-ocr-partial-failure-v1', 'ci-subagent-partial-results-v1'],
  },
  '5.3.S2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept says tools and subagents should signal failures (e.g. MCP isError) differently from successful empty lists; the example coverage section reports the two differently and exercise items i2/i3 label them.',
    questions: ['research-silent-empty-false-negative-v1', 'ci-subagent-partial-results-v1', 'devprod-replica-failover-v1'],
  },
  '5.3.S3': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept "Recover locally first, then propagate" covers bounded retries for transient errors and propagating only unresolved errors with attempts and partial results; the example agent retried twice before reporting, and exercise item i1 retries locally.',
    questions: ['extraction-subagent-local-retry-v1', 'research-timeout-partial-results-v1'],
  },
  '5.3.S4': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Coverage annotations" and the example coverage section mark well-supported findings separately from gaps caused by unavailable sources; check 5.3-c3 requires annotating a gap.',
    questions: ['research-coordinator-nonretryable-failure-v1', 'research-silent-empty-false-negative-v1', 'ci-subagent-partial-results-v1'],
  },

  // ---------------------------------------------------------------- 5.4
  '5.4.K1': {
    sections: ['concept', 'mistake'],
    how: 'Concept "Context degradation" lists symptoms, including contradicting earlier findings and referring to "typical" patterns instead of specific classes; the mistake section shows how to recognize it.',
    questions: ['codegen-context-degradation-v1', 'ci-diff-scoped-context-v1'],
  },
  '5.4.K2': {
    sections: ['concept', 'example', 'check', 'review'],
    how: 'Concept explains scratchpad/notes files that survive /compact and new sessions and are consulted for later questions; the example NOTES.md artifact and check 5.4-c1 reinforce it.',
    questions: ['codegen-context-degradation-v1', 'devprod-trace-notes-v1', 'codegen-targeted-exploration-v1'],
  },
  '5.4.K3': {
    sections: ['concept', 'example', 'compare', 'review'],
    how: 'Concept and the phase 1 example delegate verbose searching to an Explore subagent that returns only distilled findings while the main agent coordinates; compare names when inline exploration is enough.',
    questions: ['codegen-explore-subagent-v1', 'devprod-explore-isolate-v1'],
  },
  '5.4.K4': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept "Recovery manifests" has each agent export state to a known location and the coordinator load a manifest on resume; the phase 3 example shows state/manifest.json plus a per-agent state file and a review card summarizes it.',
    questions: ['devprod-crash-manifest-resume-v1'],
  },
  '5.4.S1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept gives specific subagent questions ("find all test files", "trace the dependencies of the refund flow"); the example\'s phase 1 prompt and exercise item i1 delegate a focused search.',
    questions: ['codegen-parallel-explore-v1', 'codegen-explore-subagent-v1', 'devprod-explore-isolate-v1'],
  },
  '5.4.S2': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept and the NOTES.md example record exact paths, findings, and open questions and refer back to them; exercise item i2 and check 5.4-c1 apply it.',
    questions: ['devprod-trace-notes-v1', 'codegen-context-degradation-v1', 'codegen-targeted-exploration-v1'],
  },
  '5.4.S3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Summarize between phases" puts a phase summary into next-phase subagent prompts; the walkthrough injects the phase 1 summary into implementation subagents and check 5.4-c2 diagnoses its absence.',
    questions: ['codegen-phase-summary-handoff-v1'],
  },
  '5.4.S4': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'The phase 3 example walks through resuming: the coordinator loads the manifest, skips the finished agent, and injects saved state ("Continue from InvoiceEvents.java:203") into the billing agent\'s prompt; exercise items i4/i5 and check 5.4-c3 apply it.',
    questions: ['devprod-crash-manifest-resume-v1'],
  },
  '5.4.S5': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept "Compact deliberately" uses /compact when context fills with verbose discovery output, at phase boundaries with guidance on what to keep; the walkthrough and exercise item i3 apply it.',
    questions: ['devprod-trace-notes-v1'],
  },

  // ---------------------------------------------------------------- 5.5
  '5.5.K1': {
    sections: ['concept', 'example', 'compare', 'check'],
    how: 'Concept shows a 97% aggregate hiding weak segments; the example table has handwritten notes at 71% inside a ~97% overall figure, and compare/check 5.5-c1 reject aggregate-only decisions.',
    questions: ['extraction-stratified-review-reduction-v1', 'ci-auto-merge-calibration-v1', 'support-refund-review-stratified-v1'],
  },
  '5.5.K2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Keep measuring what you no longer review" uses a stratified random sample of high-confidence, auto-accepted extractions for ongoing error rates and novel error patterns; the example audit policy stratifies by type, template, and field, and check 5.5-c3 explains stratification.',
    questions: ['extraction-segment-drift-monitoring-v1', 'extraction-stratified-review-reduction-v1'],
  },
  '5.5.K3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Confidence is useful only once calibrated" explains field-level scores calibrated on a labeled validation set; the example calibration table and check 5.5-c2 show score-to-accuracy mapping.',
    questions: ['extraction-confidence-calibration-v1'],
  },
  '5.5.K4': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept "Reduce review only with evidence" validates each document type and key field before automating; compare decides by population heterogeneity and exercise item i4 rejects an aggregate-based proposal.',
    questions: ['extraction-stratified-review-reduction-v1', 'ci-auto-merge-calibration-v1', 'support-refund-review-stratified-v1'],
  },
  '5.5.S1': {
    sections: ['concept', 'example'],
    how: 'The example routing policy keeps a 2% stratified random sample of auto-accepted output (always including new templates), and the walkthrough explains how that surfaces novel error patterns hidden in the segment average.',
    questions: ['extraction-segment-drift-monitoring-v1'],
  },
  '5.5.S2': {
    sections: ['example', 'compare', 'mistake', 'exercise'],
    how: 'The example stratified validation table breaks accuracy down by document type, and the routing policy reduces review only for validated segments; compare, mistake, and exercise item i4 apply per-segment analysis.',
    questions: ['extraction-stratified-review-reduction-v1', 'ci-auto-merge-calibration-v1', 'support-refund-review-stratified-v1'],
  },
  '5.5.S3': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept and the example derive per-segment thresholds from the calibration table (0.95 for typed EN invoices, provisional 0.97 for DE/FR); exercise items i1/i2 apply the calibrated threshold.',
    questions: ['extraction-confidence-calibration-v1'],
  },
  '5.5.S4': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept routing rules send low-confidence and ambiguous/contradictory-source items to humans and spend scarce reviewer time where errors are likely and costly; exercise items i2, i3, i5 route them.',
    questions: ['extraction-reviewer-capacity-routing-v1'],
  },

  // ---------------------------------------------------------------- 5.6
  '5.6.K1': {
    sections: ['concept', 'mistake', 'check'],
    how: 'Concept explains citations detaching from claims across summarization steps; the mistake section (bibliography instead of claim-level mappings) and check 5.6-c2 show the failure.',
    questions: ['research-claim-source-mapping-v1'],
  },
  '5.6.K2': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept has the synthesis agent preserve and merge claim-source mappings when combining findings (merged claims keep both sources); the example\'s F1-F6 records are cited by ID in the report.',
    questions: ['research-claim-source-mapping-v1', 'research-synthesis-provenance-record-v1'],
  },
  '5.6.K3': {
    sections: ['concept', 'example', 'compare', 'exercise'],
    how: 'Concept "Don\'t resolve conflicts arbitrarily" annotates conflicts with attribution; the example presents both 2025 market sizes as contested, compare covers resolving only with a stated principled reason, and exercise P3 applies it.',
    questions: ['research-conflicting-statistics-v1', 'extraction-provenance-conflicting-terms-v1', 'research-coordinator-reconciles-conflicts-v1'],
  },
  '5.6.K4': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept "Dates separate change from contradiction" uses publication and reference/collection dates; the example contrasts F3 vs F1 (change) with F1 vs F2 (conflict), and exercise P1 and check 5.6-c1 apply it.',
    questions: ['research-temporal-change-vs-conflict-v1', 'extraction-provenance-conflicting-terms-v1'],
  },
  '5.6.S1': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'Concept requires subagents to output claim-source mappings (URL or document name, location, date, relevant excerpt); the example findings array is that output and check 5.6-c2 applies it.',
    questions: ['research-claim-source-mapping-v1', 'research-synthesis-provenance-record-v1'],
  },
  '5.6.S2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept "Separate established from contested" uses explicit report sections and keeps sources\' own characterizations and methods; the example report has an established-vs-contested section and keeps "self-reported survey"; exercise P4/P5 grade strength.',
    questions: ['research-established-contested-sections-v1', 'research-synthesis-provenance-record-v1'],
  },
  '5.6.S3': {
    sections: ['concept', 'example'],
    how: 'Concept says document analysis should finish with conflicting values included and annotated so the coordinator reconciles before synthesis; the walkthrough shows the subagent returning F1 and F2 and the coordinator deciding to mark them contested.',
    questions: ['research-coordinator-reconciles-conflicts-v1', 'research-conflicting-statistics-v1'],
  },
  '5.6.S4': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept requires publication and collection/reference dates in findings; the example records carry published and reference_period fields, and exercise P1 depends on them.',
    questions: ['research-temporal-change-vs-conflict-v1'],
  },
  '5.6.S5': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Render content appropriately" maps financial data to tables, news to prose, technical findings to structured lists; the example report does all three and check 5.6-c3 applies the table case.',
    questions: ['research-render-content-types-v1'],
  },
};
