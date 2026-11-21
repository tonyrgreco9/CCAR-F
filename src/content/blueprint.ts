import type { DomainId, ObjectiveId, ScenarioId } from './types';

/**
 * Exam guide metadata — from the official Claude Certified Architect – Foundations Exam Guide,
 * Version 1.1, effective November 2026 (document control: v1.0 July 2026; v1.1 November 2026,
 * "Registration, identification, and support updates"). Downloaded 2026-11-21 from Anthropic's
 * Skilljar-hosted public file storage; a local copy is kept at docs/source/ (not committed).
 */
export const EXAM_GUIDE = {
  title: 'Claude Certified Architect – Foundations Exam Guide',
  supplied: true,
  version: '1.1' as string | null,
  effectiveDate: 'November 2026' as string | null,
  passingScore: 'Scaled score of 720 on a scale of 100–1,000' as string | null, // guide information only
  fee: '$125 USD',
  validity: '12 months from the date the credential is awarded',
  delivery: 'Proctored: online proctored and/or test center, per program policy',
  resultReporting: 'Pass/fail with scaled score (100–1,000), plus percent-correct by domain',
  url: 'https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf',
  checkedOn: '2026-11-21',
  location: 'docs/source/CCAR-F-Exam-Guide-v1.1.pdf (local copy, not committed)',
  format: {
    questions: 60,
    minutes: 120,
    scenariosPerForm: 4,
    scenarioFamilies: 6,
    domainTargets: { 1: 16, 2: 11, 3: 12, 4: 12, 5: 9 } as Record<DomainId, number>,
    itemTypes: 'Multiple-choice and multiple-response; each item states how many responses to select',
    fromBrief: false,
  },
};

export const INDEPENDENCE_NOTICE =
  'Independent exam preparation. Not affiliated with, endorsed by, or produced by Anthropic. ' +
  'Questions are original practice items, not official exam questions.';

export const DOMAINS: { id: DomainId; title: string; weight: number }[] = [
  { id: 1, title: 'Agentic Architecture & Orchestration', weight: 27 },
  { id: 2, title: 'Tool Design & MCP Integration', weight: 18 },
  { id: 3, title: 'Claude Code Configuration & Workflows', weight: 20 },
  { id: 4, title: 'Prompt Engineering & Structured Output', weight: 20 },
  { id: 5, title: 'Context Management & Reliability', weight: 15 },
];

export const OBJECTIVES: { id: ObjectiveId; domain: DomainId; statement: string }[] = [
  { id: '1.1', domain: 1, statement: 'Design and implement agentic loops for autonomous task execution' },
  { id: '1.2', domain: 1, statement: 'Orchestrate multi-agent systems with coordinator-subagent patterns' },
  { id: '1.3', domain: 1, statement: 'Configure subagent invocation, context passing, and spawning' },
  { id: '1.4', domain: 1, statement: 'Implement multi-step workflows with enforcement and handoff patterns' },
  { id: '1.5', domain: 1, statement: 'Apply Agent SDK hooks for tool call interception and data normalization' },
  { id: '1.6', domain: 1, statement: 'Design task decomposition strategies for complex workflows' },
  { id: '1.7', domain: 1, statement: 'Manage session state, resumption, and forking' },
  { id: '2.1', domain: 2, statement: 'Design effective tool interfaces with clear descriptions and boundaries' },
  { id: '2.2', domain: 2, statement: 'Implement structured error responses for MCP tools' },
  { id: '2.3', domain: 2, statement: 'Distribute tools appropriately across agents and configure tool choice' },
  { id: '2.4', domain: 2, statement: 'Integrate MCP servers into Claude Code and agent workflows' },
  { id: '2.5', domain: 2, statement: 'Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively' },
  { id: '3.1', domain: 3, statement: 'Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization' },
  { id: '3.2', domain: 3, statement: 'Create and configure custom slash commands and skills' },
  { id: '3.3', domain: 3, statement: 'Apply path-specific rules for conditional convention loading' },
  { id: '3.4', domain: 3, statement: 'Determine when to use plan mode vs direct execution' },
  { id: '3.5', domain: 3, statement: 'Apply iterative refinement techniques for progressive improvement' },
  { id: '3.6', domain: 3, statement: 'Integrate Claude Code into CI/CD pipelines' },
  { id: '4.1', domain: 4, statement: 'Design prompts with explicit criteria to improve precision and reduce false positives' },
  { id: '4.2', domain: 4, statement: 'Apply few-shot prompting to improve output consistency and quality' },
  { id: '4.3', domain: 4, statement: 'Enforce structured output using tool use and JSON schemas' },
  { id: '4.4', domain: 4, statement: 'Implement validation, retry, and feedback loops for extraction quality' },
  { id: '4.5', domain: 4, statement: 'Design efficient batch processing strategies' },
  { id: '4.6', domain: 4, statement: 'Design multi-instance and multi-pass review architectures' },
  { id: '5.1', domain: 5, statement: 'Manage conversation context to preserve critical information across long interactions' },
  { id: '5.2', domain: 5, statement: 'Design effective escalation and ambiguity resolution patterns' },
  { id: '5.3', domain: 5, statement: 'Implement error propagation strategies across multi-agent systems' },
  { id: '5.4', domain: 5, statement: 'Manage context effectively in large codebase exploration' },
  { id: '5.5', domain: 5, statement: 'Design human review workflows and confidence calibration' },
  { id: '5.6', domain: 5, statement: 'Preserve information provenance and handle uncertainty in multi-source synthesis' },
];

