import type { CaseStudy } from '../types';

export const caseStudy: CaseStudy = {
  scenario: 'devprod',
  title: 'Rolling out Claude to the Dispatch & Rating group',
  brief:
    'Harbor Freight Systems is piloting Claude Code and its internal Agent SDK agent with the Dispatch & Rating group: 40 engineers who own 22 services (14 Java, 8 Go) inside the 2-million-line monorepo. ' +
    'Today, setup is a wiki page of manual steps. Two engineers have pasted tracker tokens into a shared config snippet, and team conventions live in whichever `~/.claude/CLAUDE.md` file each person copied from the tech lead. ' +
    'The group has the issue-tracker, documentation-wiki, and ops-replica MCP servers available. Its first real assignment is a recurring production bug: some multi-stop shipments are dispatched twice after a carrier timeout. Nobody on the current team wrote the retry path, which crosses `dispatch-scheduler` (Java), `carrier-gateway` (Go), and the `dispatch_jobs` table. ' +
    'Engineers will also use the internal agent to answer "why did this job run twice?" questions that combine tracker history, wiki runbooks, and replica data.\n\n' +
    'You are the platform engineer leading the pilot. Each decision below is one setup or workflow choice; pick the option that best fits the constraints, then read the walkthrough.',
  constraints: [
    'Configuration must be shared and versioned with the monorepo, with minimal per-engineer setup.',
    'No credentials may be committed to the repository; each engineer authenticates to the MCP servers with their own token.',
    'Java and Go code are interleaved across many directories, and their conventions conflict.',
    'The bug investigation must not exhaust context: the retry path spans three services and a large legacy codebase nobody on the team knows.',
    'The ops replica is read-only and goes through failovers several times a week; answers must never present a failed lookup as "no data".',
  ],
  decisions: [
    {
      id: 'mcp-config',
      prompt:
        'First, connect all 40 engineers to the tracker, wiki, and ops-replica MCP servers. Two engineers have already pasted tokens into a shared snippet. How do you configure the servers?',
      options: [
        {
          id: 'a',
          text: 'Publish an improved wiki page listing three `claude mcp add --scope user` commands for each engineer to run, plus a prominent reminder never to paste or share tokens anywhere.',
          consequence: 'Setup stays manual and per-laptop. Server URLs keep drifting, and nothing about the configuration is versioned with the code.',
        },
        {
          id: 'b',
          text: 'Commit a project-scoped `.mcp.json` defining the three servers, with tokens referenced as variables such as `${TRACKER_TOKEN}` from each engineer’s environment.',
          consequence: 'Every clone gets identical server definitions with no manual steps, and each engineer’s own token is injected at launch, so nothing secret is in the repository. The two pasted tokens still need to be rotated.',
        },
        {
          id: 'c',
          text: 'Commit `.mcp.json` with a shared service-account token for each server, since the monorepo is private.',
          consequence: 'Credentials spread to every clone and CI cache, violating the no-credentials rule, and tracker and replica actions can no longer be attributed to individual engineers.',
        },
        {
          id: 'd',
          text: 'Document the server URLs in the project CLAUDE.md and let Claude connect to them when it needs them.',
          consequence: 'CLAUDE.md does not register MCP servers, so no tools appear. Claude improvises with curl and asks engineers to paste tokens into the conversation.',
        },
      ],
      best: 'b',
      walkthrough:
        'The constraints call for shared, versioned configuration with no credentials in the repository. A committed project-scoped `.mcp.json` handles the shared part, and `${VAR}` expansion handles the per-engineer secrets: the file names the variable, and each engineer’s shell or secret manager supplies the value.\n\n' +
        'User scope is the right home for a *personal* server, not for team infrastructure every engineer needs. Committing a shared token fails the explicit constraint even in a private repository. CLAUDE.md tells the model how to behave; it is not MCP configuration.\n\n' +
        '> The tokens already pasted into a shared snippet are exposed. Rotate them; moving to environment variables does not undo the exposure.',
    },
    {
      id: 'conventions',
      prompt:
        'Conventions currently live in personal `~/.claude/CLAUDE.md` copies. The Java and Go conventions conflict, and Go code sits under `cmd/`, `tools/`, and `services/*/go/` while Java sits under `services/*/java/` and `libs/`. Where do the conventions go?',
      options: [
        {
          id: 'a',
          text: 'A committed root CLAUDE.md for group-wide rules, plus `.claude/rules/go.md` and `java.md` with `paths:` globs per language.',
          consequence: 'Everyone gets the shared rules on clone, and each language’s conventions load only when Claude touches matching files, wherever they live, including new directories.',
        },
        {
          id: 'b',
          text: 'One committed root CLAUDE.md containing the group rules plus both language sections, clearly separated under "Go only" and "Java only" headings.',
          consequence: 'The conventions are now shared, but both conflicting sets load in every session, so Java naming keeps leaking into Go code.',
        },
        {
          id: 'c',
          text: 'Keep conventions in each engineer’s `~/.claude/CLAUDE.md`, but publish a canonical version on the wiki for people to copy.',
          consequence: 'Copies drift, new hires miss updates, and nothing is versioned with the code. This is today’s problem with a wiki link added.',
        },
      ],
      best: 'a',
      walkthrough:
        'Two separate questions are bundled here: *who* should get the instructions (everyone, so they must be committed rather than kept in user files) and *when* they should load (language conventions only for that language’s files).\n\n' +
        'A root CLAUDE.md handles the group-wide rules. Because Go and Java are interleaved across many directories, subdirectory CLAUDE.md files would be numerous and would miss new directories; `.claude/rules/` files with `paths:` globs such as `**/*.go` follow the file type instead. Headings inside one file do not stop both sets from loading, and the conflict is already visible.\n\n' +
        'Personal preferences, such as one engineer’s preferred answer style, still belong in that engineer’s `~/.claude/CLAUDE.md`.',
    },
    {
      id: 'investigation',
      prompt:
        'An engineer starts on the double-dispatch bug. Nobody knows the retry path, which spans `dispatch-scheduler`, `carrier-gateway`, and the `dispatch_jobs` table. How should the investigation be run in Claude Code?',
      options: [
        {
          id: 'a',
          text: 'Ask Claude to read every file in the three services first so it fully understands them, then start reasoning about the bug.',
          consequence: 'Thousands of files flood the main conversation; the context fills before the retry path is understood, and the bug details get crowded out.',
        },
        {
          id: 'b',
          text: 'Run a fixed checklist: read the scheduler, then the gateway, then the `dispatch_jobs` schema, then write a report, regardless of what each step turns up.',
          consequence: 'The checklist spends effort on parts that turn out to be irrelevant and cannot follow leads, such as a retry triggered by a gateway timeout flag.',
        },
        {
          id: 'c',
          text: 'Use the Explore subagent for discovery, then trace with Grep and targeted Reads, keeping identifiers in a notes file that survives `/compact`.',
          consequence: 'Discovery stays out of the main context, each lead decides the next search, and exact class names, line numbers, and job IDs survive compaction in the notes file.',
        },
        {
          id: 'd',
          text: 'Start in plan mode and ask Claude to propose a fix right away, based on the bug title and the names of the three services.',
          consequence: 'The plan is speculative because it rests on no evidence about where the second dispatch comes from, so review time goes into a fix that may target the wrong place.',
        },
      ],
      best: 'c',
      walkthrough:
        'The cause is unknown and each finding changes where to look, so the decomposition should be adaptive, not a fixed checklist. The codebase is large and unfamiliar, so discovery should be isolated: the Explore subagent reads widely in its own context and returns a summary.\n\n' +
        'Inside the main session, Grep then Read keeps reads targeted: search for where `dispatch_jobs` rows are inserted or where retries are scheduled, then read only those spots. A notes file holds what summaries tend to lose (exact identifiers, job IDs, line numbers) and is re-read after `/compact`.\n\n' +
        'Plan mode is valuable once the cause is known and the fix spans services. Using it before any evidence exists only produces a confident-sounding guess.',
    },
    {
      id: 'replica-failures',
      prompt:
        'During a replica failover, the internal agent answered "why did job 88231 run twice?" with "the database shows no duplicate dispatch records". In fact, its replica subagent had timed out and returned an empty result. What do you change?',
      options: [
        {
          id: 'a',
          text: 'Return replica timeouts as structured transient errors (`isError`, retry guidance), and have the subagent pass a structured failure up so the coordinator reports the gap.',
          consequence: 'The coordinator can tell "lookup failed" from "no rows", answers using the tracker and wiki evidence while flagging the missing database check, and suggests retrying after failover.',
        },
        {
          id: 'b',
          text: 'Make any replica failure abort the entire agent run with an error message, so engineers never get a partial answer.',
          consequence: 'Several times a week, engineers get no answer at all, even when tracker history and runbooks would have answered most of the question.',
        },
        {
          id: 'c',
          text: 'Add a system-prompt rule telling the agent: "If database results come back empty, always say the data may be unavailable rather than absent, and suggest checking again later."',
          consequence: 'Genuinely empty results now also get hedged, and because the timeout still looks identical to an empty result, the agent cannot tell the two apart.',
        },
      ],
      best: 'a',
      walkthrough:
        'The root problem is that an access failure and a valid empty result look identical by the time they reach the coordinator. The fix belongs at both layers. The MCP server should return a structured error (`isError`, a transient category, whether retrying helps), and the subagent should propagate structured failure context instead of an empty result.\n\n' +
        'Aborting the whole run throws away the tracker and wiki evidence, which is often enough to answer most of the question. A prompt-level hedge cannot work because the model never sees anything that distinguishes the two cases. It also degrades answers when the data really is empty.\n\n' +
        'The same principle applies to writes: a rejected `UPDATE` against the read-only replica should come back as a non-retryable permission error, so the agent stops rewriting SQL and drafts a migration instead.',
    },
  ],
  wrapUp:
    'The pilot’s setup rests on a few habits. Configuration that everyone needs is committed: `.mcp.json` with `${VAR}` secrets, a root CLAUDE.md, and path-scoped rules. Personal items, such as private MCP servers and preferences, stay in user scope.\n\n' +
    'Large-codebase work keeps the main context focused through isolated exploration, Grep-then-Read tracing, and a notes file that survives compaction. Tool failures carry enough structure for the agent to recover or report a gap honestly instead of inventing a "no data" conclusion.\n\n' +
    'When a constraint changes, revisit the choice. If a server were personal, user scope would be right. If all Go code lived under one directory, a subdirectory CLAUDE.md would suffice.',
  lessons: ['2.4', '3.1', '3.3', '1.6', '2.5', '5.4', '2.2', '5.3'],
};
