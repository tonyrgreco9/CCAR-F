import type { CaseStudy } from '../types';

// Guided case study for the support scenario. Original content.

export const caseStudy: CaseStudy = {
  scenario: 'support',
  title: 'Lumen Mobile: the billing-migration weekend',
  brief: `Lumen Mobile's support resolution agent, built on the Claude Agent SDK, has run in production for three months. It resolves billing, plan, and account problems in chat using \`get_customer\`, \`lookup_invoice\`, \`lookup_transaction\`, \`issue_refund\`, \`change_plan\`, \`apply_credit\`, and \`escalate_to_human\`.

This weekend, Lumen migrated part of its billing to a new payments gateway. On Monday the support lead reports four problems:

- Refund calls to the old billing service are timing out under load, and finance found a handful of double refunds.
- An audit found plan changes made on accounts whose \`get_customer\` result said \`unverified\`; the verification rule currently lives only in the system prompt.
- Human agents say escalated tickets arrive with free-text summaries, so they re-read whole transcripts and sometimes repeat refunds the agent already issued.
- In long chats, the agent has quoted wrong amounts and invoice numbers after its older turns were summarized.

You are the architect asked to fix these without lowering first-contact resolution.`,
  constraints: [
    'Policy requires identity verification before any account change, with no exceptions.',
    'Agent-issued refunds and credits are capped at $150 per case, combined; anything above goes to a human.',
    'The old billing service records every refund under a transaction reference, and lookup_transaction returns its final status within seconds. Its issue_refund endpoint has no idempotency protection.',
    'The old billing service is owned by another team and cannot be changed this quarter.',
    'The team tracks first-contact resolution, wrongful refunds, and customer satisfaction, and does not want to push routine cases to the human queue.',
  ],
  decisions: [
    {
      id: 'd1',
      prompt: `A verified customer is owed $47.10 for a duplicate charge. The agent's \`issue_refund\` call times out before confirmation, and the tool returns \`isError: true\`, \`errorCategory: "timeout"\`, and the transaction reference \`RF-30418\`. What should the agent's recovery behaviour be?`,
      options: [
        {
          id: 'a',
          text: 'Retry issue_refund automatically up to three times with exponential backoff, since the timeout most likely came from migration load.',
          consequence: 'If the first call actually succeeded, each retry creates another refund, because the endpoint has no idempotency protection. This is exactly how the double refunds finance found arise.',
        },
        {
          id: 'b',
          text: 'Check RF-30418 with lookup_transaction, confirm the refund if it is recorded, and retry only if no refund exists.',
          consequence: 'The unknown outcome becomes known within seconds. The customer gets a correct answer in the same chat, and a retry happens only when it cannot double-pay.',
        },
        {
          id: 'c',
          text: 'Escalate every refund timeout to a human with the transaction reference attached, so the agent never touches an unconfirmed refund.',
          consequence: 'No double refunds, but routine refunds pile up in the human queue during the migration load, and first-contact resolution drops for cases the agent could close itself.',
        },
        {
          id: 'd',
          text: 'Tell the customer the refund did not go through, log the timeout under RF-30418, and ask them to return once the gateway is stable.',
          consequence: 'The customer may be told a successful refund failed; when they return, a second refund could be issued, and satisfaction suffers either way.',
        },
      ],
      best: 'b',
      walkthrough: `The deciding facts are in the constraints: the endpoint is **not idempotent**, but every refund is recorded under a **transaction reference** and \`lookup_transaction\` reports its **final status** quickly. A timeout before confirmation means the outcome is unknown, not failed. Blind retries risk double payment; escalation is safe but gives up resolution the agent can achieve; telling the customer it failed may be false.

Checking status by reference first resolves the uncertainty. Note how the answer would change if the endpoint guaranteed at most one refund per idempotency key and no status lookup existed: then a retry with the **same** key would be the right move. Make sure the tool's error result carries the reference, because that is what makes this recovery possible.`,
    },
    {
      id: 'd2',
      prompt: `How should the team stop plan changes, refunds, and credits on unverified accounts, given that the rule currently lives only in the system prompt?`,
      options: [
        {
          id: 'a',
          text: 'Strengthen the system prompt: move the rule to the top in capitals and add few-shot examples of refusing insistent customers.',
          consequence: 'Violations fall but do not stop, because prompt rules are followed probabilistically; insistent customers will still occasionally get changes made on unverified accounts.',
        },
        {
          id: 'b',
          text: 'Add a required identity_verified boolean to issue_refund, apply_credit, and change_plan, and reject any call where the model sets it to false.',
          consequence: 'The gate checks a value the model writes. When a customer claims to have verified elsewhere, the model can set the flag to true and the gate passes.',
        },
        {
          id: 'c',
          text: 'Add a PreToolUse hook on account-changing tools that checks the verification status recorded by application code from get_customer.',
          consequence: 'Every account-changing call is checked deterministically against authoritative state the model cannot alter, while verified customers continue to be served end to end.',
        },
      ],
      best: 'c',
      walkthrough: `A rule with **no exceptions** needs **deterministic** enforcement. Prompt wording, however strong, is probabilistic, and the audit shows it fails under customer pressure.

A hook alone is not enough if it trusts the wrong data: a model-supplied \`identity_verified\` flag moves the judgment back to the model. The hook must check state recorded by application code from the \`get_customer\` result for the same customer ID that the tool call targets. The same \`PreToolUse\` hook is also a natural place to keep the per-case running payout total so the $150 combined cap is enforced before money moves.`,
    },
    {
      id: 'd3',
      prompt: `A case now needs a human: the customer's refunds would total $210, above the $150 cap. The agent has already issued a $95 refund (reference RF-30502). What should the escalation carry?`,
      options: [
        {
          id: 'a',
          text: 'A free-text summary written by the agent, as today, but with a prompt checklist telling it to mention amounts, references, and the reason.',
          consequence: 'Summaries stay inconsistent; some will omit the $95 refund or its reference, and humans will keep re-reading transcripts and occasionally repeat refunds.',
        },
        {
          id: 'b',
          text: 'Structured fields: customer ID and verification status, actions taken (RF-30502, $95), the reason (cap exceeded), and the decision needed.',
          consequence: 'The human sees who the customer is, what money has moved, and what to decide, so they can act without re-reading the chat or re-asking the customer, and duplicate refunds stop.',
        },
        {
          id: 'c',
          text: 'The full transcript, so nothing is lost to summarization, plus the agent\'s self-rated confidence and a customer sentiment score for triage.',
          consequence: 'The human has all the raw text but still has to dig out what was done; the confidence and sentiment numbers do not tell them what money has already moved.',
        },
      ],
      best: 'b',
      walkthrough: `The reported problems are **re-reading transcripts** and **repeated refunds**. A structured handoff answers the human's first questions directly: who is this, are they verified, what has already been done (with amounts and references), why is it escalated, and what decision is needed.

Free text leaves completeness to chance. A raw transcript is the thing humans already wade through, and self-rated confidence or sentiment do not identify prior actions. If a case involved a legal threat, attaching the transcript *alongside* the structured fields would make sense, but it does not replace them.`,
    },
    {
      id: 'd4',
      prompt: `In a 65-turn conversation, after older turns were summarized, the agent quoted a refund of "about $47" (it was $47.10) and the wrong invoice number, and asked an already-verified customer to verify again. What should change?`,
      options: [
        {
          id: 'a',
          text: 'Summarize more often, so each summary covers fewer turns and the amounts and invoice numbers from recent turns are compressed less.',
          consequence: 'Exact values pass through more compression steps and can drift further; the underlying loss of amounts and IDs continues.',
        },
        {
          id: 'b',
          text: 'Keep a case-facts block (customer and invoice IDs, verification status, amounts, references) outside the summarized history, sent each turn.',
          consequence: 'Critical values stay exact however long the chat runs, the agent stops re-asking for verification, and summarization can still compress the conversational filler.',
        },
        {
          id: 'c',
          text: 'Switch to a model with a larger context window and stop summarizing, so the agent always sees the original turns with their exact values.',
          consequence: 'Fewer summaries for a while, but long chats still eventually need compression, cost rises, and key facts can still be lost in the middle of a very long context.',
        },
        {
          id: 'd',
          text: 'Have the agent ask the customer to restate amounts and invoice numbers whenever it needs them late in a chat, rather than trusting a summary.',
          consequence: 'Customers repeat themselves more, satisfaction drops, and the agent still confidently quotes wrong values when it does not realise it is unsure.',
        },
      ],
      best: 'b',
      walkthrough: `Progressive summarization is **lossy for exact values**: amounts get rounded, IDs get transposed, and state such as "verified at turn 6" disappears. The fix is to keep those facts in a **structured block outside the summarized history** that is sent with every request.

More frequent summaries add more lossy steps. A larger window postpones the problem and does not remove lost-in-the-middle effects. Asking the customer again hurts satisfaction and does not catch confident errors. Trimming verbose tool results to the fields the agent uses also helps keep the case-facts block and recent turns prominent.`,
    },
  ],
  wrapUp: `The four fixes share a theme: put guarantees where they can actually be guaranteed.

- **Recovery from uncertain tool outcomes** depends on the tool's contract. With no idempotency but a status lookup by reference, look up before retrying; with a same-key idempotency guarantee and no lookup, retry with the same key.
- **Rules that must always hold** go into deterministic code, such as a \`PreToolUse\` hook, and that code must check authoritative state, not values the model writes.
- **Handoffs** should be structured so humans can act without reconstructing the case, including every action already taken.
- **Exact facts** (amounts, IDs, verification state) belong in a structured case-facts block that summarization never touches.

None of these fixes pushes routine cases to humans, so first-contact resolution is protected while wrongful refunds and policy violations fall.`,
  lessons: ['2.2', '1.4', '1.5', '5.1', '5.2'],
};
