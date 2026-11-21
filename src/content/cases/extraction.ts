import type { CaseStudy } from '../types';

export const caseStudy: CaseStudy = {
  scenario: 'extraction',
  title: 'Onboarding a wholesale client without paying for wrong-but-valid records',
  brief:
    'Ledgerline has signed Harrowgate Wholesale, a regional food distributor, as an accounts-payable client. Harrowgate sends about 30,000 documents a night: typed supplier invoices (about 80%), credit notes, supplier contracts, and handwritten remittance advices from small grocers (about 6%). ' +
    'About 11% of invoices are for utilities and ad hoc services and carry no purchase-order number. During the day, Harrowgate’s treasury team uploads a few hundred urgent invoices for same-day payment runs and waits on screen for results.\n\n' +
    'The pilot pipeline forces an `extract_invoice` tool whose schema makes `po_number` a required string, checks records only against the JSON schema, sends every request synchronously, and puts 100% of records through human review. ' +
    'The pilot audit found PO numbers invented for PO-less invoices, a handful of totals that did not add up, and reviewers spending most of their time on records that were already correct. ' +
    'Harrowgate’s contract caps review headcount from month three, so Ledgerline must reduce review without letting wrong-but-valid records into the ERP. You are the architect deciding how the production pipeline works.',
  constraints: [
    'A wrong value that passes validation costs far more than a field left for review: each wrong posting takes about two hours to trace and reverse in Harrowgate’s ERP.',
    'Overnight documents must reach the ERP within 36 hours of arrival; treasury uploads need a result in under a minute.',
    'Harrowgate’s ERP accepts a null `po_number` and routes PO-less bills to a separate non-PO approval path.',
    'From month three, the review budget covers roughly 15% of records.',
    'Model spend for the account must come in at roughly half of the pilot’s per-document cost.',
    'Ledgerline has a labelled set of 2,000 Harrowgate documents from the pilot, tagged by document type.',
  ],
  decisions: [
    {
      id: 'd1',
      prompt:
        'The pilot invented PO numbers for PO-less invoices, for example returning the invoice number or "PO-000000" in `po_number`. Every fabricated value passed schema validation. How do you change the schema?',
      options: [
        {
          id: 'a',
          text: 'Keep `po_number` required and add a regex pattern matching Harrowgate’s PO format.',
          consequence: 'Fabrications shift to PO-shaped strings that pass the pattern; "PO-000000" already matches. The ERP keeps matching some PO-less bills to unrelated open POs.',
        },
        {
          id: 'b',
          text: 'Make `po_number` nullable, describe null as "no PO number appears in the document", and let null-PO bills follow the ERP’s non-PO approval path.',
          consequence: 'The model can report absence truthfully, so PO-less invoices arrive with null and are routed to the right approval path; fabricated PO numbers largely disappear.',
        },
        {
          id: 'c',
          text: 'Keep the field required and retry extraction with a validation error whenever the PO number looks suspicious.',
          consequence: 'For PO-less invoices there is nothing to find, so each retry produces another invented value at extra cost until one looks plausible enough to pass.',
        },
        {
          id: 'd',
          text: 'Remove `po_number` from the schema and have reviewers enter PO numbers manually.',
          consequence: 'Reviewers re-key a value the model extracts correctly on 89% of invoices, consuming review budget that is about to be capped.',
        },
      ],
      best: 'b',
      walkthrough:
        'A required string field forces the model to produce something even when the value is absent, and schema validation cannot tell an invented PO from a real one. The root cause is the schema giving the model no truthful way to say "not present". ' +
        'Making the field nullable, with an explicit meaning for null, removes that pressure, and Harrowgate’s ERP already has a path for PO-less bills. A regex only reshapes fabrications, and retries cannot recover information that is not in the document. Removing the field throws away value on the 89% of invoices that do carry a PO.',
    },
    {
      id: 'd2',
      prompt:
        'Semantic validation now runs after extraction (dates in ISO 8601, line items summing to the printed subtotal, checksums on tax IDs). Last night 1,900 records failed. What retry policy do you adopt?',
      options: [
        {
          id: 'a',
          text: 'Retry every failed record up to three times with "The output was invalid; try again", then send it to review.',
          consequence: 'Format errors are sometimes fixed by luck, but absent-information failures generate fabrications that eventually pass, and spend rises with up to three blind retries per failure.',
        },
        {
          id: 'b',
          text: 'Send every failed record straight to review with no retries, to avoid any risk of the model forcing values.',
          consequence: 'Safe, but reviewers spend scarce time reformatting dates and fixing misreads the model could have corrected automatically, blowing the 15% review budget.',
        },
        {
          id: 'c',
          text: 'Retry once, with the document, the prior JSON, and the specific error, only for failures whose value is present in the source (format errors, sum mismatches on legible scans); route absent or source-wrong values to review.',
          consequence: 'Most format and misread failures are fixed automatically on the first retry, while absent values and printed errors go to reviewers instead of being fabricated.',
        },
        {
          id: 'd',
          text: 'Tell the model to adjust line items or totals as needed so that the record passes validation, then post it.',
          consequence: 'Records pass validation with altered amounts, hiding both misreads and genuine supplier arithmetic errors, which is exactly the wrong-but-valid outcome the constraints forbid.',
        },
      ],
      best: 'c',
      walkthrough:
        'Retries help when the correct information is in the document and the model mis-formatted or misread it; they do not help when the value is absent, and they are dangerous when the source itself is wrong. ' +
        'A targeted retry carries the source pages, the prior output, and the exact validator message ("line items sum 1,140.00 ≠ printed subtotal 1,190.00, page 2"), and is capped so failures do not loop. ' +
        'Everything else goes to a reviewer with the reason attached. Blind retries waste spend and invite fabrication, no retries waste the review budget, and telling the model to make numbers agree hides supplier errors.',
    },
    {
      id: 'd3',
      prompt:
        'You must halve model spend while meeting both deadlines. In a test run, 220 overnight requests failed because scanned contracts of 400+ pages exceeded the context window, and 15 requests expired. How do you process and recover documents?',
      options: [
        {
          id: 'a',
          text: 'Send overnight documents in rolling Message Batches keyed by document ID as `custom_id`, process treasury uploads synchronously, and resubmit only failed IDs, chunking oversized contracts into page ranges.',
          consequence: 'Batch pricing cuts overnight spend roughly in half within the 36-hour window, treasury keeps sub-minute results, and recovery touches only the 235 failed documents, with chunked contracts reassembled by derived IDs.',
        },
        {
          id: 'b',
          text: 'Send everything, including treasury uploads, through Message Batches, and resubmit the whole batch whenever any requests fail.',
          consequence: 'Treasury uploads sometimes wait far longer than a minute, missing payment runs, and resubmitting entire batches pays twice for thousands of good results while the oversized contracts fail again.',
        },
        {
          id: 'c',
          text: 'Keep everything synchronous as in the pilot, but raise concurrency and retry failed requests immediately.',
          consequence: 'Both deadlines are met but spend stays at the pilot’s level, and oversized contracts fail on every immediate retry.',
        },
      ],
      best: 'a',
      walkthrough:
        'Message Batches costs about half as much and returns results within 24 hours with no latency guarantee, which fits a 36-hour overnight deadline but not a clerk waiting on screen. ' +
        'Splitting by latency requirement meets both deadlines and the spend target. Recovery joins results on `custom_id` (results are not guaranteed to come back in order), resubmits only failed requests, and fixes the cause first: oversized contracts are split into page-range chunks whose derived IDs let results be merged per document. Expired requests can be resubmitted unchanged.',
    },
    {
      id: 'd4',
      prompt:
        'By month three, overall field accuracy on the labelled set is 97%. Leadership proposes cutting review to a uniform 10% random sample to fit the budget. What do you do before reducing review?',
      options: [
        {
          id: 'a',
          text: 'Adopt the uniform 10% random sample immediately, since 97% overall accuracy is comfortably high.',
          consequence: 'If handwritten remittances run far below the aggregate, as pilot reviewers suspected, 90% of their errors go unreviewed and wrong payments follow.',
        },
        {
          id: 'b',
          text: 'Route records to review using the model’s self-reported confidence, skipping review whenever every field is above 0.9.',
          consequence: 'Uncalibrated scores let confidently wrong fields skip review, and nothing shows whether 0.9 means the same thing on typed invoices and handwritten remittances.',
        },
        {
          id: 'c',
          text: 'Keep 100% review and ask Harrowgate to raise the review budget until accuracy reaches 99% overall.',
          consequence: 'The contract’s headcount cap is breached, and even 99% overall could still hide a weak small segment.',
        },
        {
          id: 'd',
          text: 'Measure accuracy per document type and payment-critical field on stratified samples, cut review only for segments that meet target, and keep a stratified audit sample running afterwards.',
          consequence: 'Typed invoices, which meet target, drop to light audit and free most of the budget; handwritten remittances, measured at about 70%, keep full review; ongoing stratified audits catch drift from new templates.',
        },
      ],
      best: 'd',
      walkthrough:
        'Aggregate accuracy is dominated by the largest segment: typed invoices are about 80% of volume, so a weak 6% remittance segment barely moves the 97% figure. ' +
        'Stratified sampling estimates each document type and critical field (amount, IBAN, invoice reference) reliably, and review is reduced only where accuracy is proven. ' +
        'Self-reported confidence can join the routing later, once it has been calibrated against the labelled set per field and segment. An ongoing stratified audit protects the reduction against new supplier templates.',
    },
  ],
  wrapUp:
    'The production pipeline treats schemas as a guarantee of shape, not of truth. Fields that can be absent are nullable, so the model is never pushed to invent values. Semantic validation catches what schemas cannot, and retries are reserved for errors where the answer is actually in the document. ' +
    'Processing mode follows latency needs: batches for the overnight backlog, synchronous calls for treasury, and recovery by `custom_id` after fixing the cause. ' +
    'Finally, human review is reduced segment by segment on stratified evidence, not on an aggregate number, and stays monitored afterwards. Each decision applies the same principle: a field left for review costs less than a wrong value that looks valid.',
  lessons: ['4.3', '4.4', '4.5', '5.5'],
};
