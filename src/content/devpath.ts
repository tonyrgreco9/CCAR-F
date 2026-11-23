// Claude Certified Developer – Foundations companion curriculum.
//
// Source status (2026-11-21): the path's public course landing pages on anthropic-partners.skilljar.com
// (course descriptions, stated objectives, durations) were read through web search results; direct page
// fetches are blocked by this environment's network policy. Lesson-level content sits behind the
// Partner Academy login and is NOT reproduced here. Objectives below are paraphrased from the public
// landing pages. Each objective links to the Architect lesson that teaches the same skill, or to an
// original companion lesson (src/content/devLessons) when no Architect lesson covers it.
import type { ObjectiveId } from './types';

export interface DevObjective {
  text: string;
  architect?: ObjectiveId[];
  companion?: string; // DevLesson id
}

export interface DevModule {
  order: number;
  title: string;
  url: string;
  minutes: number | null;
  description: string;
  objectives: DevObjective[];
  /** What is still unavailable for this course. */
  missing: string;
}

export const DEV_PATH = {
  title: 'Claude Certified Developer – Foundations',
  url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations',
  checkedOn: '2026-11-21',
  access: 'Course landing pages are public; lessons require a Claude Partner Network login on the Anthropic Partner Academy',
  audience: 'Developers preparing for the CCDV-F exam (Claude Partner Network)',
  exam: 'CCDV-F — third-party sources report 53 items, 120 minutes, scaled passing score 720 (100–1,000), $125. Not verified against an official CCDV-F guide.',
};

const MISSING = 'Lesson list, transcripts, slides, and in-course exercises (partner login required).';

export const DEV_MODULES: DevModule[] = [
  {
    order: 1, title: 'MSO Foundations', minutes: 57,
    url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations/mso-foundations',
    description: 'Model fundamentals the rest of the path builds on: tokens, context, sampling, model choice, prompting modes, and how developers reach Claude programmatically.',
    objectives: [
      { text: 'Explain tokens and treat the context window as a fixed budget shared by every part of a request.', companion: 'dev-tokens-context' },
      { text: 'Explain why sampling makes outputs vary and what non-determinism means for testing and evals.', companion: 'dev-tokens-context' },
      { text: 'Choose a model tier, and keep the model choice separate from enabling a reasoning mode such as extended thinking.', companion: 'dev-model-selection' },
      { text: 'Use zero-shot through multi-shot prompting.', architect: ['4.2'] },
      { text: 'Access Claude through SDKs or raw REST, with synchronous or streaming responses, and async patterns for high-volume work.', companion: 'dev-api-access', architect: ['4.5'] },
    ],
    missing: MISSING + ' The expansion of "MSO" is not stated on the public page.',
  },
  {
    order: 2, title: 'Production-Grade Prompting, Agents & Tool Use', minutes: null,
    url: 'https://anthropic-partners.skilljar.com/production-grade-prompting-agents-tool-use',
    description: 'Production prompt design, extended thinking, tool schemas and the tool-use loop, and choosing workflow versus agent patterns.',
    objectives: [
      { text: 'Write production prompts using system prompts, XML tags, few-shot examples, and output constraints.', companion: 'dev-prompts-thinking', architect: ['4.1', '4.2'] },
      { text: 'Diagnose underperforming prompts, decide when to use extended thinking, set thinking budgets, and handle thinking blocks across tool-use turns.', companion: 'dev-prompts-thinking' },
      { text: 'Design tool schemas that Claude selects correctly.', architect: ['2.1'] },
      { text: 'Build the tool-use loop and decide between single and parallel tool calls.', architect: ['1.1'] },
      { text: 'Choose between workflow and agent patterns.', architect: ['1.6'] },
      { text: 'Wire tools and context into a loop, with human-in-the-loop checkpoints before irreversible actions.', architect: ['1.4', '5.2'] },
    ],
    missing: MISSING + ' Duration not shown in public search results.',
  },
  {
    order: 3, title: 'Claude Code, MCP & Integration', minutes: null,
    url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations/claude-code-mcp-integration',
    description: 'Building MCP servers, working effectively in Claude Code, extending it, and connecting to enterprise systems.',
    objectives: [
      { text: 'Build an MCP server that exposes tools, resources, and prompts; choose a transport; set the configuration scope that controls who loads it.', companion: 'dev-mcp-server', architect: ['2.4'] },
      { text: 'Use the explore–plan–code loop, permission modes, and human review gates.', companion: 'dev-claude-code-extensions', architect: ['3.4'] },
      { text: 'Configure CLAUDE.md, hooks, and subagents.', architect: ['3.1', '1.5', '1.3'] },
      { text: 'Package Skills and plugins.', companion: 'dev-claude-code-extensions', architect: ['3.2'] },
      { text: 'Connect to enterprise systems with authentication.', companion: 'dev-mcp-server' },
    ],
    missing: MISSING + ' Duration not shown in public search results.',
  },
  {
    order: 4, title: 'Production Engineering, Evals & Security', minutes: 211,
    url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations/production-engineering-evals-security',
    description: 'Taking a working prototype to production: evals, tracing, failure handling, cost control, and security.',
    objectives: [
      { text: 'Build evaluation suites and calibrate LLM-as-judge scoring against human-labelled cases.', companion: 'dev-evals' },
      { text: 'Test and trace agent behaviour.', companion: 'dev-evals' },
      { text: 'Separate retriable errors from terminal ones.', architect: ['2.2', '5.3'] },
      { text: 'Defend integrations against prompt injection and exposed secrets.', companion: 'dev-security' },
      { text: 'Control cost.', companion: 'dev-cost', architect: ['4.5'] },
    ],
    missing: MISSING,
  },
  {
    order: 5, title: 'Accelerators & IP Contribution', minutes: 155,
    url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations/accelerators-ip-contribution',
    description: 'Turning working solutions into reusable assets, contributing them back, and choosing where Claude workloads run.',
    objectives: [
      { text: 'Turn a working solution into a reusable asset such as an agent template, a configurable MCP server, or an eval suite.', companion: 'dev-accelerators' },
      { text: 'Contribute a tool, pattern, or fix back through documented channels.', companion: 'dev-accelerators' },
      { text: 'Choose where a Claude workload runs: the first-party API, Amazon Bedrock, Google Vertex AI, or third-party platforms.', companion: 'dev-deployment-platforms' },
      { text: 'Build an application that coordinates several Claude deployments while keeping data and identity boundaries intact.', companion: 'dev-deployment-platforms' },
    ],
    missing: MISSING,
  },
];

