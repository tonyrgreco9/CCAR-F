// Pure exam/practice response logic: selection, elimination, flags, scoring, submission.
import type { DomainId, ObjectiveId, Question, ScenarioId } from '../content/types';
import { objectiveDomain } from '../content/blueprint';

export interface Response {
  selected: string[];   // option ids
  eliminated: string[]; // option ids
  flagged: boolean;
}

export const emptyResponse = (): Response => ({ selected: [], eliminated: [], flagged: false });

export type SelectResult = { resp: Response; blocked?: 'eliminated' | 'limit' };

/** Select (or for multi, toggle) an option. Eliminated options must be restored first. */
export function selectOption(r: Response, q: Pick<Question, 'type' | 'selectCount'>, optId: string): SelectResult {
  if (r.eliminated.includes(optId)) return { resp: r, blocked: 'eliminated' };
  if (q.type === 'single') {
    if (r.selected.length === 1 && r.selected[0] === optId) return { resp: r };
    return { resp: { ...r, selected: [optId] } };
  }
  if (r.selected.includes(optId)) return { resp: { ...r, selected: r.selected.filter((x) => x !== optId) } };
  if (r.selected.length >= q.selectCount) return { resp: r, blocked: 'limit' };
  return { resp: { ...r, selected: [...r.selected, optId] } };
}

/** Eliminate (strike through) an option. Clears it from the selection if selected. Never selects anything. */
export function eliminateOption(r: Response, optId: string): Response {
  if (r.eliminated.includes(optId)) return r;
  return { ...r, eliminated: [...r.eliminated, optId], selected: r.selected.filter((x) => x !== optId) };
}

/** Restore an eliminated option. Does not select it. */
export function restoreOption(r: Response, optId: string): Response {
  if (!r.eliminated.includes(optId)) return r;
  return { ...r, eliminated: r.eliminated.filter((x) => x !== optId) };
}

export function toggleEliminate(r: Response, optId: string): Response {
  return r.eliminated.includes(optId) ? restoreOption(r, optId) : eliminateOption(r, optId);
}

export function toggleFlag(r: Response): Response {
  return { ...r, flagged: !r.flagged };
}

export function clearSelection(r: Response): Response {
  return { ...r, selected: [] };
}

export function isAnswered(r: Response | undefined, q: Pick<Question, 'selectCount'>): boolean {
  return !!r && r.selected.length === q.selectCount;
}

/** Exact-match scoring: the submitted selection must equal the correct set. Eliminations never score. */
export function isCorrect(r: Response | undefined, q: Question): boolean {
  if (!r || r.selected.length !== q.selectCount) return false;
  const correct = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
  return r.selected.every((id) => correct.has(id)) && r.selected.length === correct.size;
}

export type OptionReviewState = {
  id: string;
  selected: boolean;
  correct: boolean;
  eliminated: boolean;
  /** Category for feedback. */
  kind: 'correct-selected' | 'wrong-selected' | 'correct-missed' | 'correct-eliminated' | 'wrong-unselected';
};

export function reviewOptions(r: Response | undefined, q: Question): OptionReviewState[] {
  const sel = new Set(r?.selected ?? []);
  const elim = new Set(r?.eliminated ?? []);
  return q.options.map((o) => {
    const selected = sel.has(o.id);
    const eliminated = elim.has(o.id);
    let kind: OptionReviewState['kind'];
    if (o.correct && selected) kind = 'correct-selected';
    else if (!o.correct && selected) kind = 'wrong-selected';
    else if (o.correct && eliminated) kind = 'correct-eliminated';
    else if (o.correct) kind = 'correct-missed';
    else kind = 'wrong-unselected';
    return { id: o.id, selected, correct: o.correct, eliminated, kind };
  });
}

export type Outcome = 'correct' | 'incorrect' | 'unanswered';
export function outcomeOf(r: Response | undefined, q: Question): Outcome {
  if (!r || r.selected.length === 0) return 'unanswered';
  if (!isAnswered(r, q)) return isCorrect(r, q) ? 'correct' : 'incorrect'; // partial = incorrect
  return isCorrect(r, q) ? 'correct' : 'incorrect';
}

export interface ScoreSummary {
  raw: number;
  total: number;
  unanswered: number;
  incomplete: number;
  byDomain: Record<DomainId, { correct: number; total: number }>;
  byObjective: Record<string, { correct: number; total: number }>;
  byScenario: Record<string, { correct: number; total: number }>;
}

export function scoreAttempt(questionIds: string[], responses: Record<string, Response>, byId: Map<string, Question>): ScoreSummary {
  const s: ScoreSummary = { raw: 0, total: 0, unanswered: 0, incomplete: 0, byDomain: { 1: z(), 2: z(), 3: z(), 4: z(), 5: z() }, byObjective: {}, byScenario: {} };
  for (const id of questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    s.total++;
    const r = responses[id];
    const ok = isCorrect(r, q);
    if (ok) s.raw++;
    if (!r || r.selected.length === 0) s.unanswered++;
    else if (!isAnswered(r, q)) s.incomplete++;
    const d = objectiveDomain(q.objective);
    bump(s.byDomain[d], ok);
    bump((s.byObjective[q.objective] ??= z()), ok);
    bump((s.byScenario[q.scenario] ??= z()), ok);
  }
  return s;
}
function z() { return { correct: 0, total: 0 }; }
function bump(x: { correct: number; total: number }, ok: boolean) { x.total++; if (ok) x.correct++; }

// ---------------- attempts ----------------
export interface ExamAttempt {
  id: string;
  seed: string;
  kind: 'fresh' | 'retake';
  retakeOf?: string;
  scenarios: ScenarioId[];
  questionIds: string[];
  optionOrder: Record<string, string[]>;
  startedAt: number;
  deadline: number;
  durationMs: number;
  status: 'active' | 'submitted';
  submittedAt?: number;
  submitReason?: 'user' | 'timeout';
  responses: Record<string, Response>;
  current: number;
  freshCount: number;
  seenCount: number;
  deviations: string[];
  score?: ScoreSummary;
}

/** Idempotent submission. Returns the same object if already submitted. */
export function submitAttempt(a: ExamAttempt, reason: 'user' | 'timeout', now: number, byId: Map<string, Question>): ExamAttempt {
  if (a.status !== 'active') return a;
  return {
    ...a,
    status: 'submitted',
    submitReason: reason,
    submittedAt: reason === 'timeout' ? Math.min(now, a.deadline) : now,
    score: scoreAttempt(a.questionIds, a.responses, byId),
  };
}

export function remainingMs(a: ExamAttempt, now: number) {
  return Math.max(0, a.deadline - now);
}

export function shouldAutoSubmit(a: ExamAttempt, now: number) {
  return a.status === 'active' && now >= a.deadline;
}

export function navStatus(a: ExamAttempt, byId: Map<string, Question>) {
  return a.questionIds.map((id, i) => {
    const q = byId.get(id)!;
    const r = a.responses[id];
    return { index: i, id, current: i === a.current, answered: isAnswered(r, q), partial: !!r && r.selected.length > 0 && !isAnswered(r, q), flagged: !!r?.flagged };
  });
}

export type ObjectiveIdT = ObjectiveId;
