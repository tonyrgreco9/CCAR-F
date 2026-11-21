// Source registry. Lessons and questions cite these IDs; tests reject unknown IDs.
//
// Verification status (2026-11-20): the build environment's network policy denied
// docs.claude.com, modelcontextprotocol.io, and anthropic-partners.skilljar.com, and no
// exam guide or Academy exports were present in docs/. URLs below are the documented
// public locations as known to the author; each is marked `verified: false` until a
// maintainer opens it and confirms the content. See the Coverage view.

export type SourceKind = 'exam-guide' | 'anthropic-docs' | 'mcp-spec' | 'academy' | 'app';

export interface SourceRef {
  id: string;
  title: string;
  url: string | null;
  kind: SourceKind;
  verified: boolean;
  note?: string;
}

const DOCS = 'https://docs.claude.com/en/docs';
const GUIDE_URL = 'https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf';
const UNVERIFIED = 'Not reachable from the build environment on 2026-11-20 (network policy). Confirm against the live page.';

export const SOURCES: SourceRef[] = [
  // ---- Exam guide (task statements restated in the build request; guide file not supplied) ----
  ...(['1', '2', '3', '4', '5'] as const).map((d) => ({
    id: `guide-d${d}`,
    title: `CCAR-F Exam Guide v1.1 — Domain ${d} objectives (task statements, Knowledge/Skills)`,
    url: GUIDE_URL,
    kind: 'exam-guide' as const,
    verified: true,
    note: 'Official exam guide v1.1, effective November 2026. Downloaded and read in full on 2026-11-21.',
  })),
  { id: 'guide-format', title: 'CCAR-F Exam Guide v1.1 — exam details, scenarios, scoring', url: GUIDE_URL, kind: 'exam-guide', verified: true, note: 'Official exam guide v1.1, effective November 2026. Read in full on 2026-11-21.' },

  // ---- Claude API ----
  { id: 'api-tool-use', title: 'Claude Docs — Tool use overview', url: `${DOCS}/agents-and-tools/tool-use/overview`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-implement-tool-use', title: 'Claude Docs — How to implement tool use (tool_choice, tool_result, is_error)', url: `${DOCS}/agents-and-tools/tool-use/implement-tool-use`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-stop-reasons', title: 'Claude Docs — Handling stop reasons', url: `${DOCS}/build-with-claude/handling-stop-reasons`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-structured-outputs', title: 'Claude Docs — Structured outputs', url: `${DOCS}/build-with-claude/structured-outputs`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-batch', title: 'Claude Docs — Batch processing (Message Batches API)', url: `${DOCS}/build-with-claude/batch-processing`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-prompt-caching', title: 'Claude Docs — Prompt caching', url: `${DOCS}/build-with-claude/prompt-caching`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-context-windows', title: 'Claude Docs — Context windows', url: `${DOCS}/build-with-claude/context-windows`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'pe-overview', title: 'Claude Docs — Prompt engineering overview', url: `${DOCS}/build-with-claude/prompt-engineering/overview`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'pe-multishot', title: 'Claude Docs — Use examples (multishot prompting)', url: `${DOCS}/build-with-claude/prompt-engineering/multishot-prompting`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'pe-clear-direct', title: 'Claude Docs — Be clear and direct', url: `${DOCS}/build-with-claude/prompt-engineering/be-clear-and-direct`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'pe-chain', title: 'Claude Docs — Chain complex prompts', url: `${DOCS}/build-with-claude/prompt-engineering/chain-prompts`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'guard-hallucinations', title: 'Claude Docs — Reduce hallucinations', url: `${DOCS}/test-and-evaluate/strengthen-guardrails/reduce-hallucinations`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'guard-consistency', title: 'Claude Docs — Increase output consistency', url: `${DOCS}/test-and-evaluate/strengthen-guardrails/increase-consistency`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'eval-tests', title: 'Claude Docs — Define success criteria and build evaluations', url: `${DOCS}/test-and-evaluate/develop-tests`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },

  // ---- Agent SDK ----
  { id: 'sdk-overview', title: 'Claude Docs — Agent SDK overview', url: `${DOCS}/agent-sdk/overview`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'sdk-subagents', title: 'Claude Docs — Agent SDK subagents', url: `${DOCS}/agent-sdk/subagents`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'sdk-hooks', title: 'Claude Docs — Agent SDK hooks', url: `${DOCS}/agent-sdk/hooks`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'sdk-sessions', title: 'Claude Docs — Agent SDK session management (resume, fork)', url: `${DOCS}/agent-sdk/sessions`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'sdk-permissions', title: 'Claude Docs — Agent SDK permissions and allowed tools', url: `${DOCS}/agent-sdk/permissions`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'sdk-mcp', title: 'Claude Docs — Agent SDK MCP integration', url: `${DOCS}/agent-sdk/mcp`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'eng-multi-agent', title: 'Anthropic Engineering — How we built our multi-agent research system', url: 'https://www.anthropic.com/engineering/multi-agent-research-system', kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'eng-building-agents', title: 'Anthropic Engineering — Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents', kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'eng-writing-tools', title: 'Anthropic Engineering — Writing effective tools for agents', url: 'https://www.anthropic.com/engineering/writing-tools-for-agents', kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'eng-context', title: 'Anthropic Engineering — Effective context engineering for AI agents', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents', kind: 'anthropic-docs', verified: false, note: UNVERIFIED },

  // ---- Claude Code ----
  { id: 'cc-overview', title: 'Claude Code Docs — Overview', url: `${DOCS}/claude-code/overview`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-memory', title: 'Claude Code Docs — Memory (CLAUDE.md, imports, rules)', url: `${DOCS}/claude-code/memory`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-slash-commands', title: 'Claude Code Docs — Slash commands', url: `${DOCS}/claude-code/slash-commands`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-skills', title: 'Claude Code Docs — Agent Skills', url: `${DOCS}/claude-code/skills`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-subagents', title: 'Claude Code Docs — Subagents', url: `${DOCS}/claude-code/sub-agents`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-hooks', title: 'Claude Code Docs — Hooks reference', url: `${DOCS}/claude-code/hooks`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-mcp', title: 'Claude Code Docs — Connect Claude Code to tools via MCP', url: `${DOCS}/claude-code/mcp`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-settings', title: 'Claude Code Docs — Settings and permissions', url: `${DOCS}/claude-code/settings`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-workflows', title: 'Claude Code Docs — Common workflows (plan mode, codebase exploration)', url: `${DOCS}/claude-code/common-workflows`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-best-practices', title: 'Anthropic Engineering — Claude Code best practices', url: 'https://www.anthropic.com/engineering/claude-code-best-practices', kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-headless', title: 'Claude Code Docs — Headless mode (claude -p, output formats)', url: `${DOCS}/claude-code/headless`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-github-actions', title: 'Claude Code Docs — GitHub Actions', url: `${DOCS}/claude-code/github-actions`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-cli-reference', title: 'Claude Code Docs — CLI reference', url: `${DOCS}/claude-code/cli-reference`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-tools', title: 'Claude Code Docs — Tools available to Claude (Read, Write, Edit, Bash, Grep, Glob)', url: `${DOCS}/claude-code/settings#tools-available-to-claude`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },

  // ---- MCP ----
  { id: 'mcp-spec-tools', title: 'Model Context Protocol specification — Tools (results and isError)', url: 'https://modelcontextprotocol.io/specification/2025-06-18/server/tools', kind: 'mcp-spec', verified: false, note: UNVERIFIED },
  { id: 'mcp-intro', title: 'Model Context Protocol — Introduction', url: 'https://modelcontextprotocol.io/introduction', kind: 'mcp-spec', verified: false, note: UNVERIFIED },

  // ---- Academy ----
  { id: 'academy-dev-path', title: 'Anthropic Academy — Claude Certified Developer – Foundations learning path', url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations/', kind: 'academy', verified: false, note: 'Public landing pages read via web search on 2026-11-21. Lessons require a Claude Partner Network login and were not used.' },
  { id: 'academy-catalog', title: 'Anthropic Academy — public course catalog', url: 'https://anthropic.skilljar.com/', kind: 'academy', verified: false, note: 'Catalog location; individual course URLs were not verified.' },

  // ---- Developer Foundations companion topics ----
  { id: 'api-models', title: 'Claude Docs — Models overview and choosing a model', url: `${DOCS}/about-claude/models/overview`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-extended-thinking', title: 'Claude Docs — Extended thinking', url: `${DOCS}/build-with-claude/extended-thinking`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-streaming', title: 'Claude Docs — Streaming messages', url: `${DOCS}/build-with-claude/streaming`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-token-counting', title: 'Claude Docs — Token counting', url: `${DOCS}/build-with-claude/token-counting`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'api-client-sdks', title: 'Claude Docs — Client SDKs', url: 'https://docs.claude.com/en/api/client-sdks', kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'pe-xml-tags', title: 'Claude Docs — Use XML tags to structure prompts', url: `${DOCS}/build-with-claude/prompt-engineering/use-xml-tags`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'pe-system-prompts', title: 'Claude Docs — Giving Claude a role with a system prompt', url: `${DOCS}/build-with-claude/prompt-engineering/system-prompts`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'guard-jailbreaks', title: 'Claude Docs — Mitigate jailbreaks and prompt injections', url: `${DOCS}/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'mcp-spec-transports', title: 'Model Context Protocol specification — Transports', url: 'https://modelcontextprotocol.io/specification/2025-06-18/basic/transports', kind: 'mcp-spec', verified: false, note: UNVERIFIED },
  { id: 'mcp-spec-authorization', title: 'Model Context Protocol specification — Authorization', url: 'https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization', kind: 'mcp-spec', verified: false, note: UNVERIFIED },
  { id: 'mcp-build-server', title: 'Model Context Protocol — Build an MCP server', url: 'https://modelcontextprotocol.io/quickstart/server', kind: 'mcp-spec', verified: false, note: UNVERIFIED },
  { id: 'cc-plugins', title: 'Claude Code Docs — Plugins', url: `${DOCS}/claude-code/plugins`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-iam', title: 'Claude Code Docs — Identity and access management / permission modes', url: `${DOCS}/claude-code/iam`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cc-security', title: 'Claude Code Docs — Security', url: `${DOCS}/claude-code/security`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cloud-bedrock', title: 'Claude Docs — Claude on Amazon Bedrock', url: `${DOCS}/build-with-claude/claude-on-amazon-bedrock`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'cloud-vertex', title: 'Claude Docs — Claude on Google Cloud Vertex AI', url: `${DOCS}/build-with-claude/claude-on-vertex-ai`, kind: 'anthropic-docs', verified: false, note: UNVERIFIED },
  { id: 'dev-course-pages', title: 'Anthropic Partner Academy — Developer Foundations course landing pages (public descriptions and objectives)', url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations', kind: 'academy', verified: false, note: 'Read through web search results on 2026-11-21; direct fetch blocked. Lessons are behind the partner login and were not used.' },

  // ---- App-authored ----
  { id: 'app-authored', title: 'App-authored teaching example (original; not from an official source)', url: null, kind: 'app', verified: true },
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
