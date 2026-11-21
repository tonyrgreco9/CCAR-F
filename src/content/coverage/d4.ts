import type { BulletCoverage } from '../types';

// Domain 4: official guide bullet -> lesson section + assessing questions. Filled by content audit.
export const coverage: Record<string, BulletCoverage> = {
  // ---------------------------------------------------------------- 4.1
  '4.1.K1': {
    sections: ['concept', 'example'],
    how: 'Concept contrasts a disposition prompt with explicit report criteria and gives the comment case ("flag a comment only when its claimed behavior contradicts the code" vs "check comments are accurate"); the example rewrite adds that narrow comment category.',
    questions: ['support-qa-review-criteria-v1', 'codegen-review-explicit-criteria-v1', 'research-conflict-flag-criteria-v1', 'extraction-discrepancy-criteria-v1', 'devprod-risk-criteria-v1', 'ci-explicit-criteria-v1', 'support-fraud-criteria-v1'],
  },
  '4.1.K2': {
    sections: ['concept', 'compare', 'mistake', 'check'],
    how: 'Concept explains that "be conservative"/"only high-confidence" is a disposition, not a test; compare weighs tightening the disposition against categorical criteria; the mistake and check 4.1-k1 show precision barely moving while real findings drop.',
    questions: ['codegen-review-explicit-criteria-v1', 'ci-explicit-criteria-v1', 'devprod-risk-criteria-v1', 'extraction-discrepancy-criteria-v1', 'support-fraud-criteria-v1'],
  },
  '4.1.K3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept section "Trust is shared across categories" explains that a noisy category makes developers skim all comments; the example walkthrough ties the 9-of-71 performance hit rate to lost trust in accurate security comments; check 4.1-k2 applies it.',
    questions: ['ci-noisy-category-v1', 'support-qa-review-criteria-v1', 'codegen-review-explicit-criteria-v1'],
  },
  '4.1.S1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept and the "After" prompt name report categories (security, correctness, resource, comment) and a skip list including minor style and established local patterns, and explicitly avoid a confidence threshold; the exercise applies the criteria to candidate comments.',
    questions: ['ci-explicit-criteria-v1', 'codegen-review-explicit-criteria-v1', 'devprod-risk-criteria-v1', 'support-qa-review-criteria-v1'],
  },
  '4.1.S2': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'Concept says to switch a high-false-positive category off temporarily while rewriting and measuring its criteria; the example drops the performance category for that reason; the mistake fix and check 4.1-k2 repeat the decision.',
    questions: ['ci-noisy-category-v1'],
  },
  '4.1.S3': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept requires an explicit criterion plus a short code example per severity level; the "After" prompt shows a string-built SQL query as blocking and an unclosed CLI write stream as non-blocking; the exercise and check 4.1-k3 apply the rubric.',
    questions: ['codegen-severity-rubric-v1'],
  },

  // ---------------------------------------------------------------- 4.2
  '4.2.K1': {
    sections: ['concept', 'compare'],
    how: 'Concept states that when detailed instructions still give inconsistent output, examples are the most effective next step because they show answer and format at once; compare weighs more rules against 2–4 targeted examples.',
    questions: ['ci-fewshot-finding-format-v1', 'devprod-fewshot-answers-v1', 'codegen-fewshot-test-style-v1'],
  },
  '4.2.K2': {
    sections: ['concept', 'example'],
    how: 'Concept section "Ambiguous actions and review findings" covers examples for ambiguous tool selection and for deciding whether a branch-level test gap matters; the extraction example works through ambiguous quantities with reasoning.',
    questions: ['support-fewshot-downgrade-edge-v1', 'ci-few-shot-severity-v2', 'ci-few-shot-severity-v1'],
  },
  '4.2.K3': {
    sections: ['concept', 'example'],
    how: 'Concept explains that reasoning lines let the model generalize; the walkthrough shows "few metres" handled correctly although no example used "few", and the code-review pair teaches a distinction that transfers to unlisted constructs.',
    questions: ['devprod-fewshot-answers-v1', 'extraction-fewshot-date-judgment-v1'],
  },
  '4.2.K4': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept covers informal measurements (keep text, null or approximate numbers) and varied document structures; the field-notes example stops "a couple of bags" becoming 2; check 4.2-k3 applies it.',
    questions: ['extraction-fewshot-layouts-v1', 'research-fewshot-doc-structures-v1'],
  },
  '4.2.S1': {
    sections: ['concept', 'example', 'exercise', 'compare'],
    how: 'Concept recommends 2–4 targeted examples with reasoning; the example uses three, each with a reasoning line explaining the choice over the tempting alternative (e.g. not converting "a couple" to 2); the exercise selects examples for observed failures.',
    questions: ['support-fewshot-downgrade-edge-v1', 'ci-few-shot-severity-v1', 'ci-few-shot-severity-v2', 'extraction-fewshot-date-judgment-v1'],
  },
  '4.2.S2': {
    sections: ['concept', 'example'],
    how: 'Concept describes format examples for review findings (location, issue, severity, suggested fix); the example adds a code-review artifact whose finding uses exactly those four fields, and the walkthrough explains the consistency gain.',
    questions: ['ci-fewshot-finding-format-v1', 'devprod-fewshot-answers-v1'],
  },
  '4.2.S3': {
    sections: ['concept', 'example'],
    how: 'Concept describes acceptable-pattern vs genuine-issue example pairs; the code-review artifact pairs a documented best-effort empty catch in telemetry (no finding) with the same construct in billing (blocking), with reasons.',
    questions: ['ci-fewshot-finding-format-v1'],
  },
  '4.2.S4': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept section "Varied document structures" covers inline citations vs bibliographies and methods sections vs details embedded in results; the example and check 4.2-k2 vary layouts so the model learns the concept, not a position.',
    questions: ['research-fewshot-doc-structures-v1', 'extraction-fewshot-layouts-v1'],
  },
  '4.2.S5': {
    sections: ['concept', 'exercise'],
    how: 'Concept explains that single-structure examples cause empty/null required fields on other structures and that an example per structure fixes it; exercise item e1 adds a letter-style invoice example for a missed invoice number.',
    questions: ['research-fewshot-doc-structures-v1'],
  },

  // ---------------------------------------------------------------- 4.3
  '4.3.K1': {
    sections: ['concept', 'example'],
    how: 'Concept calls a tool with an input_schema the most reliable route to schema-compliant output and says JSON syntax errors stop being a problem; the example forces record_invoice and gets a parseable tool_use block.',
    questions: ['extraction-forced-tool-guarantees-v1', 'research-findings-tool-schema-v1'],
  },
  '4.3.K2': {
    sections: ['concept', 'check', 'review'],
    how: 'Concept lists auto (may reply in text instead), any (must call a tool, chooses which), and a forced named tool; check 4.3-k2 and a review card apply the distinction.',
    questions: ['extraction-tool-choice-pipeline-v1'],
  },
  '4.3.K3': {
    sections: ['concept', 'example', 'mistake'],
    how: 'Concept "What a schema cannot do" and the terminology contrast syntactic with semantic errors (wrong field, totals that do not add up); the example shows a schema-valid "N/A" PO and wrong terms; the mistake treats valid as correct.',
    questions: ['extraction-forced-tool-guarantees-v1', 'ci-schema-semantic-validation-v1'],
  },
  '4.3.K4': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept covers required-but-nullable vs optional and enum escape hatches; compare decides required non-null vs nullable; the exercise models PO acknowledgement fields as required, nullable, or enum with other + detail.',
    questions: ['extraction-enum-other-detail-v1', 'support-outcome-schema-nullable-v1', 'extraction-po-nullable-v1'],
  },
  '4.3.S1': {
    sections: ['concept', 'example'],
    how: 'Concept says the record is read from the tool_use block input; the example shows the full request with tools and input_schema and the returned tool_use block whose input is the extracted invoice.',
    questions: ['research-findings-tool-schema-v1', 'extraction-forced-tool-guarantees-v1'],
  },
  '4.3.S2': {
    sections: ['concept', 'check'],
    how: 'Concept recommends tool_choice any when several extraction schemas exist and the document type is unknown; check 4.3-k2 applies it to invoice, credit-note, and remittance tools.',
    questions: ['extraction-tool-choice-pipeline-v1'],
  },
  '4.3.S3': {
    sections: ['concept'],
    how: 'Concept explains forcing a named tool when one step must run first, with the example of forcing extract_metadata so later enrichment calls (supplier lookup, currency conversion) start from extracted metadata.',
    questions: ['extraction-tool-choice-pipeline-v1'],
  },
  '4.3.S4': {
    sections: ['concept', 'example', 'compare', 'check'],
    how: 'The invoice-without-PO case runs through concept, example (required string yields "N/A"; nullable yields null), compare, and check 4.3-k1, showing how nullable fields stop fabrication.',
    questions: ['support-outcome-schema-nullable-v1', 'extraction-po-nullable-v1', 'extraction-po-nullable-v2', 'ci-nullable-fields-v1', 'research-findings-tool-schema-v1'],
  },
  '4.3.S5': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Enums need escape hatches" adds "other" with a detail string and "unclear"; the version 2 schema implements both for payment terms; check 4.3-k3 applies them to governing law.',
    questions: ['extraction-enum-other-detail-v1', 'support-enum-unclear-v1'],
  },
  '4.3.S6': {
    sections: ['concept'],
    how: 'Concept section "Normalization rules belong in the prompt too" shows mixed date and number formats and adds explicit rules (ISO dates, period decimals, ISO currency) beside the strict schema.',
    questions: ['extraction-format-normalization-v1'],
  },

  // ---------------------------------------------------------------- 4.4
  '4.4.K1': {
    sections: ['concept', 'example', 'compare'],
    how: 'Concept "Retry with the specific error" contrasts a generic retry with appending exact validation errors; the example retry turn sends a tool_result naming the field, rule, and source convention.',
    questions: ['research-validation-retry-v1', 'extraction-retry-message-content-v1'],
  },
  '4.4.K2': {
    sections: ['concept', 'compare', 'exercise', 'check'],
    how: 'Concept "When a retry cannot help" uses the invoice with no PO; compare decides retry vs route by whether the value is in the source; the remittance exercise and check 4.4-k2 classify absent fields.',
    questions: ['extraction-retry-when-helps-v1', 'support-outcome-retry-vs-absent-v1'],
  },
  '4.4.K3': {
    sections: ['concept'],
    how: 'Concept "Feedback loops" shows a finding with a detected_pattern field and explains grouping dismissals by pattern to find systematic false positives and feed criteria fixes back.',
    questions: ['ci-detected-pattern-v1'],
  },
  '4.4.K4': {
    sections: ['concept', 'example'],
    how: 'Concept opens by noting that tool use removed syntax errors and what remains are semantic ones (non-ISO date, totals that do not sum, placeholder in a field); the validator artifact checks exactly those.',
    questions: ['research-validation-retry-v1', 'support-outcome-retry-vs-absent-v1'],
  },
  '4.4.S1': {
    sections: ['concept', 'example'],
    how: 'Concept says the follow-up must contain the original document, the failed extraction, and the specific errors; the walkthrough points out where each of the three sits in the retry conversation.',
    questions: ['extraction-retry-message-content-v1', 'research-validation-retry-v1'],
  },
  '4.4.S2': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept classifies failures (format/misread retry; absent do not) and adds the case of values that exist only in an external framework agreement not provided; the exercise labels retryable vs absent fields.',
    questions: ['extraction-retry-when-helps-v1', 'support-outcome-retry-vs-absent-v1'],
  },
  '4.4.S3': {
    sections: ['concept'],
    how: 'Concept adds a detected_pattern field to a structured review finding and shows how dismissals grouped by it reveal which pattern to tighten or temporarily remove.',
    questions: ['ci-detected-pattern-v1'],
  },
  '4.4.S4': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Self-correction fields" introduces stated_total, calculated_total, and conflict_detected; the example record and validator use them; check 4.4-k3 chooses them to surface supplier arithmetic errors.',
    questions: ['extraction-stated-vs-calculated-total-v1'],
  },

  // ---------------------------------------------------------------- 4.5
  '4.5.K1': {
    sections: ['concept', 'review'],
    how: 'Concept states 50% cost savings, processing of up to 24 hours, and no guaranteed latency SLA; a review card repeats the trade-off.',
    questions: ['ci-batch-vs-sync-v1', 'research-archive-batch-v1', 'extraction-batch-vs-sync-v1'],
  },
  '4.5.K2': {
    sections: ['concept', 'compare', 'exercise', 'check'],
    how: 'Concept lists batch-fit work (overnight reports, weekly audits, nightly test generation, backlogs) and blocking work (pre-merge checks, live chat); compare, the exercise, and check 4.5-k1 apply it.',
    questions: ['ci-batch-vs-sync-v1', 'research-archive-batch-v1', 'devprod-class-batch-v1', 'extraction-batch-vs-sync-v1'],
  },
  '4.5.K3': {
    sections: ['concept', 'example', 'exercise', 'review'],
    how: 'Concept "Each request stands alone" explains that a batch request cannot execute a tool and continue; the walkthrough contrasts single-call forced tool use with a lookup loop; exercise item w3 routes a tool-loop agent to synchronous calls.',
    questions: ['devprod-class-batch-v1', 'ci-batch-vs-sync-v1'],
  },
  '4.5.K4': {
    sections: ['concept', 'example'],
    how: 'Concept and example show custom_id on each request and results returned out of order, so the pipeline joins on custom_id rather than position.',
    questions: ['ci-batch-failed-items-v1', 'extraction-batch-failed-recovery-v1', 'devprod-class-batch-v1'],
  },
  '4.5.S1': {
    sections: ['compare', 'exercise', 'check'],
    how: 'Compare decides batch vs synchronous by whether anything is blocked; the exercise assigns Ledgerline workloads to each API; check 4.5-k1 rejects batch for a blocking pre-merge check.',
    questions: ['ci-batch-vs-sync-v1', 'extraction-batch-vs-sync-v1', 'devprod-class-batch-v1'],
  },
  '4.5.S2': {
    sections: ['concept', 'review'],
    how: 'Concept "Sizing submission frequency to an SLA" works through a 30-hour SLA with worst-case 24-hour processing, concluding that 4-hour submissions guarantee it and daily ones do not; a review card repeats the calculation.',
    questions: ['support-batch-sla-cadence-v1', 'extraction-batch-vs-sync-v1'],
  },
  '4.5.S3': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'Concept gives the recovery steps; the example code chunks oversized documents with derived custom_ids and resubmits only failures; the mistake and check 4.5-k2 reject full or unchanged resubmission.',
    questions: ['ci-batch-failed-items-v1', 'extraction-batch-failed-recovery-v1', 'devprod-class-batch-v1', 'research-archive-batch-v1'],
  },
  '4.5.S4': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Refine before bulk" runs the prompt on a varied sample before the full volume; the walkthrough notes a 200-invoice trial that fixed two field descriptions; check 4.5-k3 applies it.',
    questions: ['devprod-batch-sample-refine-v1'],
  },

  // ---------------------------------------------------------------- 4.6
  '4.6.K1': {
    sections: ['concept', 'mistake', 'check'],
    how: 'Concept explains that a same-session reviewer still holds its earlier reasoning and tends to agree with it; the mistake shows a "review your work" step approving its own choices; check 4.6-k1 applies it.',
    questions: ['codegen-independent-reviewer-v1', 'extraction-independent-review-v1', 'devprod-review-extended-thinking-v1'],
  },
  '4.6.K2': {
    sections: ['concept'],
    how: 'Concept "Independent instances" states that an instance without the generator\'s context catches subtle issues more effectively than self-review instructions or extended thinking, and explains why each substitute falls short.',
    questions: ['devprod-review-extended-thinking-v1', 'codegen-independent-reviewer-v1', 'extraction-independent-review-v1', 'research-independent-citation-review-v1'],
  },
  '4.6.K3': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept explains attention dilution (missed issues, shallow and contradictory findings) and splits work into per-file and integration passes; compare and the exercise decide which pass catches each issue.',
    questions: ['ci-multipass-large-pr-v1', 'codegen-multipass-review-v1', 'devprod-rpc-review-v1'],
  },
  '4.6.S1': {
    sections: ['concept', 'example'],
    how: 'Concept and the pipeline config use a fresh reviewer session given only the diff, requirements, criteria, and prior findings, never the generating session; the walkthrough explains why it has no stake in the original choices.',
    questions: ['codegen-independent-reviewer-v1', 'devprod-rpc-review-v1', 'extraction-independent-review-v1', 'ci-verify-blockers-v1'],
  },
  '4.6.S2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'The example runs per-file local passes and an integration pass over per-file interface summaries, catching a cross-file renamed field; the exercise sorts five issues between the two pass types.',
    questions: ['ci-multipass-large-pr-v1', 'codegen-multipass-review-v1', 'devprod-rpc-review-v1', 'research-independent-citation-review-v1'],
  },
  '4.6.S3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Verification and routing" has the verifier self-report a verdict and confidence per finding and routes by thresholds set from labeled outcomes; the example config and output route three findings; check 4.6-k3 requires calibration first.',
    questions: ['research-verify-confidence-routing-v1', 'ci-verify-blockers-v1'],
  },
};
