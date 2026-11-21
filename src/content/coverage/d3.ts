import type { BulletCoverage } from '../types';

// Domain 3: official guide bullet -> lesson section + assessing questions. Filled by content audit.
export const coverage: Record<string, BulletCoverage> = {
  // ---------------------------------------------------------------- 3.1
  '3.1.K1': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept "The levels" lists ~/.claude/CLAUDE.md, ./CLAUDE.md or ./.claude/CLAUDE.md, and subdirectory CLAUDE.md files with who gets each and when it loads; the example shows root and infra/ files; the exercise sorts six instructions into user, project, and subdirectory memory.',
    questions: ['devprod-memory-placement-v1', 'codegen-claudemd-personal-prefs-v1', 'codegen-claudemd-modular-v1', 'ci-claudemd-job-scope-v1'],
  },
  '3.1.K2': {
    sections: ['concept', 'mistake', 'check'],
    how: 'Concept "What is shared" says user memory and home-directory imports exist on one machine only; the mistake section is a team convention kept in ~/.claude/CLAUDE.md; check 3.1-c1 has the fix of moving it to committed project memory.',
    questions: ['support-claudemd-team-conventions-v1', 'devprod-team-memory-v1', 'codegen-claudemd-personal-prefs-v2'],
  },
  '3.1.K3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Imports" explains @path lines, relative resolution, and @~/ personal imports; the root CLAUDE.md example imports docs/architecture.md and services/billing/CLAUDE.md imports two standards files; check 3.1-c3 asks what an @docs line does.',
    questions: ['codegen-claudemd-modular-v1', 'devprod-memory-imports-v1', 'devprod-package-imports-v1'],
  },
  '3.1.K4': {
    sections: ['concept', 'example', 'compare'],
    how: 'Concept section "Splitting into .claude/rules/" presents one topic file per subject as the alternative to a monolithic CLAUDE.md, loaded automatically; the example includes an unconditional rules/security.md; the compare contrasts one root file with root + rules + directory files.',
    questions: ['research-claudemd-rules-split-v1'],
  },
  '3.1.S1': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'Concept "Diagnosing a missing instruction" lists causes (instruction in someone\'s user memory, uncommitted file, home-only import); the example walkthrough diagnoses new engineer Sam; the mistake and check 3.1-c1 cover a teammate missing a rule kept in user-level memory.',
    questions: ['devprod-team-memory-v1', 'support-claudemd-team-conventions-v1', 'devprod-memory-diagnose-v1'],
  },
  '3.1.S2': {
    sections: ['concept', 'example'],
    how: 'Concept "Imports" has a paragraph on maintainers choosing which shared standards their package CLAUDE.md imports (billing imports security.md and money.md, design system only react.md); the example artifact services/billing/CLAUDE.md and walkthrough step 4 show this.',
    questions: ['devprod-package-imports-v1'],
  },
  '3.1.S3': {
    sections: ['concept', 'compare', 'check'],
    how: 'Concept "Splitting into .claude/rules/" names testing.md, api-conventions.md, and deployment.md as topic files with their own owners; the compare and check 3.1-c2 have the 800-line root file split into rules and directory files.',
    questions: ['research-claudemd-rules-split-v1'],
  },
  '3.1.S4': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept says /memory shows exactly which memory files a session loaded and is the first check when behavior differs between people or days; the example walkthrough compares two engineers\' /memory output; a review card repeats the step.',
    questions: ['devprod-memory-diagnose-v1'],
  },

  // ---------------------------------------------------------------- 3.2
  '3.2.K1': {
    sections: ['concept', 'example', 'exercise', 'review'],
    how: 'Concept explains project commands in .claude/commands/ (committed, shared) and personal ones in ~/.claude/commands/; the example\'s /fix-issue is a project command; exercise item i1 and a review card contrast the two locations.',
    questions: ['codegen-project-command-v1', 'devprod-personal-command-v1'],
  },
  '3.2.K2': {
    sections: ['concept', 'example'],
    how: 'Concept lists SKILL.md frontmatter (description, allowed-tools, argument-hint, context: fork) for .claude/skills/<name>/; the example shows db-migration and dep-audit SKILL.md files that use these keys.',
    questions: ['codegen-skill-fork-tools-v1', 'support-replay-skill-fork-v1', 'support-skill-argument-hint-v1'],
  },
  '3.2.K3': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept defines context: fork as running the skill in an isolated sub-agent so its output does not pollute the main conversation; the dep-audit example returns only a ten-line summary; a review card restates it.',
    questions: ['devprod-skill-fork-v1', 'research-citation-audit-skill-v1', 'support-replay-skill-fork-v1'],
  },
  '3.2.K4': {
    sections: ['concept', 'example', 'exercise', 'check'],
    how: 'Concept "Personal variants" says to copy a team skill to ~/.claude/skills/ under a different name so teammates are unaffected and there is no ambiguity; the example has ~/.claude/skills/my-pr-summary; exercise i2 and check 3.2-c3 test it.',
    questions: ['research-personal-skill-variant-v1'],
  },
  '3.2.S1': {
    sections: ['concept', 'example'],
    how: 'Concept says committed .claude/commands/ gives the whole team the same /review or /fix-issue; the example walkthrough notes every engineer has /fix-issue after pulling.',
    questions: ['codegen-project-command-v1'],
  },
  '3.2.S2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept names verbose work (codebase analysis, audits) and exploratory work (brainstorming alternatives) as reasons to use context: fork; the dep-audit example and exercise item i4 (license scan) apply it.',
    questions: ['codegen-skill-fork-tools-v1', 'devprod-skill-fork-v1', 'research-citation-audit-skill-v1'],
  },
  '3.2.S3': {
    sections: ['concept', 'example'],
    how: 'Concept describes allowed-tools as restricting tool access during execution, e.g. a scaffolding skill limited to Read/Write/Edit cannot run destructive shell commands; the dep-audit walkthrough notes its list has no Edit, Write, or general Bash.',
    questions: ['codegen-skill-fork-tools-v1'],
  },
  '3.2.S4': {
    sections: ['concept', 'example'],
    how: 'Concept says argument-hint names the required parameter and prompts developers who invoke the skill without arguments; the example walkthrough shows /db-migration prompting for the schema change instead of guessing.',
    questions: ['support-skill-argument-hint-v1'],
  },
  '3.2.S5': {
    sections: ['concept', 'compare', 'mistake'],
    how: 'Concept "Skills versus CLAUDE.md" contrasts always-loaded CLAUDE.md with on-demand skills; the compare decides a 70-line migration procedure; the mistake is putting every workflow into root CLAUDE.md.',
    questions: ['devprod-migration-skill-v1', 'ci-skill-on-demand-v1', 'research-citation-audit-skill-v1'],
  },

  // ---------------------------------------------------------------- 3.3
  '3.3.K1': {
    sections: ['concept', 'example', 'review'],
    how: 'Concept "How it works" shows a .claude/rules/ file with YAML paths: globs and notes that files without paths: are unconditional; the example has testing.md and migrations.md with paths:; a review card names the frontmatter.',
    questions: ['devprod-rule-frontmatter-v1', 'codegen-rules-test-globs-v1'],
  },
  '3.3.K2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept states the rule loads only when Claude is editing matching files and costs no tokens otherwise ("Why it matters"); the example table shows which rules load for three tasks; check 3.3-c3 asks for the token benefit.',
    questions: ['devprod-rule-frontmatter-v1', 'codegen-rules-test-globs-v1', 'ci-path-rule-migrations-v1'],
  },
  '3.3.K3': {
    sections: ['concept', 'compare'],
    how: 'Concept "Choosing between rules and directory files" explains that a directory CLAUDE.md is bound to one subtree, so test files beside source in forty folders would need forty copies; the compare contrasts one glob rule with per-package CLAUDE.md files.',
    questions: ['codegen-rules-test-globs-v1', 'devprod-lang-rules-v1'],
  },
  '3.3.S1': {
    sections: ['concept', 'example'],
    how: 'Concept gives paths: ["terraform/**/*"] as a one-directory scope and a **/*.test.ts example; the example writes migrations.md scoped to services/*/migrations/** and explains why the narrower glob was chosen.',
    questions: ['ci-path-rule-migrations-v1', 'devprod-rule-frontmatter-v1'],
  },
  '3.3.S2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept shows **/*.test.ts and **/*.test.tsx matching test files in any directory; example walkthrough step 1 notes new packages are covered automatically; check 3.3-c1 asks for **/*.test.tsx across two trees.',
    questions: ['devprod-lang-rules-v1', 'codegen-rules-test-globs-v1', 'codegen-rules-fit-v1'],
  },
  '3.3.S3': {
    sections: ['compare', 'mistake', 'exercise'],
    how: 'The compare\'s deciding detail is file pattern versus place; the mistake is copying file-type conventions into several directory CLAUDE.md files; the exercise sorts instructions between path rules and subdirectory CLAUDE.md.',
    questions: ['codegen-rules-test-globs-v1', 'devprod-lang-rules-v1', 'ci-path-rule-migrations-v1'],
  },

  // ---------------------------------------------------------------- 3.4
  '3.4.K1': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept "When to plan" lists large-scale multi-file changes, architectural changes, multiple valid approaches, and ambiguous requests; the compare and exercise items i1 and i4 apply it.',
    questions: ['devprod-plan-tasks-v1', 'research-plan-mode-schema-migration-v1'],
  },
  '3.4.K2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept "When to execute directly" gives adding a single validation check to one function and a single-file bug with a clear stack trace; example request 2 (formatPhone) is executed directly; exercise items i2 and i5.',
    questions: ['codegen-direct-small-fix-v1', 'devprod-plan-tasks-v1'],
  },
  '3.4.K3': {
    sections: ['concept', 'mistake'],
    how: 'Concept says plan mode lets Claude explore safely and design before committing, so a cheap plan fix replaces costly rework of a half-finished 30-file edit; the mistake shows the rework when a wide change starts in normal mode.',
    questions: ['codegen-plan-multifile-migration-v1', 'research-plan-mode-schema-migration-v1'],
  },
  '3.4.K4': {
    sections: ['concept', 'example', 'check', 'review'],
    how: 'Concept defines the Explore subagent as a read-only helper with its own context returning a summary, with a subsection on multi-phase work; example request 1 uses its summary; check 3.4-c3 and a review card test it.',
    questions: ['extraction-explore-subagent-v1'],
  },
  '3.4.S1': {
    sections: ['concept', 'exercise', 'check'],
    how: 'Concept "When to plan" names microservice restructuring, a library migration affecting 45+ files, and choosing between integration designs with different infrastructure needs; exercise i1 and check 3.4-c1 (message queue) apply it.',
    questions: ['codegen-plan-multifile-migration-v1', 'codegen-plan-open-design-v1'],
  },
  '3.4.S2': {
    sections: ['concept', 'example', 'exercise'],
    how: 'Concept lists a single-file fix with a clear stack trace and a date validation check as direct-execution tasks; example request 2 and exercise item i5 (null check at a known line) apply it.',
    questions: ['codegen-direct-small-fix-v1'],
  },
  '3.4.S3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept subsection "Why the Explore subagent matters in multi-phase work" explains how discovery output would exhaust context needed for later phases; example request 1 delegates 26 search hits; check 3.4-c3 covers hundreds of grep matches.',
    questions: ['extraction-explore-subagent-v1'],
  },
  '3.4.S4': {
    sections: ['concept', 'example', 'mistake'],
    how: 'Concept "Combining them" explains explore, plan, then execute the planned approach directly, using a library migration as the example; example request 1 corrects the plan and then leaves plan mode to execute; the mistake\'s fix repeats the sequence.',
    questions: ['codegen-plan-open-design-v1'],
  },

  // ---------------------------------------------------------------- 3.5
  '3.5.K1': {
    sections: ['concept', 'exercise', 'check'],
    how: 'Concept "Show, do not describe" calls concrete input/output examples the most effective fix when prose is interpreted inconsistently and gives three duration pairs; exercise item i1 and check 3.5-c1 (CSV quoting) apply it.',
    questions: ['codegen-iterate-io-examples-v1', 'ci-concrete-feedback-v1', 'devprod-date-feedback-v1'],
  },
  '3.5.K2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Make tests the specification" says to write the suite before the implementation and then share actual failure output each round; the formatSlot example has the tests first and real failure output; check 3.5-c3 tests it.',
    questions: ['support-refine-with-test-cases-v1', 'extraction-concrete-test-feedback-v1', 'codegen-iterate-specific-failure-v1'],
  },
  '3.5.K3': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Interview before building" has Claude question the developer to surface considerations not yet anticipated; the example includes a waitlist interview prompt; check 3.5-c2 covers refund rules not yet worked out.',
    questions: ['support-interview-pattern-v1'],
  },
  '3.5.K4': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept "Batch or sequence?" says to batch interacting issues and sequence independent ones; the compare decides on whether fixes interact; exercise items i4 and i5 apply both cases.',
    questions: ['research-batch-interacting-fixes-v1'],
  },
  '3.5.S1': {
    sections: ['concept', 'exercise'],
    how: 'Concept says two or three well-chosen input/output pairs usually settle an inconsistently interpreted transformation and shows three duration pairs; exercise item i1 gives sample numbers with expected output.',
    questions: ['codegen-iterate-io-examples-v1', 'devprod-date-feedback-v1'],
  },
  '3.5.S2': {
    sections: ['concept', 'example'],
    how: 'Concept says the suite written first should cover expected behavior, edge cases, and performance requirements (e.g. dedupe 100,000 rows in under 2 s), then iterate on failures; the formatSlot example writes tests first and sends real failure output.',
    questions: ['support-refine-with-test-cases-v1', 'extraction-concrete-test-feedback-v1'],
    gap: 'No bank item specifically tests including performance requirements in a tests-first suite; the items cover behavior and edge cases.',
  },
  '3.5.S3': {
    sections: ['concept', 'example'],
    how: 'Concept applies the interview to adding a cache in an unfamiliar system, surfacing invalidation strategy, behavior when the cache is down, and staleness; the example shows an interview prompt that asks about offer expiry and conflicts.',
    questions: ['support-interview-pattern-v1'],
  },
  '3.5.S4': {
    sections: ['concept', 'example'],
    how: 'Concept gives a null-value migration case ({"phone": null} -> {"phone_e164": null}) as a specific input with expected output, ideally as a test; the example\'s DST and time-zone tests are specific edge-case tests.',
    questions: ['ci-concrete-feedback-v1', 'extraction-concrete-test-feedback-v1', 'devprod-date-feedback-v1'],
  },
  '3.5.S5': {
    sections: ['compare', 'example'],
    how: 'The compare contrasts one detailed message for interacting issues with sequential fixes for independent ones; example walkthrough steps 3 and 5 batch three interacting formatSlot failures and send independent issues one at a time.',
    questions: ['research-batch-interacting-fixes-v1'],
  },

  // ---------------------------------------------------------------- 3.6
  '3.6.K1': {
    sections: ['concept', 'check', 'review'],
    how: 'Concept "Run non-interactively" explains that claude -p / --print processes the prompt, prints to stdout, and exits; check 3.6-c4 covers a step that hangs without it; a review card lists it among the minimum flags.',
    questions: ['ci-headless-hang-v1'],
  },
  '3.6.K2': {
    sections: ['concept', 'example', 'check'],
    how: 'Concept "Make output machine-readable" pairs --output-format json with --json-schema; the workflow example passes both with .claude/review-schema.json; check 3.6-c1 covers prose breaking the parser.',
    questions: ['ci-json-findings-output-v1', 'extraction-ci-schema-gate-v1', 'ci-job-permissions-v1'],
  },
  '3.6.K3': {
    sections: ['concept', 'example'],
    how: 'Concept "Give the run project context" names CLAUDE.md as how CI-invoked Claude Code gets review criteria, testing standards, and fixtures; the example CLAUDE.md excerpt holds review standards and a testing-standards section.',
    questions: ['ci-testgen-standards-v1'],
  },
  '3.6.K4': {
    sections: ['concept', 'compare', 'exercise'],
    how: 'Concept "Review independently" names session context isolation: the authoring session carries its own assumptions; the compare contrasts self-review with a fresh instance; exercise line 3 labels a resumed authoring session as self-review.',
    questions: ['ci-independent-reviewer-v1'],
  },
  '3.6.S1': {
    sections: ['concept', 'check'],
    how: 'Concept explains that without -p the command opens the interactive interface and the CI job hangs until timeout; check 3.6-c4 asks for the fix.',
    questions: ['ci-headless-hang-v1'],
  },
  '3.6.S2': {
    sections: ['concept', 'example'],
    how: 'Concept says --json-schema yields a findings array (file, line, severity, message) a script can turn into inline PR comments; the example\'s post-review.mjs validates and posts from review.json.',
    questions: ['ci-json-findings-output-v1', 'ci-job-permissions-v1'],
  },
  '3.6.S3': {
    sections: ['concept', 'example', 'mistake', 'check'],
    how: 'Concept "Avoid duplicate comments" passes prior findings and asks only for new or still-unresolved issues; the workflow example builds prior-findings.json; the mistake and check 3.6-c2 cover re-posted findings.',
    questions: ['ci-rerun-prior-findings-v1', 'ci-rerun-prior-findings-v2'],
  },
  '3.6.S4': {
    sections: ['concept', 'example'],
    how: 'Concept says to put the existing test files for the changed code into context so generation suggests only uncovered scenarios; the example\'s test-suggestion step lists existing tests and tells Claude not to repeat what they cover.',
    questions: ['ci-testgen-existing-tests-v1'],
  },
  '3.6.S5': {
    sections: ['concept', 'example'],
    how: 'Concept says CLAUDE.md should document testing standards, what makes a test valuable, and available fixtures to avoid low-value tests; the example CLAUDE.md has a "Testing standards" section naming factories and the mockServer fixture.',
    questions: ['ci-testgen-standards-v1'],
  },
};
