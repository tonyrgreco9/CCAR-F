import type { Lesson } from '../types';

// Domain 4 — Prompt Engineering & Structured Output.
// Original, app-authored lessons. learningPoints restate the Knowledge/Skills bullets of the
// CCAR-F Exam Guide v1.1 (task statements 4.1–4.6) in original wording; see coverage/d4.ts for
// the bullet-by-bullet map. Notes flag product details that may have changed since the guide.

const NOTE_DATE = '2026-11-21';

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------------------
  // 4.1
  // ---------------------------------------------------------------------------------------
  {
    id: '4.1',
    title: 'Explicit criteria that cut false positives',
    outcome:
      'Given a noisy review or classification prompt, rewrite its vague instructions as explicit report/skip criteria with severity examples, and decide which high-false-positive category to switch off while you fix it.',
    minutes: 25,
    terms: [
      { term: 'False positive', definition: 'An item the model reports that a human expert would not have reported, such as a style nit flagged as a bug.' },
      { term: 'Precision', definition: 'Of everything reported, the share that was worth reporting. Vague prompts tend to lower precision because the model guesses where the bar is.' },
      { term: 'Categorical criteria', definition: 'Instructions that name concrete categories and conditions ("report X when Y; never report Z") rather than a disposition ("be conservative").' },
      { term: 'Severity rubric', definition: 'A short definition of each severity level with one or two concrete examples, so that two runs assign the same level to the same finding.' },
    ],
    learningPoints: [
      'Explain why an explicit criterion (e.g. "flag a comment only when what it claims contradicts what the code does") beats a vague one ("check comments are accurate").',
      'Explain why general instructions such as "be conservative" or "only report high-confidence findings" do not raise precision the way specific categorical criteria do.',
      'Explain how one high-false-positive category undermines developer trust in the accurate categories too.',
      'Write review criteria that name what to report (bugs, security) and what to skip (minor style, local patterns), instead of relying on confidence-based filtering.',
      'Temporarily disable a high-false-positive category to restore trust while you improve and re-measure its prompt.',
      'Define each severity level with explicit criteria and a concrete code example so classification is consistent.',
    ],
    concept: `Imagine telling a new reviewer "only flag the important stuff". They will nod, and then flag whatever *they* think is important. A model does the same thing. Words like "conservative", "important", or "high confidence" do not tell it where the line is, so it draws its own line, and that line moves between runs and between files.

The fix is to say **what** to report and **what** to skip, in terms the model can check against the input. Compare:

- Vague: "Be conservative. Only report issues you are highly confident about."
- Explicit: "Report a finding only if it is one of: (1) a security flaw with a concrete path from untrusted input to a sensitive operation, (2) a correctness bug where you can name an input that produces a wrong result, (3) a resource leak on an error path. Do not report naming, formatting, comment wording, or anything the linter already enforces."

The explicit version gives the model a test to apply to each candidate finding. Many false positives disappear because they simply do not match any listed category. The same holds for narrow checks: "check that comments are accurate" invites nitpicks about wording, while "flag a comment only when the behavior it claims contradicts what the code actually does" gives a checkable condition.

Notice what the explicit version does *not* do: it does not ask the model to filter by its own confidence. "Only high-confidence findings" is still a disposition; the categories and the skip list (minor style, patterns that are normal in this codebase, linter-owned rules) are what move precision.

### Severity needs examples, not adjectives

"Critical / major / minor" means little on its own. Give each level an explicit criterion **and a short code example** from your codebase, for instance *blocking* = untrusted input reaches a sink, shown as \`db.query("... ORDER BY " + req.query.sort)\`; *non-blocking* = a contained defect, shown as a temp-file stream left open in a CLI script that exits immediately. Concrete code anchors the scale so the same finding gets the same level next week.

### Trust is shared across categories

If developers learn that "performance" comments are wrong most of the time, they start skimming **all** comments, including the correct security ones. When one category has a high false-positive rate, the pragmatic move is to switch it off (or narrow it sharply) while you rewrite its criteria and measure it on labeled examples. Turn it back on only when its precision is acceptable.

### Terminology

- **Precision**: share of reported findings that were worth reporting.
- **Categorical criteria**: named categories plus the conditions for each.
- **Skip list**: explicit exclusions, which often remove more noise than any inclusion rule.

> Instructions are still probabilistic. If a rule must hold every time (for example, "never comment on formatting"), move it into a deterministic tool such as a formatter or a post-filter in code.`,
    example: {
      intro:
        'Quarry Labs posts Claude review comments on every pull request. Developers complain that most comments are noise. Below are the original instruction, a rewritten instruction, and a per-category tally from 200 labeled comments.',
      artifacts: [
        {
          lang: 'text',
          caption: 'Before: disposition-only instruction',
          code: `You are a senior reviewer. Review the diff carefully.
Be conservative and only report issues you are highly confident about.
Rate each issue as critical, major, or minor.`,
        },
        {
          lang: 'text',
          caption: 'After: categorical criteria, skip list, and severity examples',
          code: `Review the diff. Report a finding ONLY if it fits one of these categories:

1. security   - untrusted input reaches a query, shell command, file path, or
                auth decision without validation. Name the input and the sink.
2. correctness - you can state a concrete input or state that produces a wrong
                result or exception. State it.
3. resource   - a file, connection, or lock is not released on an error path.
4. comment    - only when the behavior a comment claims contradicts what the
                code does. Quote both.

Do NOT report: naming, formatting, import order, comment wording, test style,
code that follows an established local pattern in this repo, anything enforced
by eslint/prettier, or speculative "could be slow" remarks.

Severity (criterion + code example for each level):
- blocking: exploitable or data-corrupting.
    db.query(\`SELECT * FROM orders ORDER BY \${req.query.sort}\`)   // OrderRepo.find()
- non-blocking: real but contained.
    const out = fs.createWriteStream(tmp); write(serialize(rows))  // scripts/, exits after
    // no out.close() if serialize() throws

If no finding meets these criteria, return an empty list.`,
        },
        {
          lang: 'json',
          caption: 'Labeled sample (200 comments, before the change)',
          code: `{
  "security":    { "reported": 18, "useful": 15 },
  "correctness": { "reported": 52, "useful": 37 },
  "performance": { "reported": 71, "useful": 9 },
  "style":       { "reported": 59, "useful": 4 }
}`,
        },
      ],
      walkthrough: `Read the tally first. Security (15 of 18) and correctness (37 of 52) are mostly useful. Performance (9 of 71) and style (4 of 59) are mostly noise, and together they are 130 of the 200 comments, so they dominate what developers see.

The rewrite does three things:

1. **Names categories with checkable conditions.** "Name the input and the sink" forces the model to ground a security claim in the diff instead of a hunch.
2. **Adds a skip list.** Style and established local patterns are excluded outright, and the linter already owns formatting. Comment findings survive only in their narrow, checkable form (claim contradicts code).
3. **Anchors severity with a criterion and a code example** for each level, taken from this codebase.

Notice there is no confidence threshold anywhere. Precision comes from what qualifies, not from asking the model how sure it feels.

Performance is not in the new list at all. That is deliberate: its 9-in-71 hit rate was teaching developers to skim every comment, including the accurate security ones, so the team switches it off temporarily while they write narrower criteria (for example, "an N+1 query inside a request handler") and test them on labeled diffs. Re-run the same 200-comment sample after the change and compare precision per category, not just overall.`,
    },
    compare: {
      question: 'A review bot produces too many low-value comments. Should you tighten the wording of the existing instruction or rewrite it as explicit categories with a skip list?',
      a: {
        title: 'Tighten the disposition ("be very conservative", "only report if 90% confident")',
        body: 'Keeps the prompt short and changes one line. It may reduce volume, but it does not tell the model which findings to drop, so it often removes useful findings along with noisy ones and the threshold drifts between runs.',
        chooseWhen: 'The noise is spread evenly across categories and you only need a modest, untargeted reduction in volume as a stopgap.',
      },
      b: {
        title: 'Explicit categories, conditions, skip list, and severity examples',
        body: 'Each candidate finding is tested against named conditions. Noise in specific categories is removed without suppressing the categories that work, and severity becomes repeatable.',
        chooseWhen: 'Labeled data shows the false positives cluster in identifiable categories (style, speculative performance) while other categories are mostly correct.',
      },
      decidingDetail:
        'Whether the false positives cluster by category. When a per-category tally shows a few categories produce most of the noise, explicit criteria and a skip list remove that noise without losing the precise categories; a stronger "be conservative" lowers volume indiscriminately and cannot be checked against the input.',
    },
    mistake: {
      mistake: 'Responding to noisy output by adding "be conservative" or "only report high-confidence issues" to the prompt and keeping every category enabled.',
      whyTempting: 'It is a one-line change, it sounds like exactly what you want, and the output volume often drops, which looks like success at a glance.',
      howToRecognize: 'Precision per category barely moves, useful security or correctness findings start disappearing, and the same diff gets different findings on different runs. Developers still ignore the comments.',
      fix: 'Tally reported versus useful findings per category on a labeled sample. Rewrite criteria as named categories with checkable conditions and a skip list, add severity examples, and disable the worst category until its new criteria test well.',
    },
    exercise: {
      prompt:
        'Apply the "After" criteria from the example to each candidate comment below. Decide whether the bot should post it as blocking, post it as non-blocking, or skip it.',
      inputs: `Criteria in force: security, correctness, resource categories only; skip list includes naming, formatting, comment wording, test style, linter-enforced rules, and speculative performance remarks.

Candidate comments produced on a pull request that touches \`api/orders.ts\` and \`scripts/export.ts\`:`,
      labels: ['Post as blocking', 'Post as non-blocking', 'Skip (outside criteria)'],
      items: [
        {
          id: 'c1',
          text: '`req.query.sort` is interpolated into the ORDER BY clause in `listOrders()` without an allow-list.',
          answer: 'Post as blocking',
          why: 'Security category: an untrusted input (query parameter) reaches a SQL sink. That is exploitable, which matches the blocking example.',
        },
        {
          id: 'c2',
          text: 'Variable `ordRes` should be renamed to `orderResult` for readability.',
          answer: 'Skip (outside criteria)',
          why: 'Naming is on the explicit skip list, however reasonable the suggestion is.',
        },
        {
          id: 'c3',
          text: '`scripts/export.ts` opens a write stream and does not close it if `serialize()` throws; the script exits right after.',
          answer: 'Post as non-blocking',
          why: 'Resource category (not released on an error path), but contained because the process exits immediately, which matches the non-blocking example.',
        },
        {
          id: 'c4',
          text: 'This loop might be slow for large inputs; consider caching.',
          answer: 'Skip (outside criteria)',
          why: 'Speculative performance remark with no concrete input or measurement. Performance is disabled until narrower criteria are tested.',
        },
        {
          id: 'c5',
          text: '`parseAmount("1,000")` returns 1 because `parseFloat` stops at the comma; totals for amounts over 999 are wrong.',
          answer: 'Post as blocking',
          why: 'Correctness category with a concrete input and wrong result, and it corrupts monetary data, which makes it blocking.',
        },
      ],
      solution: `Two comments are blocking (c1 security, c5 correctness with data corruption), one is non-blocking (c3 contained resource leak), and two are skipped (c2 naming, c4 speculative performance).

Notice that the skipped comments are not *wrong*; they are outside what the team decided to report. That is the point of a skip list: it encodes a product decision about what is worth a developer's attention, which a confidence threshold cannot express.`,
    },
    check: [
      {
        id: '4.1-k1',
        stem: 'A review prompt says "only report issues you are highly confident about". False positives remain high and some real bugs are now missed. What is the most effective next change?',
        options: [
          { id: 'a', text: 'Raise the stated threshold to "extremely confident" and re-run.' },
          { id: 'b', text: 'Replace the disposition with named report categories, their conditions, and an explicit skip list.' },
          { id: 'c', text: 'Ask the model to output a numeric confidence and drop findings below 0.9 without calibrating it.' },
          { id: 'd', text: 'Increase max_tokens so the model can reason more about each finding.' },
        ],
        correct: 'b',
        why: 'Explicit categories and a skip list give the model a test it can apply to each finding, removing noise in specific categories without suppressing real bugs. Stronger dispositions and uncalibrated confidence cut-offs move the threshold unpredictably.',
      },
      {
        id: '4.1-k2',
        stem: 'Per-category data shows "performance" comments are useful 12% of the time; security and correctness are above 80%. Developers have started ignoring all bot comments. What should the team do first?',
        options: [
          { id: 'a', text: 'Keep all categories and add "be careful with performance comments" to the prompt.' },
          { id: 'b', text: 'Turn the whole review bot off until every category is above 80%.' },
          { id: 'c', text: 'Temporarily disable the performance category while rewriting and testing narrower criteria for it.' },
          { id: 'd', text: 'Mark performance comments as blocking so developers take them seriously.' },
        ],
        correct: 'c',
        why: 'One noisy category erodes trust in all of them. Disabling it restores trust in the precise categories while its criteria are fixed; switching off the whole bot throws away the categories that already work.',
      },
      {
        id: '4.1-k3',
        stem: 'Two runs on the same diff label the same missing-validation finding "major" and "minor". What change most directly makes severity consistent?',
        options: [
          { id: 'a', text: 'Define each severity level with a short rule and a concrete example from the codebase.' },
          { id: 'b', text: 'Set temperature to zero and leave the severity words undefined.' },
          { id: 'c', text: 'Remove severity and post every finding at the same level.' },
          { id: 'd', text: 'Ask the model to explain its severity choice after assigning it.' },
        ],
        correct: 'a',
        why: 'Adjectives like major and minor have no fixed meaning; anchoring each level with a rule and an example gives the model the same reference point on every run.',
      },
    ],
    review: [
      { front: 'Why does "be conservative" fail to reduce false positives reliably?', back: 'It states a disposition, not a test. The model still decides where the line is, so precision barely improves and real findings can be dropped.' },
      { front: 'What should you do with a category whose false-positive rate is high?', back: 'Disable or sharply narrow it while you rewrite and test its criteria; noisy categories erode trust in the accurate ones.' },
      { front: 'How do you make severity labels repeatable?', back: 'Define each level with a short rule plus a concrete example from the codebase.' },
    ],
    sources: ['guide-d4', 'pe-clear-direct', 'guard-consistency', 'eval-tests', 'app-authored'],
  },

  // ---------------------------------------------------------------------------------------
  // 4.2
  // ---------------------------------------------------------------------------------------
  {
    id: '4.2',
    title: 'Few-shot examples for consistency and edge cases',
    outcome:
      'Given an extraction or classification prompt with inconsistent output on edge cases, choose 2–4 targeted examples (varied layouts, ambiguous cases, reasoning shown, one output format) that fix it.',
    minutes: 25,
    terms: [
      { term: 'Few-shot (multishot) prompting', definition: 'Including a small number of input/output examples in the prompt to show the expected behavior and format.' },
      { term: 'Targeted example', definition: 'An example chosen because it covers a case the model gets wrong or handles inconsistently, not a typical easy case.' },
      { term: 'Informal measurement', definition: 'A quantity written loosely in the source ("about 3 metres", "a couple of boxes") that has no exact numeric value.' },
      { term: 'Format drift', definition: 'Run-to-run variation in output shape: field names, units, date formats, or extra prose.' },
    ],
    learningPoints: [
      'Explain why few-shot examples are the most effective fix when detailed instructions alone still give inconsistently formatted or non-actionable output.',
      'Write 2–4 targeted examples for ambiguous cases (which tool fits an ambiguous request, whether a branch-level test gap matters) that show why the chosen action beat plausible alternatives.',
      'Explain how examples that show reasoning let the model generalize its judgment to new patterns instead of matching only the listed cases.',
      'Include examples that demonstrate the exact output format, such as location, issue, severity, and suggested fix for each review finding.',
      'Include examples that contrast an acceptable code pattern with a genuine issue, to cut false positives while still generalizing.',
      'Use examples to reduce extraction hallucination: informal measurements, and varied document structures (inline citations vs bibliographies, a methodology section vs details embedded in the text).',
      'Add examples of correct extraction from differently formatted documents when required fields come back empty or null although the value is present.',
    ],
    concept: `Rules describe behavior; examples *show* it. When a model handles typical documents well but wobbles on borderline ones, a handful of well-chosen examples usually fixes it faster than another paragraph of rules.

### What makes an example worth its tokens

- **It is a case the model gets wrong or inconsistent.** A clean, typical invoice teaches little. An invoice where the "total" printed on the page excludes a separately listed freight charge teaches a distinction.
- **It shows the reasoning.** One or two sentences of "why this answer" let the model generalize to similar-but-different cases instead of pattern-matching the surface.
- **It uses the exact output format.** If every example has the same field names, units, and date style, format drift drops sharply, because the examples are the strongest signal of what the output should look like.
- **The set varies layout.** If all examples have the PO number in the top-right header, the model may learn "top-right" instead of "PO number". Draw examples from different layouts: table-heavy, letter-style, scanned forms.

Two to four targeted examples is a good starting range. More examples cost tokens and can over-anchor the model on surface features; fewer may not cover the ambiguous cases.

When a prompt already has detailed instructions and output is *still* inconsistent, examples are the most effective next step: adding more rules tends to produce more rules to misread, while an example shows the answer and its shape at once.

### Ambiguous actions and review findings

Examples are not only for extraction. They show how to handle ambiguous cases anywhere: which tool an agent should call when a request could fit two tools, or whether an uncovered branch is a test gap worth reporting. For code review, two kinds of example pay off:

- **Format examples**: every finding written the same way (location, issue, severity, suggested fix), so findings are consistent and actionable.
- **Acceptable vs genuine**: a pattern that *looks* risky but is fine in this codebase, next to a real issue with the same surface shape, each with a reason. The model learns the distinction and applies it to cases you never listed.

### Varied document structures

Research papers cite inline ("Lee et al., 2021") or in a bibliography; methods sit in a dedicated section or are embedded in the results text. If every example uses one structure, the model returns empty or null for a required field whenever the structure differs. An example of each structure, showing where the value was found, fixes that.

### Informal measurements and hallucination

Field notes say things like "approx 3m of conduit" or "a couple of boxes of fittings". Asked for a numeric \`quantity\`, a model may produce \`3\` or \`2\` with no sign that the source was vague. An example that shows the desired handling (keep the text verbatim, set the numeric value only when the source states one, mark it approximate) teaches the model not to invent precision. This works best together with a schema that *allows* a null numeric value (lesson 4.3).

### Terminology

- **Multishot / few-shot**: examples in the prompt, often wrapped in tags such as \`<example>\`.
- **Targeted example**: chosen to cover a known failure.
- **Format drift**: inconsistent output shape across runs.

> Examples are not a substitute for validation. They raise the rate of correct, consistent output; code still checks the result.`,
    example: {
      intro:
        'A field-service company extracts materials used from technicians’ job notes. Without examples, the model returns quantities like 2 for "a couple of boxes" and alternates between "m" and "metres". Below are three targeted examples and a new input.',
      artifacts: [
        {
          lang: 'xml',
          caption: 'Three targeted examples (different layouts, reasoning shown, one format)',
          code: `<example>
<note>Job 4411. Replaced breaker. Used approx 3m of 20mm conduit + 2 couplers.</note>
<reasoning>"approx 3m" is stated but approximate: keep the number, mark approximate.
"2 couplers" is exact.</reasoning>
<output>{"items":[
 {"material":"20mm conduit","quantity":3,"unit":"m","approximate":true,"source_text":"approx 3m of 20mm conduit"},
 {"material":"coupler","quantity":2,"unit":"each","approximate":false,"source_text":"2 couplers"}]}</output>
</example>

<example>
<note>MATERIALS
- cable ties ........ a couple of bags
- junction box ...... 1</note>
<reasoning>"a couple of bags" has no reliable number. Do not convert it to 2.
Leave quantity null and keep the text.</reasoning>
<output>{"items":[
 {"material":"cable ties","quantity":null,"unit":"bag","approximate":true,"source_text":"a couple of bags"},
 {"material":"junction box","quantity":1,"unit":"each","approximate":false,"source_text":"1"}]}</output>
</example>

<example>
<note>Customer supplied their own sealant. We used about half our tube of ours too.</note>
<reasoning>Customer-supplied sealant is not our material: exclude it.
"about half our tube" is a fraction of a known unit: 0.5 tube, approximate.</reasoning>
<output>{"items":[
 {"material":"sealant","quantity":0.5,"unit":"tube","approximate":true,"source_text":"about half our tube"}]}</output>
</example>`,
        },
        {
          lang: 'xml',
          caption: 'Same technique in a code-review prompt: one format, acceptable pattern vs genuine issue',
          code: `<example>
<code>// telemetry/emit.ts
try { await sendMetric(m) } catch { /* best-effort: metrics must never fail a request */ }</code>
<reasoning>Swallowed error, but intentional and documented: telemetry is best-effort
by team convention. Acceptable pattern. No finding.</reasoning>
<findings>[]</findings>
</example>

<example>
<code>// billing/charge.ts
try { await ledger.write(entry) } catch { }</code>
<reasoning>Same shape, different stakes: a failed ledger write is silently lost and
the customer is charged with no record. Genuine issue.</reasoning>
<findings>[{"location":"billing/charge.ts:41","issue":"ledger write failure is swallowed; charge proceeds without a ledger entry","severity":"blocking","suggested_fix":"remove the empty catch, or rethrow after logging so the charge is rolled back"}]</findings>
</example>`,
        },
        {
          lang: 'text',
          caption: 'New input',
          code: `Job 4519 — swapped thermostat. Few metres of 18/2 wire, one wall plate.
Old thermostat taken away by customer.`,
        },
        {
          lang: 'json',
          caption: 'Output after adding the examples',
          code: `{"items":[
 {"material":"18/2 wire","quantity":null,"unit":"m","approximate":true,"source_text":"Few metres of 18/2 wire"},
 {"material":"wall plate","quantity":1,"unit":"each","approximate":false,"source_text":"one wall plate"}]}`,
        },
      ],
      walkthrough: `Each example was picked to cover a failure seen in production, not a typical note:

1. The first shows an approximate quantity that *does* state a number ("approx 3m"): keep 3, set \`approximate: true\`.
2. The second shows a vague quantity with **no** reliable number ("a couple of bags"): \`quantity: null\`, keep \`source_text\`. This is the example that stops the model inventing 2.
3. The third covers an exclusion rule (customer-supplied material) and a fraction of a unit.

The layouts differ: free text, a dotted list, a conversational sentence. That stops the model from learning "quantities are after the dots".

Every output uses the same keys, units ("m", "each", "bag", "tube"), and \`source_text\`. On the new note, "Few metres" is handled like "a couple of bags" (null, approximate), even though no example used the word "few". The reasoning lines taught the distinction "is there a reliable number?", which is what generalizes.

The code-review artifact applies the same ideas to findings. The two examples have the same surface shape (an empty \`catch\`) with opposite verdicts, and the reasoning names the difference (best-effort telemetry by convention versus a lost ledger write). That pair reduces false positives on accepted patterns without suppressing real ones, and the single findings format (location, issue, severity, suggested fix) makes every posted comment consistent and actionable.`,
    },
    compare: {
      question: 'The model handles normal notes well but is inconsistent on vague quantities and exclusions. Add more rules, or add a few targeted examples?',
      a: {
        title: 'Extend the rule list',
        body: 'Add rules such as "if the quantity is vague, set null" and "exclude customer-supplied items". Cheap and explicit, and good for crisp, testable conditions.',
        chooseWhen: 'The failing cases can be described by a crisp condition the model can check (a keyword, a field present or absent), and the output format is already stable.',
      },
      b: {
        title: 'Add 2–4 targeted examples with reasoning',
        body: 'Show the ambiguous cases worked through, in the exact output format, across varied layouts. Teaches the judgment and the format together.',
        chooseWhen: 'The failures are judgment calls that are hard to state as rules ("few", "a bit", "half a tube"), or the output format drifts between runs.',
      },
      decidingDetail:
        'Whether the failing cases can be captured by a crisp, checkable rule. Judgment calls on fuzzy language and format drift respond better to a few examples that show the reasoning and the exact output; crisp conditions are cheaper to state as rules. The two combine well.',
    },
    mistake: {
      mistake: 'Filling the prompt with many easy, typical examples, all from the same document layout, with answers but no reasoning.',
      whyTempting: 'Typical examples are easy to collect and feel representative. More examples seem like more teaching.',
      howToRecognize: 'Accuracy on clean documents is high but edge cases still fail; the model breaks on a new layout; outputs copy surface details of the examples (same field positions, same wording) rather than the underlying rule.',
      fix: 'Replace them with 2–4 examples that cover the observed failures, each from a different layout, each with a short reasoning line and the exact output format. Re-test on a held-out set of edge cases.',
    },
    exercise: {
      prompt:
        'You are building the example set for a supplier-invoice extractor. The model already handles standard single-page invoices correctly. For each candidate example, decide whether to include it.',
      inputs: `Known failures on the evaluation set:
- Treats "Total before freight" as the invoice total when freight is listed separately.
- Invents a due date when the invoice only says "Payment on receipt".
- Misses the invoice number on letter-style invoices where it appears in the body text.

Already chosen: one example of a standard table-layout invoice with all fields present.`,
      labels: ['Include as targeted example', 'Redundant with existing example', 'Misleading (teaches wrong behavior)'],
      items: [
        {
          id: 'e1',
          text: 'Letter-style invoice whose number appears mid-paragraph ("...regarding invoice 88213..."), with reasoning explaining why it is the invoice number.',
          answer: 'Include as targeted example',
          why: 'Covers a known failure and adds a new layout.',
        },
        {
          id: 'e2',
          text: 'Another standard table-layout invoice from a different supplier, all fields present.',
          answer: 'Redundant with existing example',
          why: 'The model already handles this case and a table-layout example is already chosen; it adds tokens without teaching a distinction.',
        },
        {
          id: 'e3',
          text: 'Invoice saying "Payment on receipt" with output `due_date: null`, `payment_terms: "due_on_receipt"` and a reasoning line.',
          answer: 'Include as targeted example',
          why: 'Directly addresses the invented due date and shows how to represent the case without fabricating a date.',
        },
        {
          id: 'e4',
          text: 'Invoice with separate freight where the example output uses the pre-freight subtotal as `total` "to keep it simple".',
          answer: 'Misleading (teaches wrong behavior)',
          why: 'It demonstrates the exact error you are trying to remove; examples are copied closely, so this would entrench it.',
        },
        {
          id: 'e5',
          text: 'Invoice with separate freight where the output total includes freight, with reasoning "the amount payable includes all listed charges".',
          answer: 'Include as targeted example',
          why: 'Targets the freight failure and the reasoning states the generalizable rule.',
        },
      ],
      solution: `Include e1, e3, and e5. Together with the existing table example that gives four, at the top of the 2–4 range, and each covers a distinct observed failure in a different layout.

e2 is redundant: it repeats a case already handled. e4 is actively harmful, because the model imitates examples closely, including their mistakes. Always check that every example output is exactly what you want production output to be.`,
    },
    check: [
      {
        id: '4.2-k1',
        stem: 'An extractor alternates between "2026-03-04", "04/03/2026", and "March 4" for dates, and sometimes adds a prose preface. Which change most directly fixes this?',
        options: [
          { id: 'a', text: 'Add a sentence asking the model to be consistent.' },
          { id: 'b', text: 'Add ten more examples of easy invoices with any date style.' },
          { id: 'c', text: 'Raise max_tokens so the model has room to format properly.' },
          { id: 'd', text: 'Add a few examples whose outputs all use ISO dates and the exact JSON shape, with no preface.' },
        ],
        correct: 'd',
        why: 'Examples are a strong signal of output format; consistent examples fix format drift. A request to "be consistent" does not define the format, and examples in mixed styles would reinforce the drift.',
      },
      {
        id: '4.2-k2',
        stem: 'All four few-shot examples come from one supplier whose PO number is in the top-right header. On other suppliers the model returns the top-right value even when it is a customer ID. What is the best fix?',
        options: [
          { id: 'a', text: 'Replace some examples with invoices from different layouts where the PO number is elsewhere, with reasoning.' },
          { id: 'b', text: 'Add a rule "PO numbers are always in the header".' },
          { id: 'c', text: 'Remove all examples and rely on rules only.' },
          { id: 'd', text: 'Add four more examples from the same supplier.' },
        ],
        correct: 'a',
        why: 'The model learned a position, not a concept. Varying layouts and explaining how the PO number was identified teaches the concept; more of the same layout deepens the problem.',
      },
      {
        id: '4.2-k3',
        stem: 'Notes say "a few litres of coolant". The model outputs quantity 3. Which example best reduces this kind of hallucination?',
        options: [
          { id: 'a', text: 'An example converting "a few" to 3 so the output is always numeric.' },
          { id: 'b', text: 'An example with an exact quantity like "4 litres" output as 4.' },
          { id: 'c', text: 'An example where a vague amount gets quantity null, approximate true, and the source text kept, with a reasoning line.' },
          { id: 'd', text: 'An example that omits the item entirely when the quantity is vague.' },
        ],
        correct: 'c',
        why: 'It shows that a vague amount has no reliable number and how to represent that without inventing one, while still recording the item and its original wording for review.',
      },
    ],
    review: [
      { front: 'How many few-shot examples is a good starting point, and which ones?', back: 'About 2–4, chosen to cover cases the model gets wrong or inconsistent, each with a short reasoning line.' },
      { front: 'Why vary document layouts across examples?', back: 'So the model learns the concept (what a PO number is) rather than a surface cue (where it sits on one supplier’s template).' },
      { front: 'How do examples reduce hallucination for informal measurements?', back: 'They show vague amounts kept verbatim with a null or approximate numeric value instead of an invented precise number.' },
    ],
    sources: ['guide-d4', 'pe-multishot', 'guard-consistency', 'guard-hallucinations', 'app-authored'],
  },

  // ---------------------------------------------------------------------------------------
  // 4.3
  // ---------------------------------------------------------------------------------------
  {
    id: '4.3',
    title: 'Structured output with tools and JSON schemas',
    outcome:
      'Given an extraction task, write a tool input_schema and tool_choice setting that guarantee parseable output, and model fields that may be absent (such as a missing PO number) as nullable so the schema does not push the model to fabricate.',
    minutes: 30,
    terms: [
      { term: 'input_schema', definition: 'The JSON Schema attached to a tool definition. When Claude calls the tool, its `input` is shaped to that schema.' },
      { term: 'tool_choice', definition: 'Request setting controlling tool calls: `auto` (model decides), `any` (must call some tool), `tool` with a name (must call that tool), `none` (no tool calls).' },
      { term: 'Syntactic vs semantic error', definition: 'Syntactic: output is not valid JSON or does not match the schema shape. Semantic: valid JSON with wrong, misplaced, or invented values.' },
      { term: 'Nullable field', definition: 'A field whose type allows `null`, e.g. `"type": ["string", "null"]`, so the model can state that a value is absent.' },
      { term: 'Escape-hatch enum values', definition: 'Enum options such as `"other"` (paired with a free-text detail field) and `"unclear"` that let the model avoid forcing a bad fit.' },
    ],
    learningPoints: [
      'Define an extraction tool whose JSON schema is its input parameters and read the record from the tool_use block: the most reliable route to schema-compliant output with no JSON syntax errors.',
      'Distinguish tool_choice "auto" (the model may answer in text instead), "any" (must call a tool, chooses which), and a forced named tool (must call that one).',
      'Use "any" when several extraction schemas exist and the document type is unknown; force a specific tool such as extract_metadata when that extraction must run before enrichment steps.',
      'Explain why strict schemas remove syntax errors but not semantic ones (line items that do not sum to the total, values in the wrong field).',
      'Decide required vs optional, and make fields nullable when the source may not contain them, so the model is not pushed to fabricate a value.',
      'Add "unclear" for ambiguous cases and "other" plus a detail string for categories the enum does not list.',
      'Put format normalization rules in the prompt alongside the strict schema to cope with inconsistently formatted sources.',
    ],
    concept: `Asking a model to "return JSON" in plain text works most of the time, and "most of the time" breaks parsers. Defining a **tool** whose \`input_schema\` describes the record you want, and requiring Claude to call it, is the most reliable way to get schema-compliant output: the response contains a \`tool_use\` block whose \`input\` is already a JSON object in that shape, and your code reads the record from there. Strict, schema-constrained modes push this further. Either way, **JSON syntax errors stop being your problem.**

### What a schema cannot do

A schema checks *shape*, not *truth*. Consider a supplier invoice that simply has no purchase-order number, and this schema:

\`\`\`json
"po_number": { "type": "string" }   // listed in "required"
\`\`\`

The model must produce a string. A string like \`"PO-0000"\`, \`"N/A"\`, or \`""\` satisfies the schema perfectly, and the ERP now holds a value that looks real. You built a schema that **rewards fabrication**.

The fix is to let the schema express absence:

\`\`\`json
"po_number": { "type": ["string", "null"],
               "description": "PO number exactly as printed. null if the document has none." }
\`\`\`

Keep it in \`required\` so the model must address it, but allow \`null\`. (Making the field optional also works; "required but nullable" makes "I looked and it is not there" explicit.)

### Enums need escape hatches

An enum like \`["net_30", "net_60", "due_on_receipt"]\` forces "Net 45" into the nearest wrong bucket. Add \`"other"\` with a \`payment_terms_detail\` string, and \`"unclear"\` for illegible or contradictory terms.

### tool_choice

- \`{"type": "auto"}\`: the model may call a tool **or reply in plain text instead**. Right for conversational agents; risky for a pipeline that must always get a record.
- \`{"type": "any"}\`: must call *a* tool, model picks which. Use it when several extraction schemas exist (one per document type) and the type of the incoming document is unknown: you are guaranteed structured output, and the model classifies by choosing the tool.
- \`{"type": "tool", "name": "record_invoice"}\`: must call *this* tool. Right when every input should yield exactly this record, or when one step must run before others. For example, force \`extract_metadata\` first so later enrichment calls (supplier lookup, currency conversion) always start from extracted metadata.

### Normalization rules belong in the prompt too

A schema can say \`"invoice_date": {"type": "string"}\`; it cannot know that one supplier prints "14.10.2026", another "Oct 14, 26", and a third "2026/10/14". Put explicit normalization rules in the prompt (or field descriptions) next to the strict schema: "dates as YYYY-MM-DD; amounts as numbers with a period decimal separator, no thousands separators; currency as ISO 4217 code". The schema fixes the shape; the rules make inconsistent source formatting come out the same way.

### Terminology

- **Syntactic error**: unparseable or wrong shape. Removed by tools/structured outputs.
- **Semantic error**: wrong value, wrong field, fabricated value, totals that do not add up. Still needs validation in code (lesson 4.4).`,
    example: {
      intro:
        'Ledgerline extracts supplier invoices. The invoice below has no purchase-order number. The first schema forces a string and gets a fabricated one; the revised schema allows null and an honest answer.',
      artifacts: [
        {
          lang: 'text',
          caption: 'Source invoice (OCR text) — note: no PO number anywhere',
          code: `NORDVIK INDUSTRIAL SUPPLY AS
Invoice no: NIS-24-07731        Invoice date: 14.10.2026
Bill to: Ledgerline client 0192 — Harbor Plant 3
Terms: Net 45

Line  Description              Qty   Unit price   Amount
1     Hydraulic hose 3/8" 10m   4      310.00     1,240.00
2     Fitting kit HF-22         2       95.50       191.00
                                     Subtotal     1,431.00
                                     VAT 25%        357.75
                                     TOTAL NOK    1,788.75`,
        },
        {
          lang: 'json',
          caption: 'Version 1 request: po_number is a required string; terms enum has no escape hatch',
          code: `{
  "model": "<model-id>",
  "max_tokens": 1024,
  "tools": [{
    "name": "record_invoice",
    "description": "Record the fields of one supplier invoice.",
    "input_schema": {
      "type": "object",
      "properties": {
        "invoice_number": { "type": "string" },
        "po_number":      { "type": "string" },
        "payment_terms":  { "type": "string", "enum": ["net_30", "net_60", "due_on_receipt"] },
        "total":          { "type": "number" },
        "currency":       { "type": "string" }
      },
      "required": ["invoice_number", "po_number", "payment_terms", "total", "currency"]
    }
  }],
  "tool_choice": { "type": "tool", "name": "record_invoice" },
  "messages": [{ "role": "user", "content": "<invoice text above>" }]
}`,
        },
        {
          lang: 'json',
          caption: 'Version 1 result: valid against the schema, semantically wrong',
          code: `{
  "type": "tool_use",
  "id": "toolu_01A",
  "name": "record_invoice",
  "input": {
    "invoice_number": "NIS-24-07731",
    "po_number": "N/A",
    "payment_terms": "net_60",
    "total": 1788.75,
    "currency": "NOK"
  }
}`,
        },
        {
          lang: 'json',
          caption: 'Version 2 input_schema: nullable PO, enum with other + detail and unclear',
          code: `{
  "type": "object",
  "properties": {
    "invoice_number": { "type": "string" },
    "po_number": {
      "type": ["string", "null"],
      "description": "Purchase order number exactly as printed. null if the document has no PO number. Never invent a placeholder."
    },
    "payment_terms": {
      "type": "string",
      "enum": ["net_30", "net_60", "due_on_receipt", "other", "unclear"]
    },
    "payment_terms_detail": {
      "type": ["string", "null"],
      "description": "Terms text as printed when payment_terms is other or unclear; otherwise null."
    },
    "total": { "type": "number" },
    "currency": { "type": "string", "description": "ISO 4217 code, e.g. NOK" }
  },
  "required": ["invoice_number", "po_number", "payment_terms", "payment_terms_detail", "total", "currency"]
}`,
        },
        {
          lang: 'json',
          caption: 'Version 2 result',
          code: `{
  "invoice_number": "NIS-24-07731",
  "po_number": null,
  "payment_terms": "other",
  "payment_terms_detail": "Net 45",
  "total": 1788.75,
  "currency": "NOK"
}`,
        },
      ],
      walkthrough: `Forcing \`record_invoice\` with \`tool_choice\` means the response is a \`tool_use\` block, never prose, and its \`input\` parses. That solves the parser problem.

Version 1 still produced two **semantic** errors that pass the schema:

1. \`po_number: "N/A"\`. The schema demanded a string, there was none in the source, so the model supplied a placeholder. Downstream, "N/A" (or "PO-0000") is indistinguishable from a real PO by type, and an ERP may try to match it.
2. \`payment_terms: "net_60"\`. "Net 45" was not an option, so the nearest value was chosen.

Version 2 changes only the schema:

- \`po_number\` allows \`null\` and its description says when to use it. It stays in \`required\`, so the model must decide explicitly.
- \`payment_terms\` gains \`"other"\` with \`payment_terms_detail\`, and \`"unclear"\` for illegible terms.

The result is honest: \`po_number: null\` can now be routed by code ("client requires PO → send to a reviewer") instead of silently entering the ERP. Semantic checks still belong in code: for example, confirm that \`total\` equals subtotal plus VAT and reject placeholder-looking PO strings (lesson 4.4).`,
    },
    compare: {
      question: 'How should a field that is usually but not always present on the document be modeled in the extraction schema?',
      a: {
        title: 'Required, non-null string',
        body: 'Guarantees downstream code always receives a string. Simple to consume.',
        chooseWhen: 'The value is guaranteed to exist on every valid document (for example, an invoice number on documents already classified as invoices), so absence would itself mean the document is invalid.',
      },
      b: {
        title: 'Required but nullable (or optional), with a description saying when to use null',
        body: 'The model must address the field but can state that it is absent. Downstream code branches on null (route to review, apply a client rule) instead of trusting a placeholder.',
        chooseWhen: 'The value is legitimately missing on some real documents, such as PO numbers on invoices for non-PO purchases.',
      },
      decidingDetail:
        'Whether the value can legitimately be absent from a valid source document. If it can, a required non-null string forces the model to produce something, and placeholders like "N/A" or "PO-0000" pass the schema; nullable lets absence be represented and handled in code.',
    },
    mistake: {
      mistake: 'Treating schema-valid output as correct output: marking every field as a required string and assuming that because the JSON validates, the data is right.',
      whyTempting: 'Tool use and structured outputs genuinely eliminate parse failures, so the pipeline that used to break now runs cleanly. "Required" also feels like the safe, strict choice.',
      howToRecognize: 'Placeholder values (N/A, "unknown", "PO-0000", empty strings, 0) appear in fields that should be absent; enum fields cluster on one value; totals do not add up although every record validates.',
      fix: 'Make fields that may be absent nullable with a description of when to use null, add "other" + detail and "unclear" to enums, and add semantic validation in code (cross-field arithmetic, placeholder detection) after the structured call.',
    },
    exercise: {
      prompt:
        'Ledgerline is designing a schema for purchase-order acknowledgements from many suppliers. For each field, choose how it should be modeled.',
      inputs: `Observations from 500 sample acknowledgements:
- Every acknowledgement references the buyer's PO number (it is what is being acknowledged).
- About 30% include a promised delivery date; the rest say nothing about delivery.
- Shipping method is usually "ground", "air", or "sea", but 6% say things like "customer pickup" or "courier – Mon only".
- About 10% include a supplier contact phone number.
- Currency is always printed (ISO code or symbol).`,
      labels: ['Required, non-null', 'Required but nullable', 'Enum with "other" + detail field'],
      items: [
        { id: 's1', text: '`po_number` (the buyer PO being acknowledged)', answer: 'Required, non-null', why: 'It is present on every valid acknowledgement; its absence would mean the document is not an acknowledgement and should fail loudly.' },
        { id: 's2', text: '`promised_delivery_date`', answer: 'Required but nullable', why: 'Absent on about 70% of real documents. A required string or date would push the model to invent one.' },
        { id: 's3', text: '`shipping_method`', answer: 'Enum with "other" + detail field', why: 'Mostly three known values, but a real minority do not fit; "other" plus a detail string captures them without forcing a wrong bucket.' },
        { id: 's4', text: '`supplier_contact_phone`', answer: 'Required but nullable', why: 'Present on only about 10%. Null states absence honestly; a required string invites "N/A" or a made-up number.' },
        { id: 's5', text: '`currency`', answer: 'Required, non-null', why: 'Always printed, so it can be required; normalizing symbols to ISO codes is a formatting concern handled by description and validation.' },
      ],
      solution: `Ask one question per field: *can a valid document legitimately lack this value?*

- No (PO number on an acknowledgement, currency): required, non-null. Absence should be a loud failure.
- Yes (delivery date, contact phone): required but nullable, with a description saying when to use null.
- Value always present but not always in a fixed set (shipping method): enum plus "other" and a detail field; consider "unclear" too if scans are often illegible.

This is the same reasoning as the invoice without a PO number: a schema that cannot express absence will be satisfied with a fabricated value.`,
    },
    check: [
      {
        id: '4.3-k1',
        stem: 'An extraction pipeline switched from "return JSON" text prompts to a forced tool with an input_schema. Parse failures dropped to zero, but audits find invoices with po_number "N/A". What is the root cause?',
        options: [
          { id: 'a', text: 'The tool description is too long and confuses the model.' },
          { id: 'b', text: 'po_number is a required non-null string, so the model must supply a value even when the document has none.' },
          { id: 'c', text: 'tool_choice should be auto so the model can decline to call the tool.' },
          { id: 'd', text: 'The JSON parser is accepting invalid output.' },
        ],
        correct: 'b',
        why: 'The schema leaves no valid way to say "absent", so a placeholder string satisfies it. Making the field nullable with a clear description lets the model return null for documents without a PO.',
      },
      {
        id: '4.3-k2',
        stem: 'A pipeline has three extraction tools: record_invoice, record_credit_note, record_remittance. Incoming documents are unclassified and every document must produce exactly one structured record. Which tool_choice fits?',
        options: [
          { id: 'a', text: '{"type": "auto"}' },
          { id: 'b', text: '{"type": "tool", "name": "record_invoice"}' },
          { id: 'c', text: '{"type": "none"}' },
          { id: 'd', text: '{"type": "any"}' },
        ],
        correct: 'd',
        why: '"any" requires a tool call while letting the model choose which tool matches the document type. Forcing record_invoice would misfile credit notes and remittances; auto allows a text-only reply.',
      },
      {
        id: '4.3-k3',
        stem: 'A contract schema has governing_law as an enum of five jurisdictions. Some contracts name a sixth jurisdiction and some scans are illegible at that clause. What schema change is best?',
        options: [
          { id: 'a', text: 'Add "other" with a governing_law_detail text field, plus "unclear" for illegible clauses.' },
          { id: 'b', text: 'Change the field to free text with no enum.' },
          { id: 'c', text: 'Keep the enum and instruct the model to pick the closest jurisdiction.' },
          { id: 'd', text: 'Remove the field from required so it is omitted when it does not fit.' },
        ],
        correct: 'a',
        why: 'Escape-hatch values keep the enum useful for the common cases while recording unlisted jurisdictions accurately and separating "unlisted" from "unreadable", which need different handling.',
      },
    ],
    review: [
      { front: 'What does a forced tool with an input_schema guarantee, and what does it not?', back: 'It guarantees parseable output in the schema’s shape. It does not guarantee correct values: fabricated, misplaced, or inconsistent values can still be schema-valid.' },
      { front: 'An invoice has no PO number and the schema has po_number as a required string. What happens and what is the fix?', back: 'The model may output "N/A" or "PO-0000", which passes the schema. Make it nullable (["string","null"]) with a description saying to use null when absent.' },
      { front: 'tool_choice any vs forced tool?', back: 'any: must call some tool, model chooses which (e.g. one tool per document type). Forced: must call the named tool (one known record type).' },
    ],
    sources: ['guide-d4', 'api-tool-use', 'api-implement-tool-use', 'api-structured-outputs', 'app-authored'],
    notes: [
      {
        date: NOTE_DATE,
        text: 'Structured outputs (schema-constrained responses and strict tool schemas) is a newer API feature; its request parameter names, beta headers, model support, and supported JSON Schema keywords (for example, type arrays for nullability) have changed over time. Verify against current docs before relying on specific parameter names.',
      },
      {
        date: NOTE_DATE,
        text: 'Forced tool_choice (`any` or a named `tool`) has had restrictions when combined with extended thinking in some API versions. Verify current compatibility in the tool use docs.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  // 4.4
  // ---------------------------------------------------------------------------------------
  {
    id: '4.4',
    title: 'Validation, retries, and feedback loops for extraction',
    outcome:
      'Given a validation failure on an extracted record, decide whether a retry with the specific error can repair it (value present but mis-formatted or misread) or whether it must be routed elsewhere (value absent from the source).',
    minutes: 30,
    terms: [
      { term: 'Validation-retry loop', definition: 'Code validates the extracted record; on failure it sends the specific errors back to the model with the source and asks for a corrected record, up to a small retry limit.' },
      { term: 'Self-correction fields', definition: 'Schema fields that make the model show its work so inconsistencies are visible, e.g. `stated_total`, `calculated_total`, `conflict_detected`.' },
      { term: 'Repairable vs unrepairable failure', definition: 'Repairable: the correct value is in the source but was formatted or read wrongly. Unrepairable by retry: the value is not in the source at all.' },
      { term: 'detected_pattern', definition: 'A field naming the rule or pattern behind a finding, so you can aggregate which patterns humans accept or dismiss and refine prompts.' },
    ],
    learningPoints: [
      'Distinguish semantic validation errors (values that do not sum, a value in the wrong field) from schema syntax errors, which tool use already eliminates, and catch the semantic ones in code.',
      'Retry with error feedback: send a follow-up that contains the original document, the failed extraction, and the specific validation errors.',
      'Tell when a retry will work (format mismatches, structural output errors) and when it cannot (the information is absent, for example only in an external document that was not provided).',
      'Route absent-information failures to null, human review, or a client rule rather than looping.',
      'Design self-correction flows: extract calculated_total alongside stated_total and add a conflict_detected flag for inconsistent source data.',
      'Add a detected_pattern field to structured findings so dismissed findings can be analyzed by the code construct that triggered them.',
    ],
    concept: `Lesson 4.3 removed syntax errors. What is left are semantic errors, and code can catch many of them: a date that is not ISO, a total that does not equal the sum of line items, a PO string that looks like a placeholder. The question is what to do next.

### Retry with the specific error

A generic "that was wrong, try again" gives the model nothing to fix. A useful follow-up request contains three things: **the original document**, **the failed extraction**, and **the exact validation errors**:

> \`total\` is 1.2405 but line items sum to 1240.50. The source may use a comma as the decimal separator. Re-extract.

With all three, the model can re-read the source, see what it produced, and change only what is wrong. When the correct value **is in the source** and the first attempt mis-formatted it or put it in the wrong place (format mismatches, structural output errors such as a value in the wrong field or a missing line item), this usually works, often on the first retry. Cap retries at a small number (1–2) and then route to a human.

### When a retry cannot help

Go back to the invoice with no purchase-order number. If the client requires a PO and the extracted value is \`null\`, retrying with "po_number is required" cannot produce a real PO. The information is **absent from the source**. Worse, pressure to satisfy the validator invites exactly the fabrication you made the field nullable to avoid ("PO-0000"). The right move is to stop and route: human review, a request to the supplier, or a client-specific rule.

The same is true when the value lives **in another document you did not send**. An invoice that says "unit prices per framework agreement FA-2291" cannot be checked against those prices on retry: the agreement is not in the request, so the only things a retry can produce are guesses. Either supply the agreement in a new request or route the record.

So classify each failure first:

- **Present but wrong format** (date style, decimal separator, currency symbol vs ISO code) → retry with the error.
- **Present but misread** (wrong line used, digits transposed, value placed in the wrong field) → retry with the error; point to where to look.
- **Absent** (not printed, cut off, illegible) → do not retry for that field; keep null and route.

### Self-correction fields

Ask the model to record what it saw and what it computed: \`stated_total\` (as printed), \`calculated_total\` (sum of lines plus tax), and \`conflict_detected\` (true when they differ). The model then surfaces inconsistencies instead of silently choosing one number, and code can route conflicts.

### Feedback loops

For findings that humans review (code review comments, anomaly flags), include a \`detected_pattern\` field naming the construct that triggered the finding:

\`\`\`json
{ "location": "api/orders.ts:88", "issue": "possible null dereference",
  "detected_pattern": "optional-chain-missing-after-validated-lookup", "dismissed": true }
\`\`\`

When developers dismiss findings, group dismissals by \`detected_pattern\`. Without the field you only know that "about 30% of findings are dismissed"; with it you can see that one pattern accounts for most of them and fix that pattern's criteria or examples (lessons 4.1 and 4.2). A pattern dismissed 80% of the time is a candidate for tighter criteria or temporary removal.`,
    example: {
      intro:
        'Ledgerline validates every extracted invoice in code. The trace shows one record with two failures: one repairable by retry, one not. The invoice is the Nordvik invoice from lesson 4.3 (no PO number), and the client requires a PO.',
      artifacts: [
        {
          lang: 'ts',
          caption: 'Validator: returns specific, field-level errors and whether a retry can help',
          code: `type Issue = { field: string; message: string; retryable: boolean };

const PLACEHOLDER = /^(n\\/?a|none|unknown|tbd|po-?0+|0+|-)?$/i;

export function validateInvoice(r: Invoice, client: ClientRules): Issue[] {
  const issues: Issue[] = [];
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(r.invoice_date))
    issues.push({ field: 'invoice_date', retryable: true,
      message: \`"\${r.invoice_date}" is not ISO 8601 (YYYY-MM-DD).\` });
  if (r.conflict_detected || Math.abs(r.stated_total - r.calculated_total) > 0.01)
    issues.push({ field: 'stated_total', retryable: true,
      message: \`stated_total \${r.stated_total} != calculated_total \${r.calculated_total}.\` });
  if (r.po_number !== null && PLACEHOLDER.test(r.po_number.trim()))
    issues.push({ field: 'po_number', retryable: false,
      message: \`"\${r.po_number}" looks like a placeholder, not a PO number.\` });
  if (r.po_number === null && client.requiresPo)
    issues.push({ field: 'po_number', retryable: false,
      message: 'Client requires a PO number; none was found in the document.' });
  return issues;
}`,
        },
        {
          lang: 'json',
          caption: 'First attempt (record_invoice tool input)',
          code: `{
  "invoice_number": "NIS-24-07731",
  "invoice_date": "14.10.2026",
  "po_number": null,
  "stated_total": 1788.75,
  "calculated_total": 1788.75,
  "conflict_detected": false,
  "currency": "NOK"
}`,
        },
        {
          lang: 'json',
          caption: 'Retry turn: tool_result with is_error and only the retryable errors',
          code: `{
  "role": "user",
  "content": [{
    "type": "tool_result",
    "tool_use_id": "toolu_01B",
    "is_error": true,
    "content": "Validation failed. Fix only these fields using the document above and call record_invoice again:\\n- invoice_date: \\"14.10.2026\\" is not ISO 8601 (YYYY-MM-DD). The document uses DD.MM.YYYY.\\nDo not change po_number; null is correct if no PO is printed."
  }]
}`,
        },
        {
          lang: 'json',
          caption: 'Pipeline outcome after one retry',
          code: `{
  "invoice_number": "NIS-24-07731",
  "invoice_date": "2026-10-14",
  "po_number": null,
  "status": "needs_review",
  "routing_reason": "po_number: Client requires a PO number; none was found in the document.",
  "retries_used": 1
}`,
        },
      ],
      walkthrough: `The validator found two problems and labeled each with \`retryable\`. The retry is a follow-up in the same conversation, so the request carries all three things a correction needs: the invoice text (the first user message), the failed extraction (the previous \`tool_use\` input), and the specific error (the \`tool_result\` below).

1. **invoice_date "14.10.2026"** is present in the source, just not in ISO format. The retry message names the field, the rule, and the source convention (DD.MM.YYYY). The second attempt returns \`2026-10-14\`. Fixed in one retry.
2. **po_number null, client requires PO.** The PO is not printed anywhere. No retry can create it, so this error is deliberately *not* sent back to the model. The retry message even says "do not change po_number", to avoid pressuring it into a placeholder. The record goes to \`needs_review\` with a specific reason.

Note the other guard: if a model ever does return \`"N/A"\` or \`"PO-0000"\`, the placeholder check catches it and marks it non-retryable, because a placeholder means the value was not found.

The self-correction fields agreed here (\`stated_total\` = \`calculated_total\` = 1788.75, \`conflict_detected: false\`). Had the printed total differed from the line sum, \`conflict_detected: true\` would have triggered review or a targeted retry ("check whether VAT is included") instead of the model quietly picking one figure.`,
    },
    compare: {
      question: 'A required field fails validation. Retry the extraction with the error, or route the record without retrying?',
      a: {
        title: 'Retry with the specific validation error',
        body: 'Send the field, the failed rule, the bad value, and a hint about the source convention back with the document. Cap at 1–2 retries.',
        chooseWhen: 'The value is present in the source but was mis-formatted (date style, decimal separator, currency symbol) or misread (wrong line, transposed digits, wrong field).',
      },
      b: {
        title: 'Keep null and route to review or a business rule',
        body: 'Do not ask the model again for that field. Record why it failed and send it to a human, the supplier, or a client-specific default.',
        chooseWhen: 'The value is absent from the source (not printed, cut off, illegible), such as an invoice that carries no PO number.',
      },
      decidingDetail:
        'Whether the correct value exists in the source document. A retry gives the model a second look at the same input, so it can repair formatting and misreads; it cannot add information that is not there, and pushing for it invites fabricated placeholders.',
    },
    mistake: {
      mistake: 'Retrying every validation failure, including missing required values, with a generic "the output was invalid, please try again" until the validator passes.',
      whyTempting: 'Retries do fix many failures, so a uniform retry loop looks robust, and a passing validator looks like success.',
      howToRecognize: 'Retry counts spike on certain documents; the field that finally "passes" contains a placeholder or a value that appears nowhere in the source; costs rise with no accuracy gain.',
      fix: 'Classify each failure as present-but-wrong (retry with the specific error, capped) or absent (keep null, route). Send only retryable errors back, tell the model not to invent missing values, and detect placeholder strings in code.',
    },
    exercise: {
      prompt:
        'A remittance advice was extracted and validated. For each field, decide whether the problem can be fixed by retrying with the specific validation error, cannot be fixed by retry because the information is absent, or whether the extracted value is actually fine.',
      inputs: `Source document (remittance advice, OCR text):

\`\`\`text
KESTREL FOODS GMBH — ZAHLUNGSAVIS / REMITTANCE ADVICE
Datum: 12. Okt. 2026
An: Nordvik Industrial Supply AS
Wir haben folgende Rechnungen beglichen:
  NIS-24-07731      1.788,75
  NIS-24-07802      2.529,45
Gesamtbetrag:      EUR 4.318,20
Zahlungsart: SEPA-Überweisung
\`\`\`

Extracted record and validator messages:

\`\`\`json
{
  "remittance_date": "12. Okt. 2026",
  "invoices_paid": ["NIS-24-07731", "NIS-24-07802"],
  "amount_paid": 4.3182,
  "currency": "EUR",
  "po_reference": "PO-0000",
  "payer_vat_id": null,
  "discount_taken": null
}
\`\`\`

- remittance_date: not ISO 8601.
- amount_paid: 4.3182 does not equal the sum of listed amounts (4318.20).
- po_reference: matches placeholder pattern; client mapping requires a PO.
- payer_vat_id: client mapping requires a VAT ID; value is null.
- (no error) invoices_paid, discount_taken`,
      labels: ['Formatting error (retry can fix)', 'Absent in source (retry cannot fix)', 'Valid as extracted'],
      items: [
        { id: 'r1', text: '`remittance_date`: "12. Okt. 2026"', answer: 'Formatting error (retry can fix)', why: 'The date is printed; it only needs converting to 2026-10-12. A retry naming the ISO rule and the German month abbreviation will fix it.' },
        { id: 'r2', text: '`amount_paid`: 4.3182', answer: 'Formatting error (retry can fix)', why: 'The amount is present as "4.318,20"; the period was read as a decimal point. The arithmetic error plus a hint about German number format lets a retry return 4318.20.' },
        { id: 'r3', text: '`po_reference`: "PO-0000"', answer: 'Absent in source (retry cannot fix)', why: 'No PO reference is printed anywhere. "PO-0000" is a fabricated placeholder; set it to null and route per the client mapping. Retrying cannot produce a real PO.' },
        { id: 'r4', text: '`payer_vat_id`: null', answer: 'Absent in source (retry cannot fix)', why: 'No VAT ID appears on the advice. Null is the honest extraction; the client requirement must be met by review or master data, not by re-asking the model.' },
        { id: 'r5', text: '`invoices_paid`: ["NIS-24-07731", "NIS-24-07802"]', answer: 'Valid as extracted', why: 'Both invoice numbers are printed and correctly transcribed, and their amounts sum to the stated total.' },
        { id: 'r6', text: '`discount_taken`: null', answer: 'Valid as extracted', why: 'No discount line appears and the field is optional, so null correctly states absence. No validation rule is violated.' },
      ],
      solution: `Retry once with only the two retryable errors (remittance_date, amount_paid), naming the rule and the source convention: German date abbreviation and comma decimal separator. Both values are in the document, so a second look should repair them.

Do **not** include po_reference or payer_vat_id in the retry. Neither is printed, so a retry can only produce another invention. Replace "PO-0000" with null, flag the record for review, and record the reason ("client mapping requires PO and VAT ID; neither on document").

invoices_paid and discount_taken need nothing. Note that discount_taken being null is correct, not a failure: a nullable field is doing its job.`,
    },
    check: [
      {
        id: '4.4-k1',
        stem: 'An invoice prints "Invoice date: 03/11/2026" and the supplier is in Germany. The validator flags invoice_date "2026-03-11" as inconsistent with the due date "2026-12-03" and 30-day terms. What should the pipeline do?',
        options: [
          { id: 'a', text: 'Set invoice_date to null and route to review because the date is ambiguous.' },
          { id: 'b', text: 'Accept the record; the date is valid ISO 8601.' },
          { id: 'c', text: 'Retry with the specific error, noting the terms and the likely DD/MM/YYYY convention.' },
          { id: 'd', text: 'Retry with a generic "output invalid, try again" message.' },
        ],
        correct: 'c',
        why: 'The date is present in the source and was most likely misread as MM/DD. A specific error with the cross-field evidence gives the model what it needs to re-read it; a generic retry gives no direction.',
      },
      {
        id: '4.4-k2',
        stem: 'A client requires a cost-center code on every invoice. Many invoices do not print one. A retry loop re-asks the model up to three times and the field finally "passes" with values like "CC-000". What is the correct change?',
        options: [
          { id: 'a', text: 'Raise the retry limit to five so the model has more chances.' },
          { id: 'b', text: 'Stop retrying for this field when it is absent; keep null, detect placeholders, and route to review or a client default.' },
          { id: 'c', text: 'Add a few-shot example showing "CC-000" as an acceptable value.' },
          { id: 'd', text: 'Make the field a required non-null string so the model always fills it.' },
        ],
        correct: 'b',
        why: 'The information is absent from the source, so retries can only fabricate. Absence should be represented as null and handled by routing or a business rule.',
      },
      {
        id: '4.4-k3',
        stem: 'Some invoices print a total that differs from the sum of their lines because of a rounding or freight issue. The model silently outputs one number. Which schema addition best surfaces this?',
        options: [
          { id: 'a', text: 'A free-text "notes" field.' },
          { id: 'b', text: 'A self-reported confidence score for the total.' },
          { id: 'c', text: 'Removing the total field and computing it only in code.' },
          { id: 'd', text: 'stated_total, calculated_total, and conflict_detected fields.' },
        ],
        correct: 'd',
        why: 'Recording both the printed and computed totals with an explicit conflict flag makes the inconsistency visible and machine-routable instead of hiding it behind one number.',
      },
    ],
    review: [
      { front: 'When can a retry with the specific validation error fix an extraction?', back: 'When the correct value is in the source but was mis-formatted or misread (date style, decimal separator, wrong line).' },
      { front: 'When can a retry not fix it, and what do you do instead?', back: 'When the information is absent from the source (e.g. no PO printed). Keep null, detect placeholders, and route to review or a business rule.' },
      { front: 'What are stated_total, calculated_total, and conflict_detected for?', back: 'Self-correction fields: they make the model record both the printed and computed values and flag disagreement, so code can route conflicts.' },
    ],
    sources: ['guide-d4', 'api-implement-tool-use', 'guard-hallucinations', 'eval-tests', 'app-authored'],
  },

  // ---------------------------------------------------------------------------------------
  // 4.5
  // ---------------------------------------------------------------------------------------
  {
    id: '4.5',
    title: 'Batch processing and recovering failed items',
    outcome:
      'Given a workload, decide whether it belongs on the Message Batches API or synchronous calls, and recover a partially failed batch by resubmitting only the failed custom_ids after fixing their cause.',
    minutes: 25,
    terms: [
      { term: 'Message Batches API', definition: 'An asynchronous API that accepts many independent Messages requests in one batch, processes them at reduced cost, and returns results within a processing window (up to 24 hours).' },
      { term: 'custom_id', definition: 'A caller-chosen ID on each batch request. Results are matched to requests by custom_id, not by order.' },
      { term: 'Latency-tolerant workload', definition: 'Work whose result is not needed by a waiting user or blocking step, such as overnight backlogs or periodic re-scoring.' },
      { term: 'Result types', definition: 'Each batch result reports an outcome such as succeeded, errored, canceled, or expired.' },
    ],
    learningPoints: [
      'State the trade-off of the Message Batches API: substantially lower cost in exchange for asynchronous results with no latency guarantee.',
      'Match latency-tolerant workloads (nightly backlogs) to batches and blocking or interactive work to synchronous calls.',
      'Explain why multi-turn tool loops cannot run inside a single batch request.',
      'Use custom_id to join results to source records and to identify failed items.',
      'Recover a partial failure by fixing the cause and resubmitting only failed custom_ids.',
      'Refine and validate the prompt on a small sample before submitting the full volume.',
    ],
    concept: `Some work needs an answer now: a customer is waiting, or a merge gate is blocking. Other work just needs to be done by morning. The Message Batches API is built for the second kind. You submit many independent requests together, the API processes them asynchronously at **roughly half the cost** of standard calls, and you collect the results later. Most batches finish well within the window, but results can take **up to 24 hours** and there is **no latency guarantee**.

### Matching workload to API

- **Batch**: Ledgerline's nightly backlog of 40,000 invoices; re-classifying last quarter's documents after a schema change; generating evaluation outputs for a test set.
- **Synchronous**: an urgent single invoice a clerk is waiting on; a pre-merge check that blocks a pull request; anything in a live chat.

The deciding question is "is someone or something blocked waiting for this result?" If yes, the cost saving is not worth an unbounded wait.

### Each request stands alone

A batch request is one Messages call with one response. There is no client in the loop between turns, so a request **cannot run a multi-turn tool loop** (model calls tool, you run it, you return the result, model continues). Single-call tool use for structured output, such as a forced \`record_invoice\` tool, works fine. If a workflow needs several turns, either run it synchronously or run each turn as its own batch.

### custom_id and recovery

Every request carries a \`custom_id\` you choose (for example, the document ID). Results may not come back in submission order, so always join on \`custom_id\`. When the batch ends, some results may be \`errored\` or \`expired\`. Recovery is:

1. Collect the failed \`custom_id\`s and group by cause.
2. Fix the cause (for example, split oversized documents into chunks, or correct a malformed request).
3. Resubmit **only** those items, in a new batch or synchronously if urgent.

Never resubmit the whole batch: you pay again for work that succeeded.

### Refine before bulk

A prompt flaw multiplied across 40,000 documents is expensive. Run the prompt on a small, varied sample (synchronously or as a small batch), check the outputs against labels, fix the prompt, then submit the full volume.

### Terminology

- **custom_id**: your key for matching results.
- **Result type**: per-request outcome such as succeeded, errored, canceled, or expired.`,
    example: {
      intro:
        'Ledgerline submits its nightly invoice backlog as a batch. The artifacts show part of the request, part of the results file, and the recovery step.',
      artifacts: [
        {
          lang: 'json',
          caption: 'Batch creation body (two of 40,000 requests shown)',
          code: `{
  "requests": [
    {
      "custom_id": "inv-2026-11-19-000187",
      "params": {
        "model": "<model-id>",
        "max_tokens": 1024,
        "tools": [{ "name": "record_invoice", "description": "...", "input_schema": { "...": "..." } }],
        "tool_choice": { "type": "tool", "name": "record_invoice" },
        "messages": [{ "role": "user", "content": "<invoice 000187 text>" }]
      }
    },
    {
      "custom_id": "inv-2026-11-19-000188",
      "params": { "...": "same shape, invoice 000188" }
    }
  ]
}`,
        },
        {
          lang: 'json',
          caption: 'Results (one JSON object per line; order not guaranteed)',
          code: `{"custom_id":"inv-2026-11-19-000188","result":{"type":"succeeded","message":{"...":"..."}}}
{"custom_id":"inv-2026-11-19-000187","result":{"type":"succeeded","message":{"...":"..."}}}
{"custom_id":"inv-2026-11-19-031552","result":{"type":"errored","error":{"...":"request too large"}}}
{"custom_id":"inv-2026-11-19-031553","result":{"type":"expired"}}`,
        },
        {
          lang: 'ts',
          caption: 'Recovery: resubmit only failed custom_ids, after fixing the cause',
          code: `const failed = results.filter((r) => r.result.type !== 'succeeded');

const tooLarge = failed.filter((r) => isTooLarge(r));      // fix: chunk the document
const transient = failed.filter((r) => !isTooLarge(r));    // expired etc.: resubmit as-is

const retryRequests = [
  ...tooLarge.flatMap((r) => chunkDocument(r.custom_id).map((chunk, i) => ({
    custom_id: \`\${r.custom_id}-part\${i + 1}\`,
    params: buildParams(chunk),
  }))),
  ...transient.map((r) => ({ custom_id: r.custom_id, params: buildParams(load(r.custom_id)) })),
];

// Urgent items go synchronous; the rest go into a small follow-up batch.
await submitBatch(retryRequests.filter((q) => !isUrgent(q.custom_id)));`,
        },
      ],
      walkthrough: `The \`custom_id\` encodes the business key (date plus document sequence). Notice that results came back out of order (000188 before 000187), which is why the pipeline joins on \`custom_id\` instead of position.

Each request is a single call with a forced \`record_invoice\` tool. That is single-turn tool use for structured output, which works in a batch. A loop where the model calls a lookup tool and waits for its result could not run inside one batch request.

Two items failed for different reasons:

- **031552 errored** because the document was too large. Resubmitting unchanged would fail again, so the recovery step chunks it first and gives each chunk a derived \`custom_id\` (\`-part1\`, \`-part2\`) so the parts can be reassembled.
- **031553 expired** before processing finished. Nothing is wrong with the request, so it is resubmitted unchanged.

Only these items are resubmitted. The 39,998 successful results are kept. Before the first nightly run, the team ran the prompt on 200 varied invoices and fixed two field descriptions, which is far cheaper than discovering them after 40,000 calls.`,
    },
    compare: {
      question: 'Should this extraction workload use the Message Batches API or synchronous Messages calls?',
      a: {
        title: 'Message Batches API',
        body: 'Lower cost per request and high throughput without managing rate limits per call. Results arrive asynchronously, possibly many hours later.',
        chooseWhen: 'Nobody is waiting: nightly backlogs, reprocessing archives, evaluation runs, periodic re-scoring.',
      },
      b: {
        title: 'Synchronous Messages calls',
        body: 'Full price, but results return in seconds and you can run multi-turn tool loops with your code in the middle.',
        chooseWhen: 'A person or blocking step is waiting (urgent single documents, pre-merge checks, live chat), or the workflow needs multi-turn tool calling.',
      },
      decidingDetail:
        'Whether anything is blocked waiting for the result, and whether the work needs multiple turns. Batches trade an unbounded wait of up to 24 hours (no latency SLA) for lower cost and cannot run a tool loop inside one request; synchronous calls cost more but return immediately and support multi-turn tools.',
    },
    mistake: {
      mistake: 'Resubmitting the entire batch after a partial failure, or resubmitting failed items unchanged without looking at why they failed.',
      whyTempting: 'Re-running everything is simple and guarantees a complete result set; resubmitting failures unchanged works for transient problems, so it seems like a general fix.',
      howToRecognize: 'Costs roughly double on nights with failures; the same custom_ids fail again with the same error; duplicate records appear downstream because successful items were processed twice.',
      fix: 'Join results on custom_id, keep the successes, group failures by cause, fix deterministic causes (chunk oversized inputs, correct malformed requests), and resubmit only the failed custom_ids.',
    },
    exercise: {
      prompt: 'For each workload at Ledgerline, choose the API.',
      inputs: `Ledgerline facts:
- Nightly backlog of 30,000–50,000 documents must be done before 07:00; it is submitted at 19:00.
- Clerks sometimes upload a single urgent invoice and wait on screen for the result.
- A new "dispute triage" agent reads a document, calls a lookup_supplier tool, then decides on routing.
- The data science team re-scores 2 million archived documents after each schema change; no deadline.`,
      labels: ['Message Batches API', 'Synchronous API'],
      items: [
        { id: 'w1', text: 'The nightly backlog extraction (single forced-tool call per document).', answer: 'Message Batches API', why: 'Latency-tolerant and single-turn; the cost saving is large and the results are not needed until morning. Keep a fallback plan for the rare case where the batch has not ended by the deadline.' },
        { id: 'w2', text: 'A clerk’s urgent single invoice.', answer: 'Synchronous API', why: 'A person is waiting; a batch has no latency guarantee.' },
        { id: 'w3', text: 'Dispute triage that calls lookup_supplier and then continues reasoning with the result.', answer: 'Synchronous API', why: 'It needs a multi-turn tool loop with your code running the tool between turns, which a single batch request cannot do.' },
        { id: 'w4', text: 'Re-scoring 2 million archived documents after a schema change.', answer: 'Message Batches API', why: 'High volume, no deadline, independent single-call requests: an ideal batch workload, ideally after validating the new prompt on a sample.' },
        { id: 'w5', text: 'Reprocessing the 37 items whose custom_ids errored last night, none of them urgent, after chunking the oversized ones.', answer: 'Message Batches API', why: 'Still latency-tolerant; resubmit only the failed custom_ids in a small follow-up batch (or synchronously if any become urgent).' },
      ],
      solution: `Batches suit w1, w4, and w5: independent single-call requests where nobody is blocked. Synchronous calls suit w2 (someone is waiting) and w3 (needs a multi-turn tool loop).

For w1, note the deadline. Submitting at 19:00 leaves 12 hours, and batches usually finish well within that, but there is no SLA. A robust design monitors the batch and falls back to synchronous processing for anything urgent that is still pending close to the deadline.`,
    },
    check: [
      {
        id: '4.5-k1',
        stem: 'A CI job that blocks merging until Claude reviews the diff is moved to the Message Batches API to save cost. What is the main problem?',
        options: [
          { id: 'a', text: 'Batch requests cannot include a system prompt.' },
          { id: 'b', text: 'Batches have no latency guarantee and can take up to 24 hours, so merges could be blocked for hours.' },
          { id: 'c', text: 'Batch results are returned in submission order, which breaks matching.' },
          { id: 'd', text: 'Batches cost more than synchronous calls for small requests.' },
        ],
        correct: 'b',
        why: 'A blocking pre-merge check needs a prompt answer. Batch processing is asynchronous with no latency SLA, so it fits overnight or backlog work, not gates that developers wait on.',
      },
      {
        id: '4.5-k2',
        stem: 'A 20,000-request batch ends with 19,940 succeeded and 60 errored, all with "input too large". What is the best recovery?',
        options: [
          { id: 'a', text: 'Resubmit the entire batch with a larger max_tokens.' },
          { id: 'b', text: 'Resubmit the 60 failed requests unchanged in a new batch.' },
          { id: 'c', text: 'Split the 60 oversized documents into chunks and resubmit only those, keyed by derived custom_ids.' },
          { id: 'd', text: 'Discard the 60 documents and report the batch as complete.' },
        ],
        correct: 'c',
        why: 'The cause is deterministic, so unchanged resubmission would fail again, and resubmitting everything repays for 19,940 successes. Fix the cause and resubmit only the failed custom_ids.',
      },
      {
        id: '4.5-k3',
        stem: 'A team is about to batch 500,000 contracts with a newly written extraction prompt. What should they do first?',
        options: [
          { id: 'a', text: 'Run the prompt on a small, varied sample, check the outputs against labels, and refine it before the full submission.' },
          { id: 'b', text: 'Submit all 500,000 at once to finish fastest and fix issues in a second full run.' },
          { id: 'c', text: 'Switch to synchronous calls for the full volume so errors appear immediately.' },
          { id: 'd', text: 'Use sequential numbers as custom_ids so results can be matched by position.' },
        ],
        correct: 'a',
        why: 'A prompt flaw multiplied across the full volume is expensive to repeat. Validating on a representative sample first catches errors cheaply.',
      },
    ],
    review: [
      { front: 'Message Batches API trade-off in one line?', back: 'Roughly half the cost, but asynchronous: results within up to 24 hours with no latency SLA.' },
      { front: 'Why can’t a batch request run an agentic tool loop?', back: 'Each request is a single call with one response; there is no client step between turns to run the tool and return its result.' },
      { front: 'How do you recover a partially failed batch?', back: 'Join results on custom_id, fix the failure cause, and resubmit only the failed custom_ids.' },
    ],
    sources: ['guide-d4', 'api-batch', 'eval-tests', 'app-authored'],
    notes: [
      {
        date: NOTE_DATE,
        text: 'Batch limits and details are version-sensitive: discount size, maximum requests and bytes per batch, allowed custom_id characters and length, how long results remain downloadable, and which features (for example, prompt caching) combine with batches. Verify against the current Message Batches API docs.',
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  // 4.6
  // ---------------------------------------------------------------------------------------
  {
    id: '4.6',
    title: 'Multi-instance and multi-pass review',
    outcome:
      'Given a review pipeline, decide when to use an independent reviewer instance instead of self-review, how to split a large change into per-file and cross-file passes, and how to route findings using a verification pass whose confidence has been calibrated.',
    minutes: 25,
    terms: [
      { term: 'Self-review', definition: 'Asking the same conversation that produced output to check it. It still holds its own earlier reasoning and tends to confirm it.' },
      { term: 'Independent review instance', definition: 'A separate model call or session that sees the output and criteria but not the generator’s reasoning.' },
      { term: 'Local pass', definition: 'A review pass over one file or unit, focused on issues visible within it.' },
      { term: 'Integration pass', definition: 'A separate pass over cross-file concerns: interfaces, contracts, data flow between components.' },
      { term: 'Verification pass', definition: 'A follow-up pass that re-checks each candidate finding against the source and records a verdict and confidence used for routing.' },
    ],
    learningPoints: [
      'Explain why self-review in the same context is weak: the generator’s reasoning is still in context and biases it toward agreement.',
      'Use an independent instance, given only the artifact and the criteria, to review generated work.',
      'Split large reviews into per-file local passes plus a separate cross-file integration pass to avoid attention dilution.',
      'Add a verification pass that checks each candidate finding against the code before it is posted.',
      'Route findings by verification confidence only after calibrating that confidence against labeled outcomes.',
      'Pass prior findings to re-runs so they report only new or unresolved issues.',
    ],
    concept: `People are poor proofreaders of their own writing because they read what they meant, not what they wrote. A model reviewing its own work in the **same conversation** has the same problem, more strongly: its earlier reasoning ("I used a map here because keys are unique") is still in context, and it tends to agree with it. Self-review catches some typos, but it is a weak check on the decisions themselves.

### Independent instances

An **independent reviewer** is a separate call or session given only what a reviewer should see: the diff or document, the requirements, and the review criteria. It has not seen the generator's reasoning, so it has to evaluate the output on its own merits. In a CI pipeline this means the job that reviews a PR should not be the session that wrote the code.

### Multiple passes for large changes

One prompt containing 40 changed files asks the model to hold everything at once. Attention is spread thin: obvious issues in file 31 get missed, and findings become shallow. Split the work:

1. **Per-file local passes**: one pass per file (these can run in parallel), focused on bugs visible within that file.
2. **A cross-file integration pass**: given summaries of each file's interfaces and changes, look for problems *between* files, such as a renamed field still read under the old name elsewhere, or a changed function signature with stale callers.

Local passes are good at depth; the integration pass is good at connections. Neither replaces the other.

### Verification and routing

A **verification pass** re-checks each candidate finding against the code: is the line real, does the claimed failure actually occur, is it inside the criteria (lesson 4.1)? It can output a verdict and a confidence. Use that confidence to **route**: high, post automatically; middle, send to a human; low, drop. Self-reported confidence is not automatically meaningful, so set thresholds by comparing it to labeled outcomes on a sample, and re-check the calibration over time.

On re-runs, pass the previous findings in so the reviewer reports only new or unresolved issues instead of repeating itself.

### Terminology

- **Self-review**: same context checks its own output.
- **Independent instance**: fresh context, only artifact plus criteria.
- **Attention dilution**: quality loss when one pass covers too much.`,
    example: {
      intro:
        'Quarry Labs reviews large pull requests in CI. The pipeline below replaces a single "review all 38 files" call made by the same session that generated the code.',
      artifacts: [
        {
          lang: 'yaml',
          caption: 'Review pipeline configuration (app-authored, illustrative)',
          code: `review:
  reviewer: independent          # new session; never the session that wrote the code
  reviewer_inputs: [diff, requirements.md, review-criteria.md, prior_findings.json]
  passes:
    - name: local
      unit: file                  # one call per changed file, run in parallel
      focus: [security, correctness, resource]
    - name: integration
      input: per_file_summaries   # exported/changed symbols, signatures, schemas
      focus: [interface-mismatch, stale-callers, contract-changes]
    - name: verify
      input: candidate_findings
      output: [verdict, confidence, evidence_line]
  routing:                        # thresholds set from a labeled sample of 300 findings
    post_automatically: "verdict == confirmed and confidence >= 0.85"
    human_review:       "verdict == confirmed and 0.5 <= confidence < 0.85"
    drop:               "verdict == rejected or confidence < 0.5"`,
        },
        {
          lang: 'json',
          caption: 'Verification output for three candidate findings',
          code: `[
  { "id": "f1", "file": "api/orders.ts", "pass": "local",
    "claim": "sort param interpolated into SQL",
    "verdict": "confirmed", "confidence": 0.93, "evidence_line": 142 },
  { "id": "f2", "file": "web/OrderTable.tsx", "pass": "integration",
    "claim": "reads order.totalCents; API renamed it to amount_minor in this PR",
    "verdict": "confirmed", "confidence": 0.71, "evidence_line": 58 },
  { "id": "f3", "file": "api/orders.ts", "pass": "local",
    "claim": "possible null dereference of customer",
    "verdict": "rejected", "confidence": 0.88,
    "evidence_line": 120, "note": "customer is checked on line 117" }
]`,
        },
      ],
      walkthrough: `Start with the reviewer. It is a fresh session given the diff, requirements, criteria, and previous findings, not the transcript of the session that wrote the code. It has no stake in the original choices.

The **local passes** run one per file. f1 (SQL injection in \`api/orders.ts\`) is visible within one file, and a focused pass finds it reliably.

f2 is visible only **across** files: the API renamed a field and the web component still reads the old name. No single-file pass would flag it, because each file is internally consistent. The integration pass, working from per-file summaries of changed interfaces, catches it.

The **verification pass** re-reads the code for each candidate. f3 is rejected because the null case is handled three lines earlier, so a false positive never reaches developers. f1 is confirmed with high confidence and posted. f2 is confirmed at 0.71, so it goes to a human.

The thresholds (0.85 and 0.5) were not guessed. The team labeled 300 past findings and chose thresholds where the confirmed-and-high bucket was correct at the rate they needed. That calibration is what makes the confidence usable for routing.`,
    },
    compare: {
      question: 'For a 38-file pull request, should review run as one pass over all files or as per-file passes plus an integration pass?',
      a: {
        title: 'One pass over the whole diff',
        body: 'One call, one context, lowest orchestration effort. Can see cross-file relationships directly, if it can attend to everything.',
        chooseWhen: 'The change is small (a few short files) so the whole diff fits comfortably and attention is not spread thin.',
      },
      b: {
        title: 'Per-file local passes plus a cross-file integration pass',
        body: 'Each file gets focused attention; a separate pass checks interfaces and data flow between files using summaries. More calls, but deeper and more consistent findings.',
        chooseWhen: 'The change spans many files or large files, where a single pass misses issues and produces shallow findings.',
      },
      decidingDetail:
        'The size and spread of the change. When many files compete for attention in one context, findings get shallow and inconsistent; splitting into local passes restores depth, and a dedicated integration pass covers the cross-file issues local passes cannot see.',
    },
    mistake: {
      mistake: 'Adding a "now review your work carefully" step at the end of the same session that generated the code and treating it as the quality gate.',
      whyTempting: 'It is one extra prompt, needs no new infrastructure, and the model often finds a few small issues, which looks like it works.',
      howToRecognize: 'The self-review approves the design choices it made earlier with reasoning that echoes its own; independent reviewers or humans later find substantive issues it waved through.',
      fix: 'Run review in an independent instance that receives only the artifact, requirements, and criteria. For large changes, split into local and integration passes, verify candidate findings, and route by calibrated confidence.',
    },
    exercise: {
      prompt: 'Each issue below was found during review of a 25-file pull request. Which pass is designed to catch it?',
      inputs: `Pipeline: per-file local passes (each sees one file's diff and full content) and one integration pass (sees per-file summaries of exported symbols, signatures, schemas, and config keys).`,
      labels: ['Per-file local pass', 'Cross-file integration pass'],
      items: [
        { id: 'p1', text: 'A function in `billing/tax.ts` divides by `rate` without handling `rate === 0`.', answer: 'Per-file local pass', why: 'The bug and its trigger are both visible within one file.' },
        { id: 'p2', text: '`createInvoice()` gained a required `currency` parameter, but `jobs/backfill.py` calls the HTTP endpoint without it.', answer: 'Cross-file integration pass', why: 'Each file is consistent on its own; the problem is the mismatch between a changed contract and a caller elsewhere.' },
        { id: 'p3', text: 'A database connection in `db/pool.ts` is not released when the query throws.', answer: 'Per-file local pass', why: 'A resource leak on an error path inside one file.' },
        { id: 'p4', text: 'A config key was renamed from `RETRY_LIMIT` to `MAX_RETRIES` in `config.ts`; `worker/queue.ts` still reads the old name.', answer: 'Cross-file integration pass', why: 'It is only detectable by connecting a change in one file to a reader in another.' },
        { id: 'p5', text: 'User input is written into an HTML string with no escaping in `web/Comment.tsx`.', answer: 'Per-file local pass', why: 'Source and sink are in the same component, so a focused single-file pass sees it.' },
      ],
      solution: `Local passes catch p1, p3, and p5: bugs whose cause and effect are inside one file. The integration pass catches p2 and p4: contract and naming changes whose breakage appears only when two files are compared.

This is why one approach does not replace the other. A pass that sees only one file cannot see stale callers, and a single giant pass over 25 files tends to miss the in-file details.`,
    },
    check: [
      {
        id: '4.6-k1',
        stem: 'An agent writes a migration script, then in the same conversation is asked to review it. The review approves it; a later human review finds a missed edge case. What change most improves the review?',
        options: [
          { id: 'a', text: 'Ask the same conversation to review twice.' },
          { id: 'b', text: 'Ask the same conversation to rate its own confidence and review again if below 0.8.' },
          { id: 'c', text: 'Run the review in a separate instance given only the script, the requirements, and the criteria.' },
          { id: 'd', text: 'Increase the max_tokens of the review step.' },
        ],
        correct: 'c',
        why: 'The generating context still holds its own reasoning and tends to confirm it. An independent instance has to judge the script on its merits.',
      },
      {
        id: '4.6-k2',
        stem: 'A single review call over a 45-file PR returns shallow findings and misses an obvious bug in one file. Which design best addresses this?',
        options: [
          { id: 'a', text: 'Per-file local passes plus a separate cross-file integration pass.' },
          { id: 'b', text: 'Repeat the single call three times and merge findings.' },
          { id: 'c', text: 'Add "review every file thoroughly" to the prompt.' },
          { id: 'd', text: 'Review only the five largest files.' },
        ],
        correct: 'a',
        why: 'Attention is diluted across 45 files. Local passes give each file focused attention, and the integration pass keeps coverage of issues between files.',
      },
      {
        id: '4.6-k3',
        stem: 'A verification pass outputs a confidence for each finding. The team wants to auto-post high-confidence findings. What must happen first?',
        options: [
          { id: 'a', text: 'Nothing; model confidence above 0.9 can be trusted as is.' },
          { id: 'b', text: 'Ask the model to be more careful when assigning confidence.' },
          { id: 'c', text: 'Use the confidence only for sorting, never for routing.' },
          { id: 'd', text: 'Compare the confidence to labeled outcomes on a sample and set thresholds where accuracy meets the target.' },
        ],
        correct: 'd',
        why: 'Self-reported confidence is not guaranteed to match accuracy. Calibrating against labeled outcomes turns it into a usable routing signal.',
      },
    ],
    review: [
      { front: 'Why is same-session self-review weak?', back: 'The session still holds its own reasoning and tends to agree with it. Use an independent instance given only the artifact and criteria.' },
      { front: 'What do local and integration passes each catch?', back: 'Local: issues inside one file. Integration: mismatches between files, such as changed signatures with stale callers or renamed fields.' },
      { front: 'When can a verification pass’s confidence drive routing?', back: 'After it has been calibrated against labeled outcomes so that thresholds correspond to observed accuracy.' },
    ],
    sources: ['guide-d4', 'cc-headless', 'eng-building-agents', 'eval-tests', 'app-authored'],
  },
];