export interface Refresher {
  id: string;
  course: string;
  summary: string;
  keyPoints: string[];
  relatedLessons: ObjectiveId[];
}

/** Original refreshers on the public topics of these courses. Not derived from course materials. */
export const REFRESHERS: Refresher[] = [
  {
    id: 'claude-101', course: 'Claude 101',
    summary: 'What Claude is good at, how conversations and context work, and how to give Claude a task it can succeed at.',
    keyPoints: [
      'Claude sees only what is in its context window: the system prompt, the conversation so far, attached files, and tool results.',
      'Clear goals, relevant context, and an explicit output format usually matter more than clever phrasing.',
      'Long conversations accumulate context; important facts can be diluted or summarized away, so restate or pin what matters.',
      'Check important outputs: Claude can be confidently wrong, especially about specifics it was not given.',
    ],
    relatedLessons: ['4.1', '5.1'],
  },
  {
    id: 'claude-code-101', course: 'Claude Code 101',
    summary: 'Claude Code is an agentic coding tool that reads your repository, runs commands, and edits files with your permission.',
    keyPoints: [
      'It works in a loop: read files and search, propose or make edits, run commands such as tests, and repeat.',
      'CLAUDE.md files give it persistent project instructions; settings and permissions control which tools it may use.',
      'Plan mode lets it explore and propose a plan before changing anything.',
      'Slash commands and skills package repeatable workflows.',
    ],
    relatedLessons: ['3.1', '3.2', '3.4', '2.5'],
  },
  {
    id: 'claude-platform-101', course: 'Claude Platform 101',
    summary: 'The Claude Developer Platform: the Messages API, models, the console, and the building blocks for applications.',
    keyPoints: [
      'Applications send a list of messages (plus an optional system prompt) and receive a response with content blocks and a stop_reason.',
      'Tool use lets the model request function calls that your code executes.',
      'Batch processing trades latency for lower cost on bulk, non-urgent work.',
      'Prompt caching reduces cost and latency for repeated long prefixes.',
    ],
    relatedLessons: ['1.1', '4.5'],
  },
  {
    id: 'claude-code-in-action', course: 'Claude Code in Action',
    summary: 'Applying Claude Code to real development work: context management, custom commands, MCP servers, and automation.',
    keyPoints: [
      'Give Claude the right context: CLAUDE.md, referenced files, and concrete examples of expected behavior.',
      'Use custom commands for repeated workflows and MCP servers to reach external systems.',
      'Hooks run deterministic scripts around tool calls (for example, format after edit, block writes to protected paths).',
      'Claude Code can run non-interactively in scripts and CI.',
    ],
    relatedLessons: ['3.2', '2.4', '1.5', '3.6'],
  },
  {
    id: 'ai-fluency', course: 'AI Fluency: Framework & Foundations',
    summary: 'Working with AI effectively and responsibly: deciding what to delegate, describing tasks well, judging outputs, and being accountable for results.',
    keyPoints: [
      'Decide deliberately which parts of a task to delegate to AI and which need human judgment.',
      'Describe the goal, context, constraints, and format you need.',
      'Evaluate outputs critically for accuracy, completeness, and fitness for purpose.',
      'Remain responsible for how AI output is used and disclosed.',
    ],
    relatedLessons: ['5.2', '5.5'],
  },
  {
    id: 'building-with-api', course: 'Building with the Claude API',
    summary: 'Building applications on the Messages API: requests and responses, system prompts, tool use, structured output, and evaluation.',
    keyPoints: [
      'Each request is stateless: your application resends the conversation history it wants the model to see.',
      'Tool use: the model returns tool_use blocks; you execute them and return tool_result blocks with matching IDs.',
      'Use JSON schemas (tool input schemas or structured outputs) when downstream code parses the response.',
      'Build evaluations with representative test cases before tuning prompts.',
    ],
    relatedLessons: ['1.1', '4.3', '4.4'],
  },
  {
    id: 'intro-mcp', course: 'Introduction to Model Context Protocol',
    summary: 'MCP is an open protocol that lets AI applications connect to external tools and data through servers.',
    keyPoints: [
      'An MCP server exposes tools (actions), resources (readable data), and prompts (templates).',
      'Clients such as Claude Code connect to servers over stdio or HTTP.',
      'Tool results can signal failure with isError so the model can decide how to recover.',
      'Good tool names and descriptions determine whether the model picks the right tool.',
    ],
    relatedLessons: ['2.1', '2.2', '2.4'],
  },
  {
    id: 'mcp-advanced', course: 'Model Context Protocol: Advanced Topics',
    summary: 'Production MCP concerns: transports, scoping and configuration, error design, security, and scaling.',
    keyPoints: [
      'Choose transports and deployment to match where the server runs and who can reach it.',
      'Keep secrets out of shared configuration; use environment variable expansion.',
      'Return structured, actionable errors that distinguish retryable failures from permanent ones.',
      'Limit the tools each agent sees to what its role needs.',
    ],
    relatedLessons: ['2.2', '2.3', '2.4'],
  },
  {
    id: 'ai-capabilities', course: 'AI Capabilities and Limitations',
    summary: 'What current models do reliably, where they fail, and how to design around the failure modes.',
    keyPoints: [
      'Models can produce plausible but unsupported content; require sources or allow "unknown".',
      'Self-reported confidence is not a calibrated probability without measurement.',
      'Performance varies by input type; aggregate accuracy can hide weak segments.',
      'Use deterministic checks where a rule must always hold.',
    ],
    relatedLessons: ['4.4', '5.5', '1.4'],
  },
];