export const objectiveDomain = (id: ObjectiveId): DomainId => Number(id[0]) as DomainId;

export interface Scenario {
  id: ScenarioId;
  title: string;
  /** Shown to the learner during the exam ("View scenario"). Original text. */
  brief: string;
  short: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'support',
    title: 'Customer Support Resolution Agent',
    short: 'Agent SDK support agent that resolves billing and account issues with backend tools.',
    brief:
      'Lumen Mobile, a subscription phone and internet provider, is deploying a customer support resolution agent built on the Claude Agent SDK. ' +
      'The agent talks to customers in chat and resolves billing, plan, and account problems end to end. It can call tools backed by internal services: ' +
      '`get_customer` (profile and verification status), `lookup_invoice`, `lookup_transaction`, `issue_refund`, `change_plan`, `apply_credit`, and `escalate_to_human` (creates a ticket for the human support queue with a summary). ' +
      'Company policy requires identity verification before any account change, caps agent-issued refunds and credits at $150 per case, and routes anything above that, legal threats, and suspected fraud to humans. ' +
      'The team measures first-contact resolution, wrongful refunds, and customer satisfaction. Individual questions add details about specific conversations, tools, and incidents.',
  },
  {
    id: 'codegen',
    title: 'Code Generation with Claude Code',
    short: 'Product team using Claude Code to build features and tests in a shared monorepo.',
    brief:
      'Tidewater Health, a healthcare scheduling company, uses Claude Code for day-to-day feature work in a monorepo containing a TypeScript API (`services/api`), a React web app (`apps/web`), Python data jobs (`jobs/`), and Terraform (`infra/`). ' +
      'Twenty engineers share the repository. The team wants Claude Code to follow team conventions consistently, generate tests alongside code, avoid touching infrastructure without review, and keep personal preferences out of shared configuration. ' +
      'Engineers use CLAUDE.md files, `.claude/` project configuration, custom slash commands, skills, and plan mode. Individual questions describe specific tasks, files, and configuration choices.',
  },
  {
    id: 'research',
    title: 'Multi-Agent Research System',
    short: 'Coordinator and subagents that search, analyze, and synthesize cited reports.',
    brief:
      'Northwind Analytics is building a multi-agent research system with the Claude Agent SDK. A coordinator agent receives a research question from an analyst, plans the work, and delegates to subagents: ' +
      'a web search agent, a document analysis agent (reads PDFs and filings supplied by the analyst), a data agent (queries an internal metrics warehouse through an MCP server), and a report writer. ' +
      'Final reports must cite every material claim to its source, flag conflicting evidence, and state uncertainty. Analysts review reports before clients see them. ' +
      'The team cares about coverage, citation accuracy, cost, and latency. Individual questions describe specific research tasks, agent configurations, and failures.',
  },
  {
    id: 'devprod',
    title: 'Developer Productivity with Claude',
    short: 'Platform team giving engineers Claude-based tools for a large legacy codebase.',
    brief:
      'Harbor Freight Systems, a logistics software company, has a 2-million-line Java and Go codebase with ten years of history. The platform team is rolling out Claude Code and an internal agent built with the Agent SDK to help engineers ' +
      'understand unfamiliar services, trace bugs, write migration scripts, and answer "how does this work?" questions. They have MCP servers for the issue tracker, the internal documentation wiki, and a read-only replica of the operations database. ' +
      'The team wants shared, versioned configuration, minimal per-engineer setup, no credentials in the repository, and tools that stay focused on large codebases without exhausting context. Individual questions describe specific engineers, tasks, and setup choices.',
  },
  {
    id: 'ci',
    title: 'Claude Code for Continuous Integration',
    short: 'Claude Code running non-interactively in CI for review, tests, and triage.',
    brief:
      'Quarry Labs, a developer-tools company, runs Claude Code non-interactively in its CI pipeline. On each pull request, jobs use Claude to review the diff, suggest missing tests, and triage failing builds; findings are posted as PR comments and some feed a merge gate. ' +
      'Pipelines run in ephemeral runners with secrets supplied by the CI system. The engineering team has complained about noisy review comments, inconsistent output that breaks parsers, and cost on large monorepo PRs. ' +
      'Individual questions describe specific pipeline steps, flags, prompts, outputs, and failures.',
  },
  {
    id: 'extraction',
    title: 'Structured Data Extraction',
    short: 'Pipeline extracting fields from invoices, contracts, and forms into validated JSON.',
    brief:
      'Ledgerline, an accounts-payable automation company, extracts structured data from supplier invoices, purchase orders, contracts, and remittance advices for corporate clients. ' +
      'Documents arrive as PDFs and scans in many layouts and languages. Extracted records must conform to a JSON schema consumed by client ERP systems; wrong values that look valid are costlier than fields left for review. ' +
      'Nightly backlogs of tens of thousands of documents are processed in bulk, while urgent single documents are processed on demand. Human reviewers handle exceptions. Individual questions describe specific documents, schemas, and pipeline behavior.',
  },
];

export const scenarioById = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id)!;
export const domainTitle = (d: DomainId) => DOMAINS.find((x) => x.id === d)!.title;
export const objectiveById = (id: ObjectiveId) => OBJECTIVES.find((o) => o.id === id)!;
