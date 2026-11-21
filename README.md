# CCAR-F Prep

Independent exam preparation for **Claude Certified Architect – Foundations (CCAR-F)**, with the
**Claude Certified Developer – Foundations** path as a companion. Not affiliated with or endorsed by
Anthropic. All questions are original practice items.

Runs entirely offline: no account, backend, API key, or model calls. Progress is stored in the
browser's localStorage.

## Run it

Requires [Bun](https://bun.sh) ≥ 1.2 (the build uses Bun's built-in bundler and test runner).

```bash
bun run dev        # http://localhost:5173 — serves source with on-the-fly bundling
bun run build      # production bundle in dist/
bun run preview    # serve dist/ on http://localhost:5173
bun run check      # typecheck + content validation + unit tests + build
node e2e/walkthrough.mjs   # browser walkthrough (needs Playwright + Chromium; run after build)
```

`PORT=8080 bun run preview` changes the port.

## What's inside

| Area | Content |
| --- | --- |
| Architect path | 30 lessons (one per task statement 1.1–5.6): concept → worked example → design comparison → common mistake → labelled exercise → 3-item closed-book check → review cards → targeted practice |
| Case studies | 6 guided cases (one per scenario family), 4 decisions each, walkthrough revealed after you choose |
| Question bank | 204 original questions in 192 question families (32 families × 6 scenarios + 12 close variants), 48 multiple-response |
| Full exam | 60 questions, 120 min, 4 of 6 scenarios grouped by scenario, domain counts 16/11/12/12/9 |
| Developer companion | Official module order, availability status, title-inferred links, 9-item prerequisite diagnostic, 9 original refreshers |

## How exams are built

`src/engine/builder.ts` runs a seeded min-cost-flow over (scenario × domain) cells:

- exactly 15 questions per scenario and the exact domain targets (±1 relaxation is recorded as a documented deviation; none occurs with the current bank);
- at most one member of a question family per form;
- never-seen families cost 0, previously seen families cost more the more recently they were seen;
- every scenario combination is solved and the one with the most fresh families wins, so the second exam is chosen from feasible combinations rather than at random.

Tests cover all 15 combinations, every possible first combination followed by a second form (zero family overlap), exhaustion and least-recently-seen reuse, and seeded reproduction.

## Architecture note: React port

The requested stack was React + TypeScript + Vite. The build environment could not reach the npm registry, so the UI runs on a small React-compatible runtime in `src/runtime/` (function components, `useState`/`useEffect`/`useRef`/`useMemo`, keyed diffing). Components use only APIs with identical React semantics. To port:

1. `npm create vite@latest` (react-ts) or add `react`, `react-dom`, `vite`, `@vitejs/plugin-react`.
2. Replace `from '@rt/index'` with `from 'react'`; set `"jsxImportSource": "react"` in tsconfig.
3. Replace `render(() => <App />, el)` in `src/main.tsx` with `createRoot(el).render(<App />)`, and have the store notify via `useSyncExternalStore`.
4. Swap `class=` for `className=` and `for=` for `htmlFor=` in JSX (the runtime accepts both).

The engine (`src/engine`), content (`src/content`), and tests do not depend on the UI runtime.

## Source status

The CCAR-F exam guide and Academy exports were **not present** in `docs/`, and Skilljar and the Anthropic docs were unreachable from the build environment. See [docs/COVERAGE.md](docs/COVERAGE.md) and the in-app **Coverage** page for exactly what is missing. Fill in `EXAM_GUIDE` in `src/content/blueprint.ts` when the guide is available.

## Learner data

Data lives under the `ccarf-prep` localStorage key with a schema version. `migrate()` in `src/engine/storage.ts` only adds defaults or reshapes; it never drops progress. Stable question IDs mean bank updates keep history. Use **About → Export my progress** to back up.