export interface DiagnosticItem {
  id: string;
  refresher: string;
  stem: string;
  options: { id: string; text: string }[];
  correct: string;
  why: string;
}

export const DIAGNOSTIC: DiagnosticItem[] = [
  { id: 'dx1', refresher: 'claude-101', stem: 'A teammate pasted a 40-page policy into a chat two hours and many messages ago. Claude now answers a policy question incorrectly. What is the most likely cause?', options: [
    { id: 'a', text: 'Claude discards anything older than one hour of chat.' },
    { id: 'b', text: 'Documents over ten pages are silently truncated.' },
    { id: 'c', text: 'The policy is buried in a long, crowded context.' },
    { id: 'd', text: 'Policies must be pasted as images to be read.' },
  ], correct: 'c', why: 'Long conversations dilute earlier material; restating or pinning the relevant section restores it. There is no time-based forgetting or ten-page limit.' },
  { id: 'dx2', refresher: 'claude-code-101', stem: "You want Claude Code to follow your team's test-naming convention in every session in this repository. Where does the instruction belong?", options: [
    { id: 'a', text: 'Your personal ~/.claude/CLAUDE.md file.' },
    { id: 'b', text: 'The project CLAUDE.md, committed to the repo.' },
    { id: 'c', text: 'A comment at the top of one test file.' },
    { id: 'd', text: 'The first message of every new session.' },
  ], correct: 'b', why: 'The project CLAUDE.md loads automatically for everyone working in the repository. A personal file applies only to you, and per-session messages are easy to forget.' },
  { id: 'dx3', refresher: 'claude-platform-101', stem: 'A Messages API response has stop_reason "tool_use". What should your application do next?', options: [
    { id: 'a', text: 'Raise max_tokens and send the same request.' },
    { id: 'b', text: 'Show the reply to the user as the final answer.' },
    { id: 'c', text: 'Retry the request because the output was cut off.' },
    { id: 'd', text: 'Run the requested tools and send back the results.' },
  ], correct: 'd', why: '"tool_use" means the model is waiting for tool results. A finished answer ends with "end_turn"; truncation shows up as "max_tokens".' },
  { id: 'dx4', refresher: 'claude-code-in-action', stem: 'Your team wants code formatted after every file edit Claude Code makes, without relying on Claude remembering to do it. What fits best?', options: [
    { id: 'a', text: 'A hook that runs the formatter after each edit.' },
    { id: 'b', text: 'A CLAUDE.md line asking Claude to format files.' },
    { id: 'c', text: 'A slash command developers run before committing.' },
    { id: 'd', text: 'A final reminder to check formatting at the end.' },
  ], correct: 'a', why: 'Hooks run deterministically on tool events. Instructions, commands and reminders all depend on someone remembering.' },
  { id: 'dx5', refresher: 'ai-fluency', stem: 'Claude drafted a customer-facing policy summary. Before sending it, what is your responsibility?', options: [
    { id: 'a', text: 'Ask the model if it is confident, then send it.' },
    { id: 'b', text: 'Add an "AI-generated" label so errors are excused.' },
    { id: 'c', text: 'Check accuracy and fitness; you own the result.' },
    { id: 'd', text: 'None; the model is accountable for its output.' },
  ], correct: 'c', why: 'The person using AI output stays accountable for it. Model self-assessment is not verification, and a disclosure label does not make errors acceptable.' },
  { id: 'dx6', refresher: 'building-with-api', stem: 'Your app calls the Messages API for turn 3 of a conversation. What must the request include for Claude to see turns 1 and 2?', options: [
    { id: 'a', text: 'The conversation ID returned by the first call.' },
    { id: 'b', text: 'Only the system prompt; history is kept server-side.' },
    { id: 'c', text: 'Nothing; the API remembers calls per API key.' },
    { id: 'd', text: 'The earlier user and assistant messages, resent.' },
  ], correct: 'd', why: 'The Messages API is stateless: the client sends whatever history it wants the model to see on every call.' },
  { id: 'dx7', refresher: 'intro-mcp', stem: 'Which MCP primitive is meant for actions the model can invoke, such as creating a ticket?', options: [
    { id: 'a', text: 'Resources' },
    { id: 'b', text: 'Tools' },
    { id: 'c', text: 'Prompts' },
    { id: 'd', text: 'Roots' },
  ], correct: 'b', why: 'Tools are model-invoked actions. Resources expose readable data, and prompts are reusable templates.' },
  { id: 'dx8', refresher: 'mcp-advanced', stem: 'A shared MCP configuration needs an API token. How should the token reach the server?', options: [
    { id: 'a', text: 'Commit the token in the shared config file.' },
    { id: 'b', text: 'Paste the token into the project CLAUDE.md.' },
    { id: 'c', text: 'Reference an env variable each user sets locally.' },
    { id: 'd', text: 'Ask Claude to remember the token for later.' },
  ], correct: 'c', why: 'Environment-variable expansion keeps secrets out of version control while the configuration itself stays shared.' },
  { id: 'dx9', refresher: 'ai-capabilities', stem: 'An extraction model reports 95% confidence on every field. What does that tell you about its accuracy?', options: [
    { id: 'a', text: 'Little, until checked against labelled results.' },
    { id: 'b', text: 'That about 95% of the fields will be correct.' },
    { id: 'c', text: 'That human review can now safely be dropped.' },
    { id: 'd', text: 'That the model is overfitting its training data.' },
  ], correct: 'a', why: 'Self-reported confidence has to be calibrated against observed accuracy on labelled data before it can drive decisions.' },
];
