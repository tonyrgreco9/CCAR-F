// Seeded, blueprint-constrained exam form builder.
//
// Rules implemented:
//  - 4 distinct scenarios, 15 questions each (60 total), grouped by scenario.
//  - Exact domain targets 16/11/12/12/9 (EXAM_GUIDE.format.domainTargets). If a combination
//    cannot meet them exactly, targets are relaxed by ±1 per domain and the deviation is recorded.
//  - At most one member of a question family per form.
//  - Never-seen families first; then least-recently-seen. Scenario combination is chosen from
//    the feasible combinations that maximise fresh families, so random choice cannot defeat freshness.
//  - Within a scenario/domain cell, consumption is balanced across cells so that later forms
//    still have fresh material in every cell.
import type { DomainId, Question, ScenarioId } from '../content/types';
import { EXAM_GUIDE, SCENARIOS, objectiveDomain } from '../content/blueprint';
import { rng } from './rng';

export const PER_SCENARIO = 15;
export const DOMAINS_ORDER: DomainId[] = [1, 2, 3, 4, 5];

export interface Exposure { lastSeen: number; count: number }
export type ExposureMap = Record<string, Exposure>; // by familyId

export interface Family {
  id: string;
  scenario: ScenarioId;
  domain: DomainId;
  objective: string;
  members: Question[];
}

export interface BuiltForm {
  seed: string;
  scenarios: ScenarioId[];
  questionIds: string[];
  optionOrder: Record<string, string[]>;
  freshCount: number;
  seenCount: number;
  deviations: string[];
  domainCounts: Record<DomainId, number>;
}

export function familiesOf(bank: Question[]): Map<string, Family> {
  const m = new Map<string, Family>();
  for (const q of bank) {
    let f = m.get(q.familyId);
    if (!f) { f = { id: q.familyId, scenario: q.scenario, domain: objectiveDomain(q.objective), objective: q.objective, members: [] }; m.set(q.familyId, f); }
    f.members.push(q);
  }
  return m;
}

export function allCombos(): ScenarioId[][] {
  const ids = SCENARIOS.map((s) => s.id);
  const out: ScenarioId[][] = [];
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++)
    for (let c = b + 1; c < ids.length; c++) for (let d = c + 1; d < ids.length; d++) out.push([ids[a], ids[b], ids[c], ids[d]]);
  return out;
}

// ---------- min-cost flow (successive shortest paths, Bellman-Ford) ----------
interface Edge { to: number; cap: number; cost: number; rev: number; tag?: any }
class Graph {
  g: Edge[][];
  constructor(n: number) { this.g = Array.from({ length: n }, () => []); }
  add(u: number, v: number, cap: number, cost: number, tag?: any) {
    this.g[u].push({ to: v, cap, cost, rev: this.g[v].length, tag });
    this.g[v].push({ to: u, cap: 0, cost: -cost, rev: this.g[u].length - 1 });
  }
  minCostFlow(s: number, t: number, want: number): { flow: number; cost: number } {
    let flow = 0, cost = 0;
    const n = this.g.length;
    while (flow < want) {
      const dist = new Array(n).fill(Infinity);
      const prev: [number, number][] = new Array(n);
      dist[s] = 0;
      for (let it = 0; it < n; it++) {
        let changed = false;
        for (let u = 0; u < n; u++) {
          if (dist[u] === Infinity) continue;
          this.g[u].forEach((e, i) => {
            if (e.cap > 0 && dist[u] + e.cost < dist[e.to]) { dist[e.to] = dist[u] + e.cost; prev[e.to] = [u, i]; changed = true; }
          });
        }
        if (!changed) break;
      }
      if (dist[t] === Infinity) break;
      let f = want - flow;
      for (let v = t; v !== s; v = prev[v][0]) f = Math.min(f, this.g[prev[v][0]][prev[v][1]].cap);
      for (let v = t; v !== s; v = prev[v][0]) {
        const e = this.g[prev[v][0]][prev[v][1]];
        e.cap -= f; this.g[v][e.rev].cap += f;
      }
      flow += f; cost += f * dist[t];
    }
    return { flow, cost };
  }
}

const SEEN_BASE = 1_000_000;

interface CellPlan { fams: Family[] }

