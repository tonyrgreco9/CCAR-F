import type { CaseStudy } from '../types';

export const caseStudy: CaseStudy = {
  scenario: 'research',
  title: 'The battery-storage landscape report',
  brief:
    'Northwind Analytics has a client, a mid-sized infrastructure fund, that asks for a report on the European grid-scale battery storage market: who the main developers are, how much capacity is planned through 2030, how revenue models are changing, and which policy shifts matter most. ' +
    'The analyst has uploaded 14 PDFs (two confidential due-diligence memos and twelve public company filings) and has access to the internal metrics warehouse, which holds the fund\'s own portfolio data on three storage assets.\n\n' +
    'The first version of the multi-agent system produced a draft that the analyst rejected. It covered only Germany and the UK, its capacity section quoted a single figure without saying where it came from, and its policy section said "no recent changes to Italian capacity-market rules were found." It later turned out the regulator portal had been down during the run. ' +
    'You are the architect asked to fix the design before the report is rerun. Each decision below is one change you would make; pick the option that best fits the constraints.',
  constraints: [
    'The report is due to the analyst in 48 hours; a run should take under 20 minutes so the analyst can iterate.',
    'Every material claim must be cited to its source, and the two confidential memos must be identified as client-supplied, not public.',
    'Conflicting figures must be shown with attribution; the analyst, not the system, decides how to present them to the client.',
    'Analysts prefer a report with clearly marked gaps over no report.',
    'Subagents do not see the coordinator\'s conversation; anything they need must be in their delegation prompt.',
    'Cost matters, but correctness and coverage of the client\'s four sub-questions come first.',
  ],
  decisions: [
    {
      id: 'd1',
      prompt:
        'The first draft covered only Germany and the UK. The trace shows the coordinator delegated "German storage market" and "UK storage market" and nothing else; both subagents did their tasks well. How should the coordinator plan the rerun?',
      options: [
        {
          id: 'a',
          text: 'Keep the same plan but tell each subagent to also cover any other countries it comes across.',
          consequence: 'Subagents drift beyond their tasks and duplicate each other, and coverage of the other markets and of the four sub-questions depends on chance.',
        },
        {
          id: 'b',
          text: 'Have the coordinator first map the question into its four sub-questions and the markets that matter, explore briefly, then delegate scoped tasks and check results against that map before writing.',
          consequence: 'The plan reflects the client\'s actual question, gaps found after the first round get targeted follow-ups, and runs stay bounded by a coverage check.',
        },
        {
          id: 'c',
          text: 'Replace the coordinator with a fixed pipeline of one subagent per EU country, run on every question.',
          consequence: 'Many low-value subagents run each time, cost jumps, and the revenue-model and policy sub-questions still have no dedicated owner.',
        },
      ],
      best: 'b',
      walkthrough:
        'The gap came from the coordinator\'s task list, not from the subagents, which did their assigned work well. The fix belongs in the coordinator: derive the sub-questions and the markets they span, use a brief exploration to find which markets matter, delegate with clear scopes, and check results against that map before handing off to the writer. Telling subagents to roam treats a planning problem as a search problem. A fixed per-country pipeline trades a planning bug for a cost problem and still ignores the question\'s other dimensions.',
    },
    {
      id: 'd2',
      prompt:
        'The coordinator will delegate capacity research to the document analysis agent, which must use the 14 uploaded PDFs. What should the delegation prompt contain?',
      options: [
        {
          id: 'a',
          text: '"Analyze the documents discussed earlier and report capacity figures." The agent can ask the coordinator if it needs more.',
          consequence: 'The subagent has no view of "earlier," does not know which files are confidential, and returns figures without the provenance the report needs.',
        },
        {
          id: 'b',
          text: 'The full coordinator transcript so far, so the subagent has every piece of context.',
          consequence: 'The subagent receives a long, mostly irrelevant history; cost rises and its attention on the actual capacity task drops.',
        },
        {
          id: 'c',
          text: 'The specific sub-question, the file list with each file marked confidential or public, the time range (through 2030), and a required output format: each figure with document, page, publication date, and quote.',
          consequence: 'The subagent knows exactly what to do and returns findings that carry the provenance and confidentiality labels the writer needs.',
        },
        {
          id: 'd',
          text: 'Only the sub-question; the subagent can find the files and decide the output format itself.',
          consequence: 'The subagent may miss or mislabel the confidential memos and return free-form text that the writer cannot cite reliably.',
        },
      ],
      best: 'c',
      walkthrough:
        'Subagents start with only what their delegation prompt contains. A good prompt carries the specific objective, the inputs (here, the files and which are confidential), the boundaries (time range), and the output format, including the provenance fields every claim must keep. Referring to "earlier" assumes shared context that does not exist. Dumping the whole transcript wastes tokens and dilutes attention. A bare sub-question leaves confidentiality labels and citation structure to chance.',
    },
    {
      id: 'd3',
      prompt:
        'On the rerun, the regulator-portal search for Italian capacity-market rules fails again with a timeout after one of three queries; that query found two relevant documents. How should this be handled?',
      options: [
        {
          id: 'a',
          text: 'The subagent returns a partial result: the timeout, the completed and unattempted queries, the two documents, and a suggested alternative source. The coordinator retries once or re-scopes, and if the gap remains the report says Italian rules "could not be fully checked."',
          consequence: 'Useful evidence is kept, recovery is attempted with full knowledge of what is missing, and the report states the gap honestly.',
        },
        {
          id: 'b',
          text: 'The subagent returns an empty success so the run continues smoothly.',
          consequence: 'The report again claims there were no Italian rule changes, repeating the false negative that got the first draft rejected.',
        },
        {
          id: 'c',
          text: 'The coordinator aborts the run and tells the analyst to try again later.',
          consequence: 'All other completed research is discarded and the 48-hour deadline is put at risk over one partly failed subtask.',
        },
      ],
      best: 'a',
      walkthrough:
        'The first draft\'s "no changes found" sentence came from a failure disguised as an empty success. Structured failure context (what was attempted, what failed and why, what partial results exist, and what alternatives remain) lets the coordinator choose a recovery and lets the report distinguish "checked, none found" from "could not be checked." Aborting throws away good work, which the constraint about preferring marked gaps rules out.',
    },
    {
      id: 'd4',
      prompt:
        'For 2030 planned capacity, a confidential memo (dated January 2025) says 38 GW, and a public industry outlook (dated June 2024) says 52 GW. Both claim to cover the same markets. How should the synthesized finding reach the report writer?',
      options: [
        {
          id: 'a',
          text: 'Use 38 GW, since the memo is newer and was supplied by the client.',
          consequence: 'A credible public figure disappears, and the analyst never sees that the sources disagree.',
        },
        {
          id: 'b',
          text: 'Use the midpoint, 45 GW, citing both sources.',
          consequence: 'The report cites two sources for a figure neither contains, hiding the disagreement and misattributing the number.',
        },
        {
          id: 'c',
          text: 'Keep both values, each with its source, confidentiality label, publication date, and scope, flagged as a conflict, with a note that the gap may partly reflect the seven months between them.',
          consequence: 'The analyst sees both figures, their provenance, and a possible explanation, and decides how to present them to the client.',
        },
        {
          id: 'd',
          text: 'Drop both and state that 2030 capacity is uncertain.',
          consequence: 'The client loses two useful data points, and the report gives no basis for its uncertainty statement.',
        },
      ],
      best: 'c',
      walkthrough:
        'Conflicting credible evidence should be preserved with attribution, not resolved silently. Dates matter: seven months apart, the figures might reflect project cancellations rather than a pure contradiction, so the record should carry both dates and the writer should say which explanation is possible. Picking the newer source, averaging, or discarding both each removes information the analyst needs, and the constraint says the analyst decides how to present conflicts.',
    },
  ],
  wrapUp:
    'The rerun design fixes the rejected draft at its roots: the coordinator plans from the client\'s sub-questions and checks coverage before writing; delegation prompts carry the inputs, boundaries, confidentiality labels, and provenance format that subagents cannot get any other way; failures travel upward as structured partial results so the report states real gaps instead of false negatives; and conflicting figures reach the analyst with attribution and dates. None of these changes depends on the model being more careful. Each one adds the missing information or structure where the original design lost it.',
  lessons: ['1.2', '1.3', '1.6', '5.3', '5.6'],
};
