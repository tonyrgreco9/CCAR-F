import type { Lesson } from '../types';

// Domain 3 — Claude Code Configuration & Workflows.
// App-authored lessons. Learning points are the app's own decomposition of each task
// statement; they are not the exam guide's Knowledge/Skills bullets (guide not supplied).

const F = '```';
const NOTE_DATE = '2026-11-20';

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------
  // 3.1 CLAUDE.md hierarchy, scope, and purpose
  // ---------------------------------------------------------------------------
  {
    id: '3.1',
    title: 'Organizing CLAUDE.md by hierarchy, scope, and purpose',
    outcome:
      'Given a list of instructions for a shared repository, place each one in user, project, directory, rules, or imported memory, and use /memory to explain why a teammate is not receiving one.',
    minutes: 20,
    terms: [
      { term: 'User memory', definition: '`~/.claude/CLAUDE.md`. Applies to every project you open on your machine. Never committed, so teammates never see it.' },
      { term: 'Project memory', definition: '`./CLAUDE.md` or `./.claude/CLAUDE.md` at the repository root. Committed to version control and shared with everyone who clones the repo.' },
      { term: 'Directory memory', definition: 'A `CLAUDE.md` inside a subdirectory (for example `services/api/CLAUDE.md`). Loaded when Claude works in that part of the tree.' },
      { term: '@import', definition: 'An `@path/to/file` line inside a memory file that pulls the referenced file into memory. Relative paths resolve from the importing file; `@~/...` points into the home directory.' },
      { term: '.claude/rules/', definition: 'A directory of topic-sized Markdown rule files (testing.md, security.md). Files without `paths:` frontmatter load like project memory; files with it load conditionally.' },
      { term: '/memory', definition: 'Slash command that shows which memory files the current session has loaded and lets you open them for editing. The first tool for diagnosing missing instructions.' },
    ],
    learningPoints: [
      'Distinguish user, project, and directory CLAUDE.md files by who receives them and when they load.',
      'Decide which instructions belong in version control and which must stay personal.',
      'Use @imports to reuse existing docs and to reference per-engineer files without committing them.',
      'Split a large project CLAUDE.md into topic files under .claude/rules/.',
      'Use /memory to compare loaded memory between two sessions and find the cause of a missing instruction.',
      'Recognize when an instruction is too situational for always-loaded memory and belongs in a skill or path-scoped rule instead.',
    ],
    concept: `Claude Code reads plain Markdown instruction files, called *memory*, when a session starts and keeps them in context for the whole session. Where you put an instruction decides **who** receives it and **when**. Ask three questions about every instruction: should everyone on the repo get it, or only me? Does it apply everywhere, or only in one part of the tree? Is it relevant often enough to sit in context all the time?

### The levels

- **User memory** — \`~/.claude/CLAUDE.md\`. Lives in your home directory, applies to every project you open, and is never committed. Personal preferences ("keep explanations short", "I use fish shell") go here.
- **Project memory** — \`./CLAUDE.md\` or \`./.claude/CLAUDE.md\` at the repo root. Committed, so every teammate who clones the repo gets it. Build and test commands, coding conventions, architecture notes.
- **Directory memory** — a \`CLAUDE.md\` in a subdirectory such as \`infra/\`. Memory files in the directories above where you launched Claude are loaded at startup; files in subdirectories below it are pulled in when Claude works with files in that subtree. Use it for instructions that only make sense inside one directory.
- **Rules files** — \`.claude/rules/*.md\`. Topic-sized files that keep project memory from turning into one 900-line document. A rules file without \`paths:\` frontmatter loads like project memory; with \`paths:\` it loads only for matching files (lesson 3.3).

These files **add up**; a directory file does not replace the root file. If two loaded files contradict each other, Claude sees both, so remove the conflict instead of hoping one wins.

### Imports

A memory file can include another file with an \`@path\` line, for example \`@docs/architecture.md\` or \`@~/.claude/payments-local.md\`. Relative paths resolve from the file that contains the import. Imports let you reuse an existing doc without copying it, and let a committed file point at a personal file that each engineer creates on their own machine.

### What is shared

Only what is committed and not gitignored: project memory, committed rules files, committed directory files, and in-repo files they import. User memory, and anything imported from a home directory, exists on one machine only.

### Diagnosing a missing instruction

Run \`/memory\` in both sessions and compare the lists of loaded files. The usual causes: the instruction lives in someone's user memory; the file is uncommitted or gitignored; an import points at a path that exists only on one laptop; or the teammate launched Claude somewhere the relevant directory file has not been loaded yet.`,
    example: {
      intro:
        'Tidewater Health\'s monorepo after a cleanup. The root file stays short and imports detail; topic rules live in `.claude/rules/`; the Terraform guard lives next to the Terraform. One engineer keeps a personal import for local settings.',
      artifacts: [
        {
          lang: 'markdown',
          caption: 'CLAUDE.md (repo root, committed)',
          code: `# Tidewater monorepo

## Commands
- Install: \`pnpm install\`
- API tests: \`pnpm --filter api test\`
- Web tests: \`pnpm --filter web test\`
- Data jobs: \`cd jobs && uv run pytest\`

## Conventions
- TypeScript strict mode everywhere; no \`any\` without a comment explaining why.
- Every new module ships with tests in the same PR.
- Commit messages follow Conventional Commits.

## Architecture
@docs/architecture.md

## Personal, per-engineer settings (each engineer creates this file; it is not in the repo)
@~/.claude/tidewater-local.md`,
        },
        {
          lang: 'markdown',
          caption: 'infra/CLAUDE.md (committed, directory memory)',
          code: `# Terraform

- Never run \`terraform apply\` or \`terraform destroy\`. Produce a plan with
  \`terraform plan -out=tfplan\` and stop for human review.
- Module changes require an entry in infra/CHANGELOG.md.`,
        },
        {
          lang: 'markdown',
          caption: '.claude/rules/security.md (committed, no paths: frontmatter, so always loaded)',
          code: `# Security
- Never log patient names, dates of birth, or appointment notes.
- Read secrets from environment variables only; never hard-code them.`,
        },
        {
          lang: 'markdown',
          caption: '~/.claude/tidewater-local.md (one engineer\'s machine, not committed)',
          code: `- My local Postgres listens on port 5433.
- Use the AWS profile \`sandbox-priya\` when suggesting CLI commands.`,
        },
      ],
      walkthrough: `1. **Root \`CLAUDE.md\`** holds only what every session in every directory needs: commands, cross-cutting conventions, and an import of the existing architecture doc so it is not duplicated.
2. **\`infra/CLAUDE.md\`** carries the Terraform guard. It is directory-bound, so engineers working on the React app do not carry it around. (A rule this important should also be enforced with permissions or hooks; memory is guidance, not a gate.)
3. **\`.claude/rules/security.md\`** is a topic file without \`paths:\`, so it behaves like part of project memory but is easier to own and review separately.
4. **The \`@~/.claude/tidewater-local.md\` import** lets each engineer keep machine-specific settings for this repo without committing them. Engineers who never create the file simply get nothing from that line.

**Diagnosis scenario.** A new engineer, Sam, says Claude keeps hard-coding a port. You run \`/memory\` and see the root file, \`security.md\`, and \`~/.claude/tidewater-local.md\`. Sam runs \`/memory\` and sees the root file and \`security.md\` only, because Sam never created the personal file. The fix is not to commit Priya's port; it is to tell Sam to create his own local file, or to move a genuinely shared default (for example "read the port from \`DATABASE_URL\`") into project memory.`,
    },
    compare: {
      question: 'Where should the team\'s growing set of conventions live: one large root CLAUDE.md, or a short root file plus topic and directory files?',
      a: {
        title: 'Single root CLAUDE.md',
        body: 'Everything in one committed file. Easy to find, one place to review, and every session gets everything.',
        chooseWhen: 'The repository is small, the instructions fit comfortably on a page or two, and nearly all of them apply to every task.',
      },
      b: {
        title: 'Short root file + .claude/rules/ topics + directory CLAUDE.md files',
        body: 'Root file keeps commands and cross-cutting conventions and imports existing docs. Topic files hold areas like security or testing; directory files hold instructions that only matter in one subtree.',
        chooseWhen: 'The repo is a monorepo or the file has grown long, different owners maintain different topics, or many instructions only matter in one directory.',
      },
      decidingDetail:
        '**How many instructions apply to every task.** If almost everything is universal and short, one file is simplest. Once a meaningful share of the content only matters in one directory or one topic, splitting keeps always-loaded context small, makes ownership clear, and stops unrelated instructions from diluting the ones that matter.',
    },
    mistake: {
      mistake:
        'Putting a team convention in your own `~/.claude/CLAUDE.md` (or in an uncommitted file) and then assuming teammates get the same behavior.',
      whyTempting:
        'It works perfectly on your machine, and user memory is the first file many people discover. Nothing warns you that the file is personal, so the convention looks like it is "configured".',
      howToRecognize:
        'Claude follows the rule for you but not for a teammate on the same branch. Comparing `/memory` output shows the instruction comes from a file under your home directory, or `git status` shows the project file as untracked or ignored.',
      fix:
        'Move shared conventions into project memory (root CLAUDE.md, a committed directory CLAUDE.md, or a committed `.claude/rules/` file) and commit it. Keep only genuinely personal preferences in user memory or in a home-directory file imported with `@~/...`.',
    },
    exercise: {
      prompt:
        'Tidewater is reorganizing its memory files. For each instruction, choose where it should live.',
      inputs: `Repository layout: \`services/api\` (TypeScript), \`apps/web\` (React), \`jobs/\` (Python), \`infra/\` (Terraform). Twenty engineers share the repo.`,
      labels: ['User CLAUDE.md', 'Project CLAUDE.md', 'Subdirectory CLAUDE.md', 'Personal file imported from home directory'],
      items: [
        { id: 'i1', text: '"I prefer short answers with no recap paragraph at the end."', answer: 'User CLAUDE.md', why: 'A personal style preference that applies to every project this engineer opens, and nobody else should get it.' },
        { id: 'i2', text: '"Run `pnpm --filter api test` and `pnpm --filter web test` before saying work is done."', answer: 'Project CLAUDE.md', why: 'A team-wide workflow rule that applies across the repo, so it must be committed at the root.' },
        { id: 'i3', text: '"In this directory, never run `terraform apply`; produce a plan and stop."', answer: 'Subdirectory CLAUDE.md', why: 'The instruction only makes sense inside `infra/`, so `infra/CLAUDE.md` scopes it to the place it applies.' },
        { id: 'i4', text: '"For this repo, my local Redis is on port 6380."', answer: 'Personal file imported from home directory', why: 'It is specific to this project but true only on one machine; a home-directory file imported with `@~/...` keeps it personal without polluting other projects.' },
        { id: 'i5', text: '"Commit messages follow Conventional Commits."', answer: 'Project CLAUDE.md', why: 'Applies to every change in the repo and to every engineer, so it belongs in shared, committed memory.' },
        { id: 'i6', text: '"Python jobs use `uv run` and type hints on every public function."', answer: 'Subdirectory CLAUDE.md', why: 'Only meaningful for `jobs/`; `jobs/CLAUDE.md` keeps it out of sessions that only touch TypeScript or Terraform.' },
      ],
      solution: `Ask two questions per instruction: **shared or personal?** and **everywhere or one directory?** Shared + everywhere goes in the root \`CLAUDE.md\` (or an unconditional \`.claude/rules/\` file). Shared + one directory goes in that directory's \`CLAUDE.md\`. Personal + every project goes in \`~/.claude/CLAUDE.md\`. Personal + this project only goes in a home-directory file that the project memory imports with \`@~/...\`, so the import is shared but the content is not.`,
    },
    check: [
      {
        id: '3.1-c1',
        stem: 'Claude follows the "always add a migration test" rule for you but not for a teammate on the same commit. /memory on your machine lists ~/.claude/CLAUDE.md and ./CLAUDE.md; on theirs only ./CLAUDE.md. What is the most likely fix?',
        options: [
          { id: 'a', text: 'Ask the teammate to restart Claude Code so memory reloads' },
          { id: 'b', text: 'Move the rule from your user memory into the committed project CLAUDE.md' },
          { id: 'c', text: 'Add the rule to a CLAUDE.md in every subdirectory' },
          { id: 'd', text: 'Ask the teammate to repeat the rule at the start of each prompt' },
        ],
        correct: 'b',
        why: 'The difference in /memory output shows the rule lives in your personal ~/.claude/CLAUDE.md, which is never shared. Committing it to project memory gives everyone the same instruction.',
      },
      {
        id: '3.1-c2',
        stem: 'A root CLAUDE.md has grown to 800 lines covering testing, security, Terraform, React styling, and Python jobs. Engineers say Claude ignores some rules. Which change best addresses this?',
        options: [
          { id: 'a', text: 'Add "IMPORTANT" in capitals before every rule' },
          { id: 'b', text: 'Move the whole file into ~/.claude/CLAUDE.md for each engineer' },
          { id: 'c', text: 'Keep cross-cutting rules at the root and move topic and directory-specific rules into .claude/rules/ files and directory CLAUDE.md files' },
          { id: 'd', text: 'Delete the file and rely on Claude reading the code to infer conventions' },
        ],
        correct: 'c',
        why: 'Splitting by topic and directory shrinks always-loaded context, so the rules that remain are not diluted by unrelated material, and each file can be owned and reviewed separately.',
      },
      {
        id: '3.1-c3',
        stem: 'The project CLAUDE.md contains the line `@docs/api-style.md`. What does that line do?',
        options: [
          { id: 'a', text: 'Includes the contents of docs/api-style.md as part of memory' },
          { id: 'b', text: 'Tells Claude to open docs/api-style.md only if a user mentions it' },
          { id: 'c', text: 'Creates a link that Claude ignores unless /memory is run' },
          { id: 'd', text: 'Mentions a teammate named api-style for code review' },
        ],
        correct: 'a',
        why: 'An @path line is an import: the referenced file is loaded into memory along with the file that imports it, so an existing doc can be reused without copying it.',
      },
    ],
    review: [
      { front: 'Which CLAUDE.md files are shared with the team?', back: 'Only committed, non-ignored ones: root project memory, committed directory CLAUDE.md files, committed .claude/rules/ files, and in-repo files they import. ~/.claude/CLAUDE.md and home-directory imports are personal.' },
      { front: 'First step when a teammate\'s Claude misses an instruction?', back: 'Run /memory in both sessions and compare which memory files each one loaded.' },
      { front: 'How do you keep a per-machine setting for one project without committing it?', back: 'Put it in a file under your home directory and import it from project memory with @~/path; each engineer creates their own copy.' },
    ],
    sources: ['guide-d3', 'cc-memory', 'cc-best-practices', 'app-authored'],
    notes: [
      { date: NOTE_DATE, text: 'Import details (maximum nesting depth of imports, whether a first-time external import asks for approval) and exactly when subdirectory CLAUDE.md files are pulled in have changed across Claude Code releases. Verify against the current Memory docs.' },
      { date: NOTE_DATE, text: 'Claude Code also supports organization-managed (enterprise policy) memory and has at times supported a gitignored `CLAUDE.local.md`. Their locations and status are version-sensitive, so this lesson teaches imports from the home directory for personal per-project settings instead. Verify against current docs.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3.2 Custom slash commands and skills
  // ---------------------------------------------------------------------------
  {
    id: '3.2',
    title: 'Custom slash commands and skills',
    outcome:
      'Given a repeated team workflow, decide whether it should be a project command, a project skill, a personal variant, or a CLAUDE.md instruction, and write the file with correct frontmatter.',
    minutes: 25,
    terms: [
      { term: 'Custom slash command', definition: 'A Markdown file whose body is a saved prompt. `.claude/commands/review.md` becomes `/review` for everyone on the project; `~/.claude/commands/` holds personal ones.' },
      { term: '$ARGUMENTS', definition: 'Placeholder in a command or skill body replaced by whatever the user types after the command name, e.g. `/fix-issue 482`.' },
      { term: 'Skill', definition: 'A directory `.claude/skills/<name>/` (project) or `~/.claude/skills/<name>/` (personal) containing `SKILL.md` and optional supporting files. Claude can load it on demand when its description matches the task.' },
      { term: 'description (frontmatter)', definition: 'The text Claude uses to decide when a skill is relevant. A vague description means the skill is not discovered.' },
      { term: 'allowed-tools', definition: 'Frontmatter listing tools the command or skill may use without a permission prompt while it runs, e.g. `Read, Grep, Bash(gh issue view:*)`.' },
      { term: 'context: fork', definition: 'Skill frontmatter that runs the skill in an isolated subagent context; only its result returns to the main conversation.' },
    ],
    learningPoints: [
      'Create project commands in .claude/commands/ and personal ones in ~/.claude/commands/, using $ARGUMENTS for input.',
      'Write a SKILL.md with frontmatter: a discovery-quality description, allowed-tools, argument-hint, and context: fork where isolation helps.',
      'Choose between a skill (loaded on demand) and CLAUDE.md (always loaded) based on how often the guidance is needed.',
      'Use context: fork for verbose skills so their intermediate output does not flood the main conversation.',
      'Keep personal variants under ~/.claude/ with a distinct name instead of editing the shared project file.',
    ],
    concept: `Both commands and skills package instructions you would otherwise retype. They differ in **who triggers them** and **when they cost context**.

A **custom slash command** is a saved prompt. You type \`/name\` and the file's body is sent as your message. Project commands live in \`.claude/commands/\` and are committed, so the whole team gets the same \`/review\` or \`/fix-issue\`. Personal commands live in \`~/.claude/commands/\` and follow you across projects. Inside the body, \`$ARGUMENTS\` is replaced by whatever you typed after the name, so \`/fix-issue 482\` turns "Fix issue #$ARGUMENTS" into "Fix issue #482".

A **skill** is a folder: \`.claude/skills/<name>/SKILL.md\` (project) or \`~/.claude/skills/<name>/SKILL.md\` (personal), plus any reference files or scripts it needs. Its YAML frontmatter matters:

- \`name\` and **\`description\`** — until a skill is used, essentially only this metadata sits in context. Claude reads the description to decide whether the skill applies, so write *what it does and when to use it* in concrete words ("Use when adding or altering database tables").
- \`allowed-tools\` — tools the skill may use without prompting, scoped as tightly as possible (\`Bash(pnpm migrate:create:*)\` rather than all of Bash).
- \`argument-hint\` — the hint shown when someone invokes it by name, e.g. \`<issue-number>\`.
- \`context: fork\` — runs the skill in an isolated subagent context. Use it for noisy work (audits, broad searches) where you only want the conclusion back.

### Skills versus CLAUDE.md

CLAUDE.md is **always loaded**: every token is paid in every session. A skill is **loaded on demand**: the full instructions enter context only when the skill is invoked or matched. So a 60-line release procedure used twice a month belongs in a skill; "run tests with \`pnpm test\`" belongs in CLAUDE.md.

### Personal variants

If you want a different flavor of a team skill (a terser PR summary, a different checklist), do not edit the committed file: that changes it for everyone. Copy it to \`~/.claude/skills/\` under a distinct name, such as \`my-pr-summary\`, and adjust it there.

> In newer Claude Code releases, custom commands have been folded into skills: a skill can also be invoked as \`/name\`, and existing \`.claude/commands/\` files keep working. The placement and sharing rules above are the same either way.`,
    example: {
      intro:
        'Three files from Tidewater\'s repo: a project command for fixing issues, a project skill for database migrations, and a forked skill for a noisy dependency audit. One engineer also keeps a personal variant.',
      artifacts: [
        {
          lang: 'markdown',
          caption: '.claude/commands/fix-issue.md (project command, committed)',
          code: `---
description: Fix a GitHub issue using the team workflow
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Read, Grep, Glob, Edit
---
Fix GitHub issue #$ARGUMENTS.

1. Run \`gh issue view $ARGUMENTS\` and summarize the expected vs. actual behavior.
2. Find the relevant code with Grep/Glob before editing anything.
3. Write a failing test that reproduces the issue, then make it pass.
4. Report the files changed and the test command you ran.`,
        },
        {
          lang: 'markdown',
          caption: '.claude/skills/db-migration/SKILL.md (project skill, committed)',
          code: `---
name: db-migration
description: Create PostgreSQL schema migrations for services/api. Use when the user asks to add, rename, or drop tables, columns, indexes, or constraints.
argument-hint: <short description of the schema change>
allowed-tools: Read, Grep, Glob, Bash(pnpm --filter api migrate:create:*)
---
# Creating a migration

1. Generate the file: \`pnpm --filter api migrate:create <name>\`.
2. Write both up and down steps. Down must fully reverse up.
3. Never drop a column in the same release that stops writing to it;
   see reference/expand-contract.md in this skill folder.
4. Add a test in services/api/test/migrations/ that applies up then down.`,
        },
        {
          lang: 'markdown',
          caption: '.claude/skills/dep-audit/SKILL.md (forked context)',
          code: `---
name: dep-audit
description: Audit npm and Python dependencies for outdated or vulnerable packages and summarize what to upgrade. Use when asked about dependency health or upgrade planning.
context: fork
allowed-tools: Read, Glob, Bash(pnpm outdated:*), Bash(pnpm audit:*), Bash(uv pip list:*)
---
Run the audits, then return ONLY a summary: at most 10 packages, each with
current version, target version, severity, and one-line reason.`,
        },
        {
          lang: 'markdown',
          caption: '~/.claude/skills/my-pr-summary/SKILL.md (personal variant, not committed)',
          code: `---
name: my-pr-summary
description: Write a terse PR description (max 5 bullets, no headings) for my own PRs.
---
Summarize the current branch's diff against main in at most five bullets.`,
        },
      ],
      walkthrough: `- **\`/fix-issue 482\`** expands \`$ARGUMENTS\` to \`482\` in both the heading and the \`gh issue view\` call. Because it is in \`.claude/commands/\`, every engineer has it after pulling. \`allowed-tools\` pre-approves only read-oriented tools and one narrow \`gh\` subcommand.
- **\`db-migration\`** is discovered from its description: when someone says "add a \`cancelled_at\` column to appointments", the description's wording ("add ... columns") matches, so Claude loads the full procedure. The rest of the time only its short metadata is in context, unlike a CLAUDE.md section, which would be paid for in every session. The supporting \`reference/expand-contract.md\` file is read only if needed.
- **\`dep-audit\`** uses \`context: fork\`. \`pnpm outdated\` and \`pnpm audit\` produce hundreds of lines; running them in a forked context means the main conversation receives only the ten-line summary.
- **\`my-pr-summary\`** is a personal variant. The team's committed PR-summary skill is untouched, and the distinct name avoids any question of which one wins if two skills share a name.`,
    },
    compare: {
      question: 'The team has a 70-line procedure for writing database migrations. Should it live in CLAUDE.md or in a skill?',
      a: {
        title: 'Section in project CLAUDE.md',
        body: 'Always loaded, so Claude can never miss it. No invocation or discovery step.',
        chooseWhen: 'The guidance is short and relevant to most sessions, for example the test command or a convention that touches nearly every change.',
      },
      b: {
        title: 'Project skill in .claude/skills/db-migration/',
        body: 'Only the name and description are in context until needed; the full procedure and its reference files load when a migration task comes up or someone invokes it.',
        chooseWhen: 'The procedure is long, task-specific, and used occasionally, and its description can clearly say when it applies.',
      },
      decidingDetail:
        '**How often the guidance is needed versus how much it costs to carry.** Always-relevant, short guidance belongs in CLAUDE.md. Long, occasional procedures belong in a skill, because CLAUDE.md is paid in every session while a skill\'s body is loaded only on demand. If you pick a skill, its description must name the triggering tasks or it will not be discovered.',
    },
    mistake: {
      mistake:
        'Putting every workflow (release steps, migration procedure, incident checklist, audit instructions) into the root CLAUDE.md so that "Claude always knows them".',
      whyTempting:
        'CLAUDE.md is the first configuration file people learn, it is guaranteed to load, and adding a section feels safer than relying on a skill being discovered.',
      howToRecognize:
        'CLAUDE.md is hundreds of lines long, most sections are irrelevant to a typical task, and Claude starts missing or blending instructions. Many sections begin with "When doing X..." — a sign they are task-specific.',
      fix:
        'Keep CLAUDE.md for short, always-relevant guidance. Move each task-specific procedure into `.claude/skills/<name>/SKILL.md` with a description that states when to use it, scoped `allowed-tools`, and `context: fork` if it produces verbose output. Commit project skills; keep personal variants under `~/.claude/skills/`.',
    },
    exercise: {
      prompt: 'For each need, choose the best place to put it.',
      inputs: 'Tidewater: twenty engineers, shared monorepo, Claude Code with skills support.',
      labels: ['Project command or skill (.claude/)', 'Personal command or skill (~/.claude/)', 'CLAUDE.md', 'Skill with context: fork'],
      items: [
        { id: 'i1', text: 'A `/release-notes <version>` prompt every engineer should use the same way.', answer: 'Project command or skill (.claude/)', why: 'Shared, invoked by name, takes an argument via $ARGUMENTS; committing it under .claude/ gives everyone the same version.' },
        { id: 'i2', text: 'One engineer wants a shorter version of the team\'s PR-summary skill.', answer: 'Personal command or skill (~/.claude/)', why: 'A personal preference; a distinct-named copy in ~/.claude/skills/ avoids changing the shared skill for the whole team.' },
        { id: 'i3', text: '"Use pnpm, never npm or yarn."', answer: 'CLAUDE.md', why: 'Short and relevant to nearly every session, so the always-loaded cost is worth paying.' },
        { id: 'i4', text: 'A license-compliance scan that reads every package manifest and prints thousands of lines before concluding.', answer: 'Skill with context: fork', why: 'The intermediate output is huge and only the conclusion matters; forking keeps it out of the main conversation.' },
        { id: 'i5', text: 'A 50-line checklist for adding a new React route, used a few times a month.', answer: 'Project command or skill (.claude/)', why: 'Long, occasional, and team-wide: a project skill loads it on demand instead of paying for it in every session.' },
      ],
      solution: `Sort by three questions. **Shared or personal?** Shared goes under the repo's \`.claude/\`; personal goes under \`~/.claude/\`. **Always relevant or occasional?** Always relevant and short goes in CLAUDE.md; occasional goes in a command or skill. **Verbose execution?** If the work floods context with intermediate output, add \`context: fork\` so only the result returns.`,
    },
    check: [
      {
        id: '3.2-c1',
        stem: 'A team skill exists at .claude/skills/api-docs/SKILL.md but Claude never uses it when engineers ask to "document the new endpoints". Its frontmatter says `description: Helper for docs`. What is the most likely fix?',
        options: [
          { id: 'a', text: 'Move the skill body into CLAUDE.md' },
          { id: 'b', text: 'Add `context: fork` to the frontmatter' },
          { id: 'c', text: 'Rewrite the description to say what it does and when to use it, e.g. "Generate OpenAPI docs for services/api endpoints. Use when asked to document API routes."' },
          { id: 'd', text: 'Rename the folder to api-docs-skill' },
        ],
        correct: 'c',
        why: 'Claude decides whether a skill applies from its description. "Helper for docs" gives no trigger; a concrete description naming the task and when to use it enables discovery.',
      },
      {
        id: '3.2-c2',
        stem: 'A project command at .claude/commands/triage.md contains "Triage incident $ARGUMENTS". An engineer types `/triage INC-2291 payments`. What text replaces $ARGUMENTS?',
        options: [
          { id: 'a', text: 'Nothing; $ARGUMENTS is only filled for skills' },
          { id: 'b', text: 'INC-2291 payments' },
          { id: 'c', text: 'Only INC-2291' },
          { id: 'd', text: 'The contents of the current file' },
        ],
        correct: 'b',
        why: '$ARGUMENTS is replaced with everything typed after the command name. Positional placeholders such as $1 exist for picking out individual arguments.',
      },
      {
        id: '3.2-c3',
        stem: 'An engineer wants a variant of the shared `pr-summary` skill that writes in their preferred style. What should they do?',
        options: [
          { id: 'a', text: 'Edit .claude/skills/pr-summary/SKILL.md and commit it' },
          { id: 'b', text: 'Add their style rules to the project CLAUDE.md' },
          { id: 'c', text: 'Create ~/.claude/skills/my-pr-summary/SKILL.md with their variant' },
          { id: 'd', text: 'Ask Claude to remember the style at the start of each session' },
        ],
        correct: 'c',
        why: 'A personal skill under ~/.claude/skills/ with a distinct name gives them the variant without changing the committed team skill or adding personal preferences to shared memory.',
      },
    ],
    review: [
      { front: 'Skill vs CLAUDE.md: when is each loaded?', back: 'CLAUDE.md is always loaded in every session. A skill\'s full body loads on demand, when invoked or when its description matches the task; until then essentially only its metadata is in context.' },
      { front: 'What does `context: fork` do in SKILL.md?', back: 'Runs the skill in an isolated subagent context so its verbose intermediate work stays out of the main conversation; only the result comes back.' },
      { front: 'Project vs personal command locations?', back: 'Project: .claude/commands/ (committed, shared). Personal: ~/.claude/commands/ (your machine, all projects). Skills mirror this with .claude/skills/ and ~/.claude/skills/.' },
    ],
    sources: ['guide-d3', 'cc-slash-commands', 'cc-skills', 'cc-best-practices'],
    notes: [
      { date: NOTE_DATE, text: 'Newer Claude Code releases merged custom slash commands into skills: skills can be invoked as `/name` and `.claude/commands/` files continue to work. Exact behavior when a command and a skill share a name, and which location wins when project and personal skills share a name, may vary by version. Verify against current docs.' },
      { date: NOTE_DATE, text: 'Skill frontmatter keys beyond `name` and `description` (for example `allowed-tools`, `context: fork`, an `agent` field selecting the subagent type for forked skills, `argument-hint`, and keys that control whether Claude may invoke a skill automatically) have been added over several releases. Verify key names and semantics against the current Skills docs.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3.3 Path-specific rules
  // ---------------------------------------------------------------------------
  {
    id: '3.3',
    title: 'Path-specific rules for conditional loading',
    outcome:
      'Given a convention and the files it governs, decide between a .claude/rules/ file with a paths: glob, a subdirectory CLAUDE.md, or always-loaded memory, and write the frontmatter.',
    minutes: 15,
    terms: [
      { term: 'Path-scoped rule', definition: 'A Markdown file in `.claude/rules/` whose YAML frontmatter has a `paths:` list of globs. It loads only when Claude works with files matching one of them.' },
      { term: 'Glob', definition: 'A file pattern. `**` matches any number of directories, `*` matches within one name: `**/*.test.ts` matches test files at any depth.' },
      { term: 'Unconditional rule', definition: 'A `.claude/rules/` file without `paths:` frontmatter. It loads every session, like project CLAUDE.md.' },
      { term: 'Directory-bound memory', definition: 'A subdirectory CLAUDE.md. It applies to one subtree, so it cannot express "every test file in every package".' },
    ],
    learningPoints: [
      'Write .claude/rules/*.md files with paths: glob frontmatter.',
      'Recognize conventions that cut across many directories (test files, migrations, stories) and scope them by glob.',
      'Choose a subdirectory CLAUDE.md when the instruction is genuinely bound to one directory tree.',
      'Explain the token savings of conditional loading compared with always-loaded memory.',
      'Check globs against real paths so a rule neither misses files nor loads everywhere.',
    ],
    concept: `Some conventions are about **a kind of file**, not a place. "Tests use Vitest, never Jest", "every migration needs a down step", "Storybook stories use CSF3" — these files are scattered across dozens of folders. You could repeat the rule in every folder's CLAUDE.md, or put it in the root file where every session pays for it. Path-specific rules give you a third choice: write the rule once and have it load **only when Claude works with matching files**.

### How it works

Create a Markdown file in \`.claude/rules/\` and add YAML frontmatter with a \`paths:\` list:

${F}markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---
# Test conventions
- Use Vitest (\`describe\`, \`it\`, \`expect\` from 'vitest').
${F}

When Claude reads or works on \`services/api/src/billing/invoice.test.ts\` or \`apps/web/src/Button.test.tsx\`, the rule is loaded. In a session that only touches Terraform, it never enters context.

A rules file **without** \`paths:\` is unconditional and behaves like project memory. Both kinds are committed and shared.

### Choosing between rules and directory files

- **Path-scoped rule** — the convention follows a *file pattern* that spans many directories: \`**/*.test.ts\`, \`**/migrations/*.sql\`, \`**/*.stories.tsx\`. One file, one owner, no duplication.
- **Subdirectory CLAUDE.md** — the instruction is about *one place*: "in \`infra/\`, never apply". It loads when Claude works in that subtree and is easy to find next to the code.
- **Project CLAUDE.md / unconditional rule** — it applies to nearly every task.

A useful test: if you would have to copy the instruction into more than one directory file, it is a pattern, so use a glob.

### Why it matters

Always-loaded memory costs tokens in every session and dilutes attention: a React engineer does not need Python packaging rules. Conditional loading keeps the baseline small and makes the relevant rule appear exactly when it is needed. It also prevents drift, because one rule file replaces several copies that would otherwise diverge.

### Writing good globs

Quote the patterns, test them against real paths, and prefer specific patterns (\`services/*/migrations/**\`) over broad ones (\`**/*.sql\`) when only some matches should trigger the rule.`,
    example: {
      intro:
        'Tidewater has tests in four packages, SQL migrations in two services, and React stories throughout `apps/web`. Before the change, test conventions were copied into four directory CLAUDE.md files and had drifted apart.',
      artifacts: [
        {
          lang: 'markdown',
          caption: '.claude/rules/testing.md',
          code: `---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---
# Test conventions
- Vitest only. Import \`describe\`, \`it\`, \`expect\`, \`vi\` from 'vitest'.
- One behavior per \`it\`; name it as a sentence ("rejects overlapping slots").
- Use the builders in test/factories/; do not hand-write fixture objects.
- Never call real network services; mock with \`vi.mock\`.`,
        },
        {
          lang: 'markdown',
          caption: '.claude/rules/migrations.md',
          code: `---
paths:
  - "services/*/migrations/**"
---
# Migrations
- Every migration has an up and a down step; down fully reverses up.
- Expand/contract: add new columns nullable, backfill, then constrain in a later release.`,
        },
        {
          lang: 'markdown',
          caption: 'infra/CLAUDE.md (kept as a directory file)',
          code: `# Terraform
- Never run \`terraform apply\`; produce a plan and stop for review.`,
        },
        {
          lang: 'text',
          caption: 'Which memory loads for three different tasks (illustrative)',
          code: `Task: "fix the flaky test in apps/web/src/Calendar.test.tsx"
  loaded: CLAUDE.md, rules/testing.md
Task: "add a cancelled_at column in services/api"
  loaded: CLAUDE.md, rules/migrations.md (once Claude works in services/api/migrations/)
Task: "update the RDS instance size"
  loaded: CLAUDE.md, infra/CLAUDE.md`,
        },
      ],
      walkthrough: `1. **Test conventions became one rule file.** The four drifting copies are deleted. \`**/*.test.ts\` and \`**/*.test.tsx\` match test files in every package at any depth, so new packages are covered automatically.
2. **Migrations use a narrower glob.** \`services/*/migrations/**\` matches only the migration folders, not every \`.sql\` file (the data jobs also contain ad-hoc SQL queries that should not trigger migration rules).
3. **Terraform stays a directory file.** All Terraform lives under \`infra/\`; a directory file is the simplest, most discoverable home for a rule bound to one place.
4. **The token effect.** The Terraform task never loads the test or migration rules, and the flaky-test task never loads Terraform guidance. Each session carries the root file plus only what applies.`,
    },
    compare: {
      question: 'Where should "test files use Vitest and the shared factories" live when test files exist in services/api, apps/web, packages/ui, and packages/shared?',
      a: {
        title: '.claude/rules/testing.md with paths: ["**/*.test.ts", "**/*.test.tsx"]',
        body: 'One file, loaded whenever Claude works with any matching test file in any package.',
        chooseWhen: 'The convention follows a file naming pattern that appears across many directories, including ones added later.',
      },
      b: {
        title: 'A CLAUDE.md in each package directory',
        body: 'Each package documents its own testing approach next to its code.',
        chooseWhen: 'Each package genuinely has different testing conventions, or the rule only applies inside one directory tree.',
      },
      decidingDetail:
        '**Whether the instruction is tied to a file pattern or to a place.** A rule that applies to every `*.test.ts` regardless of directory is a pattern, so a glob-scoped rules file avoids duplication and drift. An instruction that applies to everything inside one directory, and nothing outside it, is a place, so a directory CLAUDE.md is simpler.',
    },
    mistake: {
      mistake:
        'Putting conventions for specific file types (tests, migrations, stories) in the root CLAUDE.md, or copying them into several directory CLAUDE.md files.',
      whyTempting:
        'The root file guarantees the rule is always present, and directory files feel natural because they sit next to the code. Neither requires learning frontmatter.',
      howToRecognize:
        'The root file has sections that start "When writing tests..." or "For migrations...", or the same paragraph appears in several directory files with small differences. Engineers working in unrelated areas carry those instructions anyway.',
      fix:
        'Move each pattern-based convention into `.claude/rules/<topic>.md` with a `paths:` list of quoted globs that match exactly the governed files. Delete the duplicates. Keep directory CLAUDE.md files only for instructions bound to that directory.',
    },
    exercise: {
      prompt: 'Choose how each instruction should be loaded.',
      inputs: `Monorepo: \`services/api\`, \`services/notify\`, \`apps/web\`, \`packages/ui\`, \`jobs/\`, \`infra/\`. Tests are \`*.test.ts(x)\` everywhere; stories are \`*.stories.tsx\` in apps/web and packages/ui.`,
      labels: ['Path-scoped rule (.claude/rules + paths)', 'Subdirectory CLAUDE.md', 'Unconditional rule / project CLAUDE.md'],
      items: [
        { id: 'i1', text: '"Stories use CSF3 and must include a `play` interaction test."', answer: 'Path-scoped rule (.claude/rules + paths)', why: 'Applies to `**/*.stories.tsx` in two different trees; a glob covers both without duplication.' },
        { id: 'i2', text: '"In jobs/, run everything with `uv run`; never pip install globally."', answer: 'Subdirectory CLAUDE.md', why: 'Bound to one directory; everything in `jobs/` and nothing outside it.' },
        { id: 'i3', text: '"Never commit secrets; read configuration from environment variables."', answer: 'Unconditional rule / project CLAUDE.md', why: 'Relevant to every change in every directory, so it should always be loaded.' },
        { id: 'i4', text: '"Test files use Vitest and the factories in test/factories/."', answer: 'Path-scoped rule (.claude/rules + paths)', why: 'Tied to the `*.test.ts(x)` pattern across all packages.' },
        { id: 'i5', text: '"In infra/, produce a plan and never apply."', answer: 'Subdirectory CLAUDE.md', why: 'All Terraform lives under one directory, so a directory file is the simplest scoped home.' },
      ],
      solution: `If the instruction follows a **file pattern** across directories, use a rules file with \`paths:\`. If it follows **one directory**, use that directory's CLAUDE.md. If it applies to **nearly every task**, keep it always loaded. When in doubt, ask: "Would I need to copy this into more than one directory file?" If yes, use a glob.`,
    },
    check: [
      {
        id: '3.3-c1',
        stem: 'You want React component test conventions to load whenever Claude edits any *.test.tsx file in apps/web or packages/ui, and at no other time. What should you create?',
        options: [
          { id: 'a', text: 'A section in the root CLAUDE.md headed "Component tests"' },
          { id: 'b', text: 'A .claude/rules/component-tests.md file with `paths:` listing "**/*.test.tsx"' },
          { id: 'c', text: 'A CLAUDE.md file in apps/web only' },
          { id: 'd', text: 'A personal ~/.claude/CLAUDE.md entry for each engineer' },
        ],
        correct: 'b',
        why: 'A paths: glob loads the rule only when matching files are involved, in both directories. The root file would load it everywhere; an apps/web file would miss packages/ui.',
      },
      {
        id: '3.3-c2',
        stem: 'A .claude/rules/style.md file has no YAML frontmatter. When is it loaded?',
        options: [
          { id: 'a', text: 'Every session, like project memory' },
          { id: 'b', text: 'Never, because it lacks paths:' },
          { id: 'c', text: 'Only when a user types /style' },
          { id: 'd', text: 'Only when Claude works in the .claude/ directory' },
        ],
        correct: 'a',
        why: 'Rules files without paths: are unconditional; they load like project CLAUDE.md. paths: frontmatter is what makes a rule conditional.',
      },
      {
        id: '3.3-c3',
        stem: 'What is the main benefit of moving migration rules from the root CLAUDE.md into a rule scoped to "services/*/migrations/**"?',
        options: [
          { id: 'a', text: 'Migrations will be applied automatically' },
          { id: 'b', text: 'The rule becomes a deterministic gate that blocks bad migrations' },
          { id: 'c', text: 'Sessions that never touch migrations do not spend context on the rule, and it appears when migration files are involved' },
          { id: 'd', text: 'The rule stops being shared through version control' },
        ],
        correct: 'c',
        why: 'Conditional loading reduces always-loaded tokens and keeps unrelated sessions focused. It is still guidance, not enforcement, and the rule file is still committed and shared.',
      },
    ],
    review: [
      { front: 'Frontmatter that makes a .claude/rules file conditional?', back: 'A YAML `paths:` list of globs, e.g. paths: ["**/*.test.ts"]. The rule loads only when Claude works with matching files.' },
      { front: 'Glob rule vs subdirectory CLAUDE.md?', back: 'Glob rule: a file pattern that spans many directories (tests, migrations, stories). Directory CLAUDE.md: an instruction bound to one subtree.' },
    ],
    sources: ['guide-d3', 'cc-memory', 'app-authored'],
    notes: [
      { date: NOTE_DATE, text: 'Path-scoped rules in `.claude/rules/` are a relatively recent Claude Code feature. The exact trigger (reading a matching file versus creating or editing one), supported glob syntax such as brace expansion, and whether user-level `~/.claude/rules/` is supported may differ by version. Verify against the current Memory docs.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3.4 Plan mode vs direct execution
  // ---------------------------------------------------------------------------
  {
    id: '3.4',
    title: 'Plan mode versus direct execution',
    outcome:
      'Given a coding task description, decide whether to use plan mode, direct execution, or an Explore subagent first, and sequence them when a task needs more than one.',
    minutes: 15,
    terms: [
      { term: 'Plan mode', definition: 'A Claude Code mode in which Claude can read and search but not edit files or run changing commands. It investigates and proposes a plan for you to approve before any edits.' },
      { term: 'Direct execution', definition: 'Working in normal mode: Claude reads, edits, and runs commands (subject to permissions) straight away.' },
      { term: 'Explore subagent', definition: 'A built-in read-only subagent that searches the codebase in its own context window and returns a summary, keeping verbose discovery out of the main conversation.' },
      { term: 'Plan-then-execute', definition: 'Approve a plan from plan mode, then switch to normal (or auto-accept edits) mode to carry it out.' },
    ],
    learningPoints: [
      'Identify tasks that warrant plan mode: multi-file, architectural, risky, or ambiguous changes.',
      'Identify tasks suited to direct execution: small, clear, well-scoped changes with an obvious verification.',
      'Use an Explore subagent to keep verbose discovery from filling the main context.',
      'Combine plan mode and execution: review and correct the plan before any edits, then execute.',
      'Recognize the costs of over-planning trivial work and of under-planning wide changes.',
    ],
    concept: `Before Claude edits anything, decide **how much thinking should happen before the first change**. Claude Code gives you three tools for that decision.

**Plan mode** makes the session read-only. Claude can read files, search, and reason, but it cannot edit files or run changing commands. It explores, then presents a plan: which files change, in what order, what risks exist, and how to verify. You approve, correct, or reject the plan before any code is touched. You switch into it from the permission-mode toggle in the session (Shift+Tab cycles modes) or start a session in it with \`--permission-mode plan\`.

**Direct execution** is the normal mode: Claude reads, edits, and runs commands as it goes, with your permission settings deciding what needs approval.

An **Explore subagent** is a read-only helper with its own context window. It does the noisy part of discovery — dozens of Grep hits, long files, directory listings — and hands back a short summary. Your main conversation keeps the conclusions, not the raw search output.

### When to plan

Use plan mode when a wrong first step is expensive:

- the change touches **many files** or crosses services (renaming a domain concept, changing an API contract);
- it is **architectural** (introducing a queue, splitting a module, changing auth);
- the request is **ambiguous** and you need to see Claude's interpretation before it acts;
- the area is **unfamiliar** and the approach is not obvious.

The plan is cheap to fix; a half-finished, 30-file edit in the wrong direction is not.

### When to execute directly

Use direct execution when the task is **clear and scoped**: fix a typo, add a field to one form, update a dependency with a known changelog, fix a bug with an obvious stack trace and a test to prove it. Planning these adds review overhead without reducing risk.

### Combining them

Large work usually runs as a sequence: delegate discovery to an Explore subagent ("find every place that reads appointment status"), enter plan mode and ask for a plan based on that summary, review and correct it, then leave plan mode and execute step by step, running tests after each step. For long efforts, ask Claude to write the plan to a file so it survives \`/compact\` or a new session.`,
    example: {
      intro:
        'Two requests arrive at Tidewater on the same morning. One is planned; the other is executed directly.',
      artifacts: [
        {
          lang: 'text',
          caption: 'Request 1 (plan mode): replace boolean appointment status with an enum',
          code: `[plan mode]
> Appointments currently use isCancelled and isNoShow booleans. Replace them
> with a status enum (scheduled | cancelled | no_show | completed) across the
> API, web app, and data jobs. Use an Explore subagent to find every reader and
> writer first, then propose a plan. Do not edit anything yet.

Explore subagent summary (returned to main context):
- 14 readers in services/api, 9 in apps/web, 3 in jobs/
- 1 Postgres column pair; 2 analytics views depend on isNoShow
- Notification service in services/notify filters on isCancelled

Proposed plan:
1. Migration: add nullable status column; backfill from booleans.
2. API: write both representations; read from status.
3. Web: switch components to status; update tests.
4. jobs/ and analytics views: switch to status.
5. Later release: drop booleans (separate PR).
Risks: notify service filter; analytics views. Verify: full test suite + view diffs.

> Step 4 should come before step 3: analytics owners need a week's notice.
> Also keep notify unchanged until step 5. Update the plan, then proceed.`,
        },
        {
          lang: 'text',
          caption: 'Request 2 (direct execution): a clear, scoped bug',
          code: `> The reminder email shows the clinic phone number without the area code.
> Fix formatPhone in services/notify/src/format.ts so it returns
> "(555) 123-4567" for "5551234567", add a test, and run
> pnpm --filter notify test.`,
        },
      ],
      walkthrough: `- **Request 1 is planned** because it touches three codebases, a database column, analytics views, and a separate service, and the order matters. Discovery goes to an Explore subagent so 26 search hits do not flood the main context; the main session gets a structured summary. The engineer catches two ordering problems in the plan (analytics notice, notify last) **before** any file is changed. Only then does the session leave plan mode and execute step by step.
- **Request 2 is executed directly.** It names one function, the expected input and output, the test, and the verification command. A plan would restate the request. If the fix turned out to require touching many files, that would be the signal to stop and switch to plan mode.
- **The decision signal** was not the size of the request text but the **blast radius and ambiguity** of the change.`,
    },
    compare: {
      question: 'For a change, should Claude start in plan mode or go straight to execution?',
      a: {
        title: 'Plan mode first',
        body: 'Read-only exploration, a written plan, human review and correction, then execution.',
        chooseWhen: 'The change spans many files or services, alters architecture or contracts, has unclear requirements, or is in unfamiliar code where the approach is not obvious.',
      },
      b: {
        title: 'Direct execution',
        body: 'Claude edits and verifies immediately under normal permissions.',
        chooseWhen: 'The change is small and well specified, the location is known, and a test or command clearly verifies it.',
      },
      decidingDetail:
        '**Blast radius and ambiguity.** If a wrong first move would spread across many files, break contracts, or rest on a guess about what you meant, plan first so the guess is visible and cheap to correct. If the target, expected result, and verification are all stated, planning only adds overhead.',
    },
    mistake: {
      mistake:
        'Asking for a wide, ambiguous change ("migrate us from REST to GraphQL for appointments") in normal mode and letting Claude start editing immediately.',
      whyTempting:
        'Direct execution feels faster, Claude usually does start sensibly, and planning feels like bureaucracy when you are eager to see progress.',
      howToRecognize:
        'Midway through, you discover Claude chose an approach you would have rejected, many files are half-changed, and undoing them costs more than the original task. Or context is full of search output before any meaningful edit.',
      fix:
        'Switch to plan mode for multi-file, architectural, or ambiguous work. Delegate broad discovery to an Explore subagent, review the proposed plan, correct its order and scope, optionally save it to a file, then execute in steps with tests between them.',
    },
    exercise: {
      prompt: 'For each task, choose the best starting approach.',
      inputs: 'Tidewater monorepo; engineers use Claude Code interactively.',
      labels: ['Plan mode', 'Direct execution', 'Explore subagent first'],
      items: [
        { id: 'i1', text: 'Rename the `Practitioner` domain concept to `Clinician` across API, web, jobs, and database.', answer: 'Plan mode', why: 'Multi-codebase, includes a schema change, and order matters; the plan needs review before edits.' },
        { id: 'i2', text: 'Change the "Book now" button label to "Book appointment" in apps/web/src/BookButton.tsx.', answer: 'Direct execution', why: 'One file, exact change stated, trivially verifiable.' },
        { id: 'i3', text: '"Which services read from the appointments table, and how?" — before deciding anything.', answer: 'Explore subagent first', why: 'A discovery question whose raw search output would be large; the subagent returns a summary and keeps the main context clean.' },
        { id: 'i4', text: '"Make scheduling faster" with no metrics or target named.', answer: 'Plan mode', why: 'Ambiguous goal; plan mode surfaces Claude\'s interpretation and proposed measurements before anything changes.' },
        { id: 'i5', text: 'Fix a null check in `getSlotsForDay` where the stack trace points at line 42; a failing test already exists.', answer: 'Direct execution', why: 'Location, cause, and verification are known; planning adds nothing.' },
      ],
      solution: `Use **plan mode** when the change is wide, architectural, or ambiguous. Use **direct execution** when the target and verification are explicit. Use an **Explore subagent** when the immediate need is understanding a large area and the raw findings would bloat context. Real work often chains them: explore, plan, execute.`,
    },
    check: [
      {
        id: '3.4-c1',
        stem: 'An engineer asks Claude to introduce a message queue between the API and the notification service, touching both services, config, and deployment files. Which approach fits best?',
        options: [
          { id: 'a', text: 'Direct execution, reviewing the final diff at the end' },
          { id: 'b', text: 'Plan mode: explore, propose a plan, review it, then execute' },
          { id: 'c', text: 'Ask Claude to make the change in one response with no tool calls' },
          { id: 'd', text: 'Use /clear before every file edit' },
        ],
        correct: 'b',
        why: 'An architectural, multi-service change has a large blast radius; a reviewed plan catches wrong approaches before any file changes.',
      },
      {
        id: '3.4-c2',
        stem: 'What can Claude do while in plan mode?',
        options: [
          { id: 'a', text: 'Edit files but not run Bash commands' },
          { id: 'b', text: 'Run any command but not edit files' },
          { id: 'c', text: 'Read and search the codebase and propose a plan, without editing files' },
          { id: 'd', text: 'Only answer questions from memory, without reading files' },
        ],
        correct: 'c',
        why: 'Plan mode is read-only exploration followed by a proposed plan; edits wait until the plan is approved and the session leaves plan mode.',
      },
      {
        id: '3.4-c3',
        stem: 'Mapping every caller of a legacy date helper produces hundreds of grep matches, and the main session is already long. What helps most?',
        options: [
          { id: 'a', text: 'Paste all matches into the main conversation for completeness' },
          { id: 'b', text: 'Delegate the search to an Explore subagent and keep only its summary' },
          { id: 'c', text: 'Switch to direct execution and edit callers as they are found' },
          { id: 'd', text: 'Put the list of callers into CLAUDE.md' },
        ],
        correct: 'b',
        why: 'The subagent absorbs the verbose discovery in its own context and returns a concise summary, preserving the main context for planning and editing.',
      },
    ],
    review: [
      { front: 'Plan mode is for...', back: 'Multi-file, architectural, risky, or ambiguous work, where reviewing the approach before any edit is cheaper than undoing a wrong one.' },
      { front: 'Direct execution is for...', back: 'Clear, scoped changes where the location, expected result, and verification are already known.' },
      { front: 'Why an Explore subagent?', back: 'It runs verbose discovery in its own context and returns a summary, so search noise does not fill the main conversation.' },
    ],
    sources: ['guide-d3', 'cc-workflows', 'cc-subagents', 'cc-best-practices'],
    notes: [
      { date: NOTE_DATE, text: 'How to enter plan mode (the Shift+Tab permission-mode cycle, `--permission-mode plan`, or a slash command in some versions), and the built-in Explore subagent\'s name, model, and tool set, vary by Claude Code version. Verify against current docs.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3.5 Iterative refinement and concrete feedback
  // ---------------------------------------------------------------------------
  {
    id: '3.5',
    title: 'Iterative refinement with concrete feedback',
    outcome:
      'Given an unsatisfactory Claude Code result, choose the feedback technique (input/output examples, failing tests, interview, batched or sequential fixes) most likely to fix it on the next iteration.',
    minutes: 20,
    terms: [
      { term: 'Concrete input/output example', definition: 'A specific input and the exact output you expect, e.g. `"2026-03-07T09:00Z" -> "Sat 7 Mar, 9:00"`. Removes ambiguity that prose descriptions leave.' },
      { term: 'Test-driven iteration', definition: 'Write tests that capture the expected behavior first, confirm they fail, then have Claude change the code until they pass, sharing the actual failure output each round.' },
      { term: 'Interview pattern', definition: 'Ask Claude to question you about requirements and edge cases before it writes anything, then build from the answers.' },
      { term: 'Batched feedback', definition: 'Sending several related issues in one message so Claude can fix them together, appropriate when the fixes interact.' },
    ],
    learningPoints: [
      'Replace vague feedback ("make it better") with concrete input/output examples.',
      'Use failing tests as the specification and share the actual failure output on each iteration.',
      'Use the interview pattern when requirements are unclear or have edge cases you have not considered.',
      'Batch interacting issues in one message; fix independent issues sequentially and verify each.',
      'Recognize when to stop iterating in a polluted session and restart with a clearer prompt.',
    ],
    concept: `Claude rarely gets non-trivial work exactly right on the first pass. What decides how fast you converge is the **quality of the feedback** you give between passes. Vague feedback ("that's not quite right", "handle edge cases better") forces Claude to guess what you meant. Concrete feedback removes the guess.

### Show, do not describe

A short list of **concrete input/output examples** often beats a paragraph of rules. "Format durations nicely" is ambiguous; this is not:

- \`90\` -> \`"1h 30m"\`
- \`45\` -> \`"45m"\`
- \`0\` -> \`"0m"\`
- \`1440\` -> \`"1d"\`

Pick examples that cover the cases you actually care about, especially boundaries.

### Make tests the specification

**Test-driven iteration** turns "correct" into something checkable. Write (or have Claude write) tests that capture the expected behavior, confirm they fail for the right reason, then ask Claude to make them pass without changing the tests. After each attempt, share the **actual failure output** — the assertion, expected vs received values, the stack trace — rather than "still failing". Claude can run the tests itself, which closes the loop without you relaying anything.

### Interview before building

When the requirements are fuzzy or have edge cases you have not thought about, use the **interview pattern**: "Before writing code, ask me questions about anything unclear in this feature — edge cases, error handling, data sources. Ask until you are confident, then summarize the spec." You answer a handful of questions once, instead of discovering each gap after a wrong implementation.

### Batch or sequence?

- **Batch** issues in one message when they **interact**: fixing one changes the right fix for another (timezone handling and DST and the display format of the same date field). Fixing them one at a time causes churn as each fix undoes the last.
- **Fix sequentially** when issues are **independent**: a typo in an error message, a missing log line, a slow query in another module. One at a time, each verified, keeps the diff reviewable and makes regressions obvious.

### Know when to restart

If a session has gone through many corrections and is tangled, a fresh session (\`/clear\`) with a better prompt — now including the examples, tests, or answers you learned — often converges faster than another round of patches.`,
    example: {
      intro:
        'An engineer asks Claude to write `formatSlot`, which renders appointment times for the booking page. The first attempt is wrong in several ways. Below is how the next iteration is set up.',
      artifacts: [
        {
          lang: 'ts',
          caption: 'apps/web/src/formatSlot.test.ts (written first; currently failing)',
          code: `import { describe, it, expect } from 'vitest';
import { formatSlot } from './formatSlot';

describe('formatSlot', () => {
  it('uses the clinic time zone, not the browser zone', () => {
    expect(formatSlot('2026-03-07T17:00:00Z', 'America/Denver')).toBe('Sat 7 Mar, 10:00');
  });
  it('handles the US DST change correctly', () => {
    expect(formatSlot('2026-03-08T17:00:00Z', 'America/Denver')).toBe('Sun 8 Mar, 11:00');
  });
  it('uses 24-hour time', () => {
    expect(formatSlot('2026-03-07T22:30:00Z', 'America/Denver')).toBe('Sat 7 Mar, 15:30');
  });
});`,
        },
        {
          lang: 'text',
          caption: 'Feedback message after the first attempt (batched, with the real failure output)',
          code: `pnpm --filter web test formatSlot fails with:

  FAIL  uses the clinic time zone, not the browser zone
    Expected: "Sat 7 Mar, 10:00"
    Received: "Sat 7 Mar, 5:00 PM"
  FAIL  handles the US DST change correctly
    Expected: "Sun 8 Mar, 11:00"
    Received: "Sun 8 Mar, 5:00 PM"

These two failures and the 24-hour requirement all come from the same
formatting call, so please fix them together: format with Intl.DateTimeFormat
using the clinic's timeZone and hourCycle 'h23'. Do not change the tests.
Run the tests again and show me the output.`,
        },
        {
          lang: 'text',
          caption: 'Interview prompt used for the next, fuzzier feature',
          code: `I want a waitlist: when an appointment is cancelled, offer the slot to
waitlisted patients. Before writing any code, interview me. Ask about
anything unclear (ordering, how long an offer is held, what happens if
nobody accepts, notification channels, conflicts). Ask a few questions
at a time. When you have enough, write a short spec and wait for my OK.`,
        },
      ],
      walkthrough: `1. **Tests define "correct".** The three tests encode the time zone, DST, and 24-hour requirements as concrete inputs and outputs. Nobody has to interpret "format times properly".
2. **The real failure output is shared.** Expected vs received values show Claude exactly what is wrong (browser zone, 12-hour clock) instead of "it's still off".
3. **The issues are batched** because they interact: all three come from the same formatting call, so fixing them separately would mean rewriting that call three times. The message also forbids editing the tests, so Claude cannot "pass" by weakening them.
4. **The interview prompt** is used for the waitlist because its rules are not yet known even to the engineer; questions about offer expiry and conflicts surface decisions before any code exists.
5. If later feedback were independent (a typo in a tooltip, a missing log line), it would be sent **one at a time** and verified separately.`,
    },
    compare: {
      question: 'Three problems were found in Claude\'s output. Send them together, or one at a time?',
      a: {
        title: 'Batch them in one message',
        body: 'Describe all issues, with examples or failure output, and ask for a single coordinated fix.',
        chooseWhen: 'The issues interact: they share code, or fixing one changes the correct fix for another.',
      },
      b: {
        title: 'Fix them sequentially',
        body: 'Send one issue, verify the fix (ideally with a test), then send the next.',
        chooseWhen: 'The issues are independent, in different code paths, and each can be verified on its own.',
      },
      decidingDetail:
        '**Whether the fixes interact.** Interacting issues fixed one at a time cause churn, because each fix can undo or conflict with the previous one, so batch them and ask for a coordinated change. Independent issues are easier to review and verify one by one, and a regression is easy to attribute to a single change.',
    },
    mistake: {
      mistake:
        'Responding to a wrong result with vague corrections such as "that\'s still not right" or "handle edge cases better", repeated across many turns.',
      whyTempting:
        'It is quick to type, and it feels like Claude should know what you mean because the problem seems obvious to you.',
      howToRecognize:
        'Each iteration changes something, but not the thing you care about; the code oscillates between versions, and the conversation grows long with no convergence.',
      fix:
        'State the expected behavior concretely: give input/output examples, write a failing test and paste its actual output, or run the interview pattern if you realize the requirement itself is unclear. If the session is tangled, restart with a prompt that includes what you learned.',
    },
    exercise: {
      prompt: 'Choose the most effective technique for each situation.',
      inputs: 'Engineers at Tidewater iterating with Claude Code on feature work.',
      labels: ['Concrete I/O examples', 'Test-driven iteration', 'Interview first', 'Batch in one message', 'Fix sequentially'],
      items: [
        { id: 'i1', text: 'Claude\'s phone-number formatter output "looks wrong" but you have not said how; you know exactly what four sample numbers should look like.', answer: 'Concrete I/O examples', why: 'Four input/output pairs remove the ambiguity faster than prose about formatting.' },
        { id: 'i2', text: 'A pricing calculation must match finance\'s spreadsheet to the cent across 12 known cases, and Claude has been "close" twice.', answer: 'Test-driven iteration', why: 'Encode the 12 cases as tests, share the actual diffs, and iterate until they pass.' },
        { id: 'i3', text: 'Product asks for "family accounts" with no detail on permissions, billing, or minors.', answer: 'Interview first', why: 'The requirements are unknown; having Claude ask questions surfaces decisions before code is written.' },
        { id: 'i4', text: 'A date picker has a timezone bug, a DST bug, and wrong week-start, all in the same date-normalization function.', answer: 'Batch in one message', why: 'The fixes interact in one function; a coordinated change avoids churn.' },
        { id: 'i5', text: 'Review found a typo in an error message, a missing index in a migration, and an unused import in another package.', answer: 'Fix sequentially', why: 'Independent issues in different places; fixing and verifying each separately keeps changes reviewable.' },
      ],
      solution: `Choose by what is missing. If **the expected output** is clear to you but not to Claude, give examples. If **correctness must be checked precisely**, make tests the spec and share failures. If **the requirements themselves** are unclear, interview first. For several issues, ask whether the fixes **interact**: batch if yes, sequence if no.`,
    },
    check: [
      {
        id: '3.5-c1',
        stem: 'Claude\'s CSV parser keeps mishandling quoted fields. You have told it "handle quotes properly" twice. What is the best next message?',
        options: [
          { id: 'a', text: '"Please try harder this time; quotes are important."' },
          { id: 'b', text: 'Three example lines with the exact parsed arrays you expect, including an embedded comma and an escaped quote' },
          { id: 'c', text: '"Rewrite the parser from scratch using a different approach."' },
          { id: 'd', text: '"Use best practices for CSV parsing."' },
        ],
        correct: 'b',
        why: 'Concrete input/output examples, including the edge cases that are failing, state the expected behavior unambiguously; repeating vague instructions does not add information.',
      },
      {
        id: '3.5-c2',
        stem: 'You are about to build a feature whose rules you have not fully worked out (refund eligibility for partially used plans). What should you ask Claude to do first?',
        options: [
          { id: 'a', text: 'Implement its best guess so you can react to it' },
          { id: 'b', text: 'Ask you clarifying questions about the rules and edge cases, then write a short spec for approval' },
          { id: 'c', text: 'Write the code and tests together in one pass' },
          { id: 'd', text: 'Search the web for common refund policies' },
        ],
        correct: 'b',
        why: 'The interview pattern surfaces missing decisions before code exists, which is cheaper than discovering them through wrong implementations.',
      },
      {
        id: '3.5-c3',
        stem: 'Tests fail after Claude\'s change. Which feedback helps Claude most?',
        options: [
          { id: 'a', text: '"The tests are still failing."' },
          { id: 'b', text: 'The actual failure output: test names, expected vs received values, and the stack trace' },
          { id: 'c', text: '"Please be more careful."' },
          { id: 'd', text: 'Deleting the failing tests so the suite passes' },
        ],
        correct: 'b',
        why: 'Real failure output shows exactly what differs from the expected behavior, so the next attempt can target it. Deleting tests removes the specification instead of meeting it.',
      },
    ],
    review: [
      { front: 'When should several issues be batched in one message?', back: 'When their fixes interact (same code, or one fix changes another). Independent issues are better fixed and verified one at a time.' },
      { front: 'What is the interview pattern?', back: 'Ask Claude to question you about requirements and edge cases before writing code, then summarize a spec for approval.' },
      { front: 'Best feedback after a failed test run?', back: 'The actual failure output (expected vs received, stack trace), with an instruction not to change the tests.' },
    ],
    sources: ['guide-d3', 'cc-best-practices', 'cc-workflows', 'pe-multishot'],
  },

  // ---------------------------------------------------------------------------
  // 3.6 Claude Code in CI/CD
  // ---------------------------------------------------------------------------
  {
    id: '3.6',
    title: 'Integrating Claude Code into CI/CD pipelines',
    outcome:
      'Given a CI review job, configure a non-interactive Claude Code run with machine-readable, schema-constrained output, scoped tools, CI context from CLAUDE.md, secrets from the CI environment, and deduplicated PR comments.',
    minutes: 25,
    terms: [
      { term: 'claude -p', definition: 'Print (non-interactive) mode: runs one prompt to completion and writes the result to stdout, suitable for scripts and CI.' },
      { term: '--output-format json', definition: 'Emit a single JSON object containing the result and run metadata instead of plain text, so a later step can parse it. `stream-json` emits events as they happen.' },
      { term: '--json-schema', definition: 'In recent versions, constrains the final answer to a supplied JSON Schema so downstream parsers receive a predictable shape.' },
      { term: '--allowedTools', definition: 'Tools the run may use without prompting (non-interactive runs cannot answer prompts). Scope them to what the job needs, e.g. Read, Grep, Glob, `Bash(git diff:*)`.' },
      { term: 'Independent review instance', definition: 'A separate Claude Code invocation, with fresh context, that reviews code another session wrote, instead of the authoring session reviewing itself.' },
    ],
    learningPoints: [
      'Run Claude Code non-interactively with claude -p and bound it with --max-turns.',
      'Produce machine-readable output with --output-format json and, where supported, a JSON Schema.',
      'Scope permissions with --allowedTools so the job can do only what it needs.',
      'Give CI runs project context through committed CLAUDE.md, not ad-hoc prompt text.',
      'Avoid duplicate PR comments by passing prior findings and asking only for new or unresolved issues.',
      'Use an independent review instance instead of self-review, and supply secrets from the CI environment.',
    ],
    concept: `In CI there is no human at the keyboard. Claude Code has to start, do one job, produce output a script can trust, and stop. That changes how you configure it.

### Run non-interactively

\`claude -p "<prompt>"\` (print mode) runs a single prompt to completion and prints the result. Add \`--max-turns\` as a safety cap so a confused run cannot loop for long. Because nobody can approve a permission prompt, list what the job may use with **\`--allowedTools\`** — for a reviewer, read-only tools like Read, Grep, Glob, and narrowly scoped commands such as \`Bash(git diff:*)\`. Leave write tools out unless the job must change files.

### Make output machine-readable

Plain text breaks parsers. \`--output-format json\` returns one JSON object with the final result and metadata (session ID, cost, turns). For findings that feed PR comments or a merge gate, constrain the answer itself to a **JSON Schema** (\`--json-schema\` in recent versions): a findings array with file, line, severity, and message. A schema guarantees shape, not truth, so the job should still validate values (does the file exist in the diff? is the line in range?).

### Give the run project context

The CI run reads the repository's **CLAUDE.md** just like an interactive session. Put review standards there (what counts as a blocking issue, what to ignore, test commands) so CI and engineers apply the same rules, and so the prompt stays short.

### Avoid duplicate comments

Each push re-runs the job. If the new run knows nothing about the last one, it re-posts the same findings and the PR fills with noise. Fetch the bot's previous findings, pass them into the prompt, and ask Claude to report **only new or still-unresolved** issues, marking fixed ones as resolved. Posting is done by a deterministic script that reads the JSON, not by giving Claude write access to the PR.

### Review independently

A session that just wrote code tends to accept its own reasoning. Review with a **separate instance** — a new \`claude -p\` invocation with fresh context, given the diff and the standards — not by asking the authoring session to check its own work.

### Keep secrets in the CI system

The API key comes from the CI secret store as an environment variable (for example \`ANTHROPIC_API_KEY\`). Never put keys in CLAUDE.md, prompts, the repository, or logs.`,
    example: {
      intro:
        'Quarry Labs\' pull-request review job. It runs on every push, reviews the diff with read-only tools, emits schema-constrained JSON, passes earlier findings so it does not repeat itself, and posts with a separate script.',
      artifacts: [
        {
          lang: 'yaml',
          caption: '.github/workflows/claude-review.yml',
          code: `name: claude-review
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Collect diff and prior findings
        env:
          GH_TOKEN: \${{ github.token }}
          PR: \${{ github.event.pull_request.number }}
          BASE: \${{ github.base_ref }}
        run: |
          git diff "origin/$BASE...HEAD" > pr.diff
          node scripts/prior-findings.mjs "$PR" > prior-findings.json

      - name: Review (independent, read-only)
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "Review the changes in pr.diff against the review standards in CLAUDE.md.
          prior-findings.json lists findings already posted on this PR.
          Report only NEW issues or prior issues that are still present.
          List prior findings that are now fixed under resolved." \\
            --output-format json \\
            --json-schema "$(cat .claude/review-schema.json)" \\
            --allowedTools "Read" "Grep" "Glob" \\
            --max-turns 20 > review.json

      - name: Validate and post
        env:
          GH_TOKEN: \${{ github.token }}
        run: node scripts/post-review.mjs review.json`,
        },
        {
          lang: 'json',
          caption: '.claude/review-schema.json',
          code: `{
  "type": "object",
  "required": ["findings", "resolved"],
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["file", "line", "severity", "message"],
        "properties": {
          "file": { "type": "string" },
          "line": { "type": "integer" },
          "severity": { "type": "string", "enum": ["blocking", "warning"] },
          "message": { "type": "string" },
          "prior_id": { "type": ["string", "null"] }
        }
      }
    },
    "resolved": { "type": "array", "items": { "type": "string" } }
  }
}`,
        },
        {
          lang: 'markdown',
          caption: 'CLAUDE.md excerpt (committed; read by CI and engineers alike)',
          code: `## Code review standards
- Blocking: security issues, data loss, broken public API, missing tests for new logic.
- Warning: error handling gaps, performance regressions with evidence.
- Do not report formatting or naming preferences; the linter owns those.
- Tests: \`pnpm test\`. Type check: \`pnpm typecheck\`.`,
        },
      ],
      walkthrough: `1. **Non-interactive and bounded.** \`claude -p\` runs once; \`--max-turns 20\` caps the run.
2. **Read-only by construction.** \`--allowedTools\` lists only Read, Grep, and Glob. The diff is produced by the workflow beforehand, so Claude needs no Bash at all, and it has no way to push or comment. The \`pull-requests: write\` permission is used only by the posting script.
3. **Parseable output.** \`--output-format json\` wraps the run in a JSON object, and the schema fixes the shape of the findings so \`post-review.mjs\` does not break on prose. The script still checks that each \`file\` and \`line\` is in the diff before posting.
4. **No duplicates.** \`prior-findings.mjs\` collects the bot's earlier findings; the prompt tells Claude to report only new or still-present issues and to list fixed ones as resolved. The posting script updates or resolves existing comments rather than adding copies.
5. **Shared context.** Severity definitions and "don't report style" live in CLAUDE.md, so CI and local sessions apply the same standards and the prompt stays short.
6. **Independent and secret-safe.** This job is a separate instance from whatever session wrote the code. The API key comes from \`secrets.ANTHROPIC_API_KEY\` as an environment variable, never from the repo.`,
    },
    compare: {
      question: 'Who should review a change that Claude Code generated in an earlier step of the pipeline?',
      a: {
        title: 'Same session reviews its own work',
        body: 'Ask the authoring session "now review what you wrote" before finishing. Cheap: no new context needs to be built.',
        chooseWhen: 'You want a quick self-check for obvious slips (a forgotten file, a leftover debug line) and an independent review happens later anyway.',
      },
      b: {
        title: 'Independent review instance',
        body: 'A separate claude -p invocation with fresh context receives the diff and the review standards and reviews it without the author\'s reasoning.',
        chooseWhen: 'The review gates a merge or posts findings to humans, so it must catch problems the author\'s reasoning would rationalize.',
      },
      decidingDetail:
        '**Whether the review must catch the author\'s own blind spots.** The authoring session carries the assumptions that produced the code, so it tends to agree with itself. When findings gate merges or are relied on by reviewers, use a fresh instance that sees only the diff and the standards.',
    },
    mistake: {
      mistake:
        'Running the review job on every push with the same prompt and no memory of earlier runs, posting every finding as a new PR comment.',
      whyTempting:
        'Each CI run is ephemeral by design, and a stateless job is simpler to write. Each individual run looks correct in isolation.',
      howToRecognize:
        'PRs collect the same comment three or four times after successive pushes, engineers start ignoring bot comments, and fixed issues are never marked resolved.',
      fix:
        'Fetch the bot\'s previous findings (from PR comments or a stored artifact), pass them into the prompt, require output that separates new, still-present, and resolved findings, and have a deterministic posting script update or resolve existing comments instead of adding duplicates.',
    },
    exercise: {
      prompt: 'Each line describes part of a CI setup. Label it.',
      inputs: `${F}bash
# 1
claude -p "Review pr.diff" --allowedTools "Read" "Grep" "Glob" "Edit" "Bash"
# 2
claude -p "Review pr.diff" --output-format json --json-schema "$(cat schema.json)"
# 3  (same session that generated the code)
claude -p "Now review the code you just wrote" --resume "$SESSION_ID"
# 4
claude -p "Review pr.diff. Prior findings: $(cat prior.json). Report only new or unresolved."
# 5  (in the workflow file)
env:
  ANTHROPIC_API_KEY: "<the literal key value typed into this file>"
# 6
claude -p "Review pr.diff using the standards in CLAUDE.md" --max-turns 15
${F}`,
      labels: ['Good practice', 'Too-broad permissions', 'Self-review instead of independent review', 'Secret handled unsafely'],
      items: [
        { id: 'i1', text: 'Line 1', answer: 'Too-broad permissions', why: 'A reviewer needs read-only tools; pre-approving Edit and unrestricted Bash lets an unattended run change files or execute arbitrary commands.' },
        { id: 'i2', text: 'Line 2', answer: 'Good practice', why: 'JSON output constrained by a schema gives downstream scripts a predictable shape (values still need semantic validation).' },
        { id: 'i3', text: 'Line 3', answer: 'Self-review instead of independent review', why: 'Resuming the authoring session brings its assumptions along; an independent instance with fresh context reviews more critically.' },
        { id: 'i4', text: 'Line 4', answer: 'Good practice', why: 'Passing prior findings and asking only for new or unresolved issues prevents duplicate PR comments.' },
        { id: 'i5', text: 'Line 5', answer: 'Secret handled unsafely', why: 'A key written literally in the workflow file is committed to the repository; it must come from the CI secret store, e.g. ${{ secrets.ANTHROPIC_API_KEY }}.' },
        { id: 'i6', text: 'Line 6', answer: 'Good practice', why: 'Review standards come from committed CLAUDE.md, and --max-turns bounds the unattended run.' },
      ],
      solution: `A sound CI run is **non-interactive** (\`-p\`), **bounded** (\`--max-turns\`), **least-privilege** (\`--allowedTools\` matching the job), **machine-readable** (\`--output-format json\` plus a schema), **context-aware** (CLAUDE.md standards), **stateful across pushes** (prior findings in the prompt), **independent** of the authoring session, and **secret-safe** (keys from the CI secret store). Lines 1, 3, and 5 each break one of these.`,
    },
    check: [
      {
        id: '3.6-c1',
        stem: 'A CI step parses Claude\'s review with a JSON parser, but some runs return prose before the JSON and the parser fails. What change addresses this most directly?',
        options: [
          { id: 'a', text: 'Add "respond only in JSON" in capital letters to the prompt' },
          { id: 'b', text: 'Use --output-format json and constrain the result with a JSON Schema, then validate the parsed values' },
          { id: 'c', text: 'Retry the step until the parser succeeds' },
          { id: 'd', text: 'Increase --max-turns' },
        ],
        correct: 'b',
        why: 'Machine-readable output plus a schema constraint fixes the shape structurally; prompt wording and retries only make malformed output less likely. Values still need semantic checks.',
      },
      {
        id: '3.6-c2',
        stem: 'After each push, the review bot re-posts findings it already posted. What is the best fix?',
        options: [
          { id: 'a', text: 'Run the review only once per PR, on open' },
          { id: 'b', text: 'Raise the severity threshold so fewer findings are posted' },
          { id: 'c', text: 'Pass the previously posted findings into the prompt and ask for only new or unresolved issues, then update rather than duplicate comments' },
          { id: 'd', text: 'Delete all bot comments before each run' },
        ],
        correct: 'c',
        why: 'Giving the run its prior findings lets it distinguish new, still-present, and resolved issues, removing duplicates without losing coverage of later pushes.',
      },
      {
        id: '3.6-c3',
        stem: 'Where should the Anthropic API key for a CI review job come from?',
        options: [
          { id: 'a', text: 'The CI system\'s secret store, exposed to the step as an environment variable' },
          { id: 'b', text: 'A line in the project CLAUDE.md so Claude Code can find it' },
          { id: 'c', text: 'A committed .env file in the repository root' },
          { id: 'd', text: 'Embedded in the prompt passed to claude -p' },
        ],
        correct: 'a',
        why: 'Secrets belong in the CI secret store and reach the job as environment variables; CLAUDE.md, committed files, and prompts are all visible to anyone with repository or log access.',
      },
    ],
    review: [
      { front: 'Minimum flags for a parseable, safe CI review?', back: 'claude -p with --output-format json (plus a JSON Schema where supported), --allowedTools limited to what the job needs, and --max-turns as a cap.' },
      { front: 'How do you stop duplicate review comments across pushes?', back: 'Pass prior findings into the prompt, ask only for new or unresolved issues plus a resolved list, and post with a script that updates existing comments.' },
      { front: 'Why not let the authoring session review its own code?', back: 'It shares the reasoning that produced the code and tends to agree with itself; a fresh, independent instance catches more.' },
    ],
    sources: ['guide-d3', 'cc-headless', 'cc-cli-reference', 'cc-github-actions', 'cc-memory'],
    notes: [
      { date: NOTE_DATE, text: '`--json-schema` exists only in recent Claude Code versions, and the field that holds schema-constrained output inside the `--output-format json` object (for example `structured_output` alongside `result`) may differ by version. How `--allowedTools` accepts multiple values (space- or comma-separated) has also varied. Verify against the current CLI reference.' },
      { date: NOTE_DATE, text: 'Anthropic also publishes a GitHub Action for Claude Code that wraps much of this setup. Its inputs and version tags change over time; check the current GitHub Actions docs before copying a workflow.' },
    ],
  },
];