/** Solve one scenario combination. Returns chosen families per scenario or null if infeasible. */
function solveCombo(
  combo: ScenarioId[],
  fams: Family[],
  exposures: ExposureMap,
  targets: Record<DomainId, number>,
  r: ReturnType<typeof rng>,
  rank: Map<string, number>,
): { chosen: Family[]; seen: number; recency: number } | null {
  // order families within each cell: fresh first (random among fresh), then least recently seen
  const cells = new Map<string, Family[]>();
  for (const f of fams) {
    if (!combo.includes(f.scenario)) continue;
    const k = `${f.scenario}|${f.domain}`;
    (cells.get(k) ?? cells.set(k, []).get(k)!).push(f);
  }
  const SRC = 0, SINK = 1 + combo.length + 5;
  const G = new Graph(SINK + 1);
  combo.forEach((s, i) => G.add(SRC, 1 + i, PER_SCENARIO, 0));
  DOMAINS_ORDER.forEach((d, j) => G.add(1 + combo.length + j, SINK, targets[d], 0));
  const famCost = (f: Family) => (exposures[f.id] ? SEEN_BASE + (rank.get(f.id) ?? 0) : 0);
  for (const [k, list] of cells) {
    const [s, dStr] = k.split('|');
    const d = Number(dStr) as DomainId;
    // stable random order, then by cost; objective round-robin for diversity among equals
    const shuffled = r.shuffle(list);
    const byObj = new Map<string, Family[]>();
    for (const f of shuffled) (byObj.get(f.objective) ?? byObj.set(f.objective, []).get(f.objective)!).push(f);
    for (const arr of byObj.values()) arr.sort((a, b) => famCost(a) - famCost(b));
    const ordered: Family[] = [];
    const queues = [...byObj.values()];
    while (queues.some((q) => q.length)) {
      // pick the queue whose head is cheapest (ties: rotate)
      queues.sort((a, b) => (a.length ? famCost(a[0]) : Infinity) - (b.length ? famCost(b[0]) : Infinity));
      const minCost = queues[0].length ? famCost(queues[0][0]) : Infinity;
      for (const q of queues) if (q.length && famCost(q[0]) === minCost) ordered.push(q.shift()!);
    }
    const u = 1 + combo.indexOf(s as ScenarioId);
    const v = 1 + combo.length + DOMAINS_ORDER.indexOf(d);
    const avail = ordered.filter((f) => !exposures[f.id]).length || ordered.length;
    ordered.forEach((f, idx) => {
      const balance = Math.floor((1000 * (idx + 1)) / Math.max(1, avail));
      G.add(u, v, 1, famCost(f) + balance, f);
    });
  }
  const { flow } = G.minCostFlow(SRC, SINK, PER_SCENARIO * combo.length);
  if (flow < PER_SCENARIO * combo.length) return null;
  const chosen: Family[] = [];
  let seen = 0, recency = 0;
  for (let u = 1; u <= combo.length; u++) for (const e of G.g[u]) if (e.tag && e.cap === 0) {
    chosen.push(e.tag);
    const ex = exposures[(e.tag as Family).id];
    if (ex) { seen++; recency += ex.lastSeen; }
  }
  return { chosen, seen, recency };
}

function relaxedTargets(base: Record<DomainId, number>): Record<DomainId, number>[] {
  // single-domain swaps: +1 on one domain, -1 on another (documented deviation)
  const out: Record<DomainId, number>[] = [];
  for (const a of DOMAINS_ORDER) for (const b of DOMAINS_ORDER) if (a !== b) out.push({ ...base, [a]: base[a] + 1, [b]: base[b] - 1 });
  return out;
}

export interface BuildOptions {
  /** Restrict to these combos (testing). */
  combos?: ScenarioId[][];
}

export function buildForm(bank: Question[], exposures: ExposureMap, seed: string, opts: BuildOptions = {}): BuiltForm {
  const r = rng(seed);
  const fams = [...familiesOf(bank).values()];
  const base = EXAM_GUIDE.format.domainTargets;
  const combos = r.shuffle(opts.combos ?? allCombos());
  // recency rank: 0 = least recently seen (cheapest to reuse)
  const rank = new Map(Object.entries(exposures).sort((a, b) => a[1].lastSeen - b[1].lastSeen).map(([id], i) => [id, i]));
  let best: { combo: ScenarioId[]; sol: NonNullable<ReturnType<typeof solveCombo>>; targets: Record<DomainId, number> } | null = null;
  for (const combo of combos) {
    let sol = solveCombo(combo, fams, exposures, base, rng(`${seed}|${combo.join(',')}`), rank);
    let targets = base;
    if (!sol) {
      for (const t of relaxedTargets(base)) {
        sol = solveCombo(combo, fams, exposures, t, rng(`${seed}|${combo.join(',')}`), rank);
        if (sol) { targets = t; break; }
      }
    }
    if (!sol) continue;
    const exact = targets === base;
    const better = !best
      || (exact && best.targets !== base)
      || ((exact === (best.targets === base)) && (sol.seen < best.sol.seen || (sol.seen === best.sol.seen && sol.recency < best.sol.recency)));
    if (better) best = { combo, sol, targets };
  }
  if (!best) throw new Error('No feasible exam form for this question bank');

  const deviations: string[] = [];
  if (best.targets !== base) for (const d of DOMAINS_ORDER) if (best.targets[d] !== base[d])
    deviations.push(`Domain ${d}: ${best.targets[d]} questions instead of ${base[d]} (scenario coverage required a ±1 adjustment)`);

  // order scenarios randomly; questions within a scenario randomly
  const scenarios = r.shuffle(best.combo);
  const questionIds: string[] = [];
  const optionOrder: Record<string, string[]> = {};
  const domainCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<DomainId, number>;
  for (const s of scenarios) {
    const inS = r.shuffle(best.sol.chosen.filter((f) => f.scenario === s));
    for (const f of inS) {
      // choose a member: prefer one whose question id hasn't been seen (exposures track families; members rotate by seed)
      const q = f.members[r.int(f.members.length)];
      questionIds.push(q.id);
      optionOrder[q.id] = r.shuffle(q.options.map((o) => o.id));
      domainCounts[f.domain]++;
    }
  }
  return {
    seed,
    scenarios,
    questionIds,
    optionOrder,
    freshCount: 60 - best.sol.seen,
    seenCount: best.sol.seen,
    deviations,
    domainCounts,
  };
}

/** Mark families of a form as seen at time `now`. */
export function recordExposure(exposures: ExposureMap, bank: Question[], questionIds: string[], now: number): ExposureMap {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const next = { ...exposures };
  for (const id of questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const prev = next[q.familyId];
    next[q.familyId] = { lastSeen: now, count: (prev?.count ?? 0) + 1 };
  }
  return next;
}
