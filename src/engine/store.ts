// Application store: persistence, exam lifecycle, practice, analytics. Clock and storage are injectable for tests.
import type { ObjectiveId, Question, ScenarioId } from '../content/types';
import { buildForm, recordExposure, type BuiltForm } from './builder';
import { emptyResponse, isCorrect, submitAttempt, shouldAutoSubmit, type ExamAttempt, type Response } from './exam';
import { load, save, type AppData, type KV, type PracticeSession, type AnswerRecord } from './storage';
import { newSeed, rng } from './rng';

export const EXAM_MS = 120 * 60 * 1000;

export interface StoreDeps { kv: KV | null; now: () => number; bank: Question[] }

export class Store {
  data: AppData;
  private listeners = new Set<() => void>();
  readonly byId: Map<string, Question>;
  constructor(private deps: StoreDeps) {
    this.data = load(deps.kv, deps.now());
    this.byId = new Map(deps.bank.map((q) => [q.id, q]));
  }
  get bank() { return this.deps.bank; }
  now() { return this.deps.now(); }
  subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  /** Re-read from storage (another tab may have written). */
  reload() { this.data = load(this.deps.kv, this.deps.now()); this.emit(); }
  private emit() { for (const l of this.listeners) l(); }
  update(fn: (d: AppData) => AppData | void) {
    const draft = structuredClone(this.data);
    const next = fn(draft);
    this.data = next ?? draft;
    save(this.deps.kv, this.data);
    this.emit();
  }
  private commit(d: AppData) { this.data = d; save(this.deps.kv, d); this.emit(); }

  // ---------------- exams ----------------
  activeAttempt(): ExamAttempt | null {
    const id = this.data.activeAttemptId;
    return (id && this.data.attempts.find((a) => a.id === id && a.status === 'active')) || null;
  }
  attempt(id: string) { return this.data.attempts.find((a) => a.id === id) ?? null; }

  /** Build (but do not start) a fresh form. The preview shows fresh vs previously-seen counts. */
  previewForm(seed = newSeed()): BuiltForm {
    return buildForm(this.deps.bank, this.data.exposures, seed);
  }

  /** Start a fresh exam from a previewed form. Refuses if an exam is active (never overwrites). */
  startExam(form: BuiltForm): ExamAttempt {
    if (this.activeAttempt()) throw new Error('ACTIVE_ATTEMPT');
    const now = this.now();
    const a: ExamAttempt = {
      id: `exam-${now.toString(36)}-${form.seed}`,
      seed: form.seed,
      kind: 'fresh',
      scenarios: form.scenarios,
      questionIds: form.questionIds,
      optionOrder: form.optionOrder,
      startedAt: now,
      deadline: now + EXAM_MS,
      durationMs: EXAM_MS,
      status: 'active',
      responses: {},
      current: 0,
      freshCount: form.freshCount,
      seenCount: form.seenCount,
      deviations: form.deviations,
    };
    const d = structuredClone(this.data);
    d.attempts.push(a);
    d.activeAttemptId = a.id;
    d.exposures = recordExposure(d.exposures, this.deps.bank, a.questionIds, now);
    this.commit(d);
    return a;
  }

  /** Exact retry: same form, same option order, clean responses; labelled as a retake. */
  retake(attemptId: string): ExamAttempt {
    if (this.activeAttempt()) throw new Error('ACTIVE_ATTEMPT');
    const src = this.attempt(attemptId);
    if (!src) throw new Error('NOT_FOUND');
    const now = this.now();
    const a: ExamAttempt = {
      ...structuredClone(src),
      id: `retake-${now.toString(36)}-${src.seed}`,
      kind: 'retake',
      retakeOf: src.retakeOf ?? src.id,
      startedAt: now,
      deadline: now + EXAM_MS,
      durationMs: EXAM_MS,
      status: 'active',
      submittedAt: undefined,
      submitReason: undefined,
      responses: {},
      current: 0,
      score: undefined,
      freshCount: 0,
      seenCount: src.questionIds.length,
    };
    const d = structuredClone(this.data);
    d.attempts.push(a);
    d.activeAttemptId = a.id;
    d.exposures = recordExposure(d.exposures, this.deps.bank, a.questionIds, now);
    this.commit(d);
    return a;
  }

  /** Mutate one response of the active attempt. */
  setResponse(attemptId: string, qid: string, fn: (r: Response) => Response) {
    const d = structuredClone(this.data);
    const a = d.attempts.find((x) => x.id === attemptId);
    if (!a || a.status !== 'active') return;
    a.responses[qid] = fn(a.responses[qid] ?? emptyResponse());
    this.commit(d);
  }

  setCurrent(attemptId: string, index: number) {
    const d = structuredClone(this.data);
    const a = d.attempts.find((x) => x.id === attemptId);
    if (!a || a.status !== 'active') return;
    a.current = Math.max(0, Math.min(a.questionIds.length - 1, index));
    this.commit(d);
  }

  /** Submit exactly once. Re-reads storage first so two tabs/timers cannot double-submit. */
  submit(attemptId: string, reason: 'user' | 'timeout'): ExamAttempt | null {
    const fresh = load(this.deps.kv, this.deps.now());
    const a = fresh.attempts.find((x) => x.id === attemptId);
    if (!a) return null;
    if (a.status !== 'active') { this.data = fresh; this.emit(); return a; }
    const now = this.now();
    const done = submitAttempt(a, reason, now, this.byId);
    fresh.attempts = fresh.attempts.map((x) => (x.id === attemptId ? done : x));
    if (fresh.activeAttemptId === attemptId) fresh.activeAttemptId = null;
    // answer records
    for (const qid of done.questionIds) {
      const q = this.byId.get(qid);
      if (!q) continue;
      const r = done.responses[qid];
      fresh.answers.push(this.answerRecord(fresh, q, r, done.kind === 'retake' ? 'retake' : 'exam', done.submittedAt!, done.id));
    }
    this.commit(fresh);
    return done;
  }

  /** Called on load and every second: auto-submits an expired active exam (once). */
  tick(): ExamAttempt | null {
    const a = this.activeAttempt();
    if (a && shouldAutoSubmit(a, this.now())) return this.submit(a.id, 'timeout');
    return null;
  }

  private answerRecord(d: AppData, q: Question, r: Response | undefined, mode: AnswerRecord['mode'], at: number, attemptId?: string): AnswerRecord {
    const firstTry = !d.answers.some((x) => x.familyId === q.familyId);
    return {
      qid: q.id, familyId: q.familyId, objective: q.objective, scenario: q.scenario,
      correct: isCorrect(r, q), unanswered: !r || r.selected.length === 0,
      mode, at, attemptId, firstTry,
    };
  }

  // ---------------- practice ----------------
  practicePool(filter: PracticeFilter): Question[] {
    const d = this.data;
    let pool = this.deps.bank;
    if (filter.kind === 'domain') pool = pool.filter((q) => q.objective.startsWith(filter.value + '.'));
    if (filter.kind === 'objective') pool = pool.filter((q) => q.objective === filter.value);
    if (filter.kind === 'scenario') pool = pool.filter((q) => q.scenario === filter.value);
    if (filter.kind === 'bookmarks') pool = pool.filter((q) => d.bookmarks.includes(q.id));
    if (filter.kind === 'mistakes') {
      const latest = new Map<string, boolean>();
      for (const a of d.answers) latest.set(a.qid, a.correct);
      pool = pool.filter((q) => latest.get(q.id) === false);
    }
    if (filter.kind === 'ids') pool = pool.filter((q) => filter.ids.includes(q.id));
    return pool;
  }

  /** Choose up to n questions: never-seen families first, then least recently seen; one per family. */
  pickQuestions(pool: Question[], n: number, seed: string, excludeFamilies: string[] = []): Question[] {
    const r = rng(seed);
    const ex = this.data.exposures;
    const seenFam = new Set<string>(excludeFamilies);
    const ordered = r.shuffle(pool).sort((a, b) => (ex[a.familyId]?.lastSeen ?? 0) - (ex[b.familyId]?.lastSeen ?? 0));
    const out: Question[] = [];
    for (const q of ordered) {
      if (seenFam.has(q.familyId)) continue;
      seenFam.add(q.familyId);
      out.push(q);
      if (out.length >= n) break;
    }
    return out;
  }

  startPractice(label: string, questions: Question[], seed = newSeed()): PracticeSession {
    const r = rng(seed);
    const s: PracticeSession = {
      id: `practice-${this.now().toString(36)}`,
      label,
      questionIds: questions.map((q) => q.id),
      optionOrder: Object.fromEntries(questions.map((q) => [q.id, r.shuffle(q.options.map((o) => o.id))])),
      responses: {},
      submitted: {},
      current: 0,
      startedAt: this.now(),
    };
    this.update((d) => { d.practice = s; });
    return s;
  }

  /** A question on the same objective from a different family, preferring unseen families. */
  freshQuestionFor(objective: ObjectiveId, excludeFamily: string, seed = newSeed()): Question | null {
    const pool = this.deps.bank.filter((q) => q.objective === objective && q.familyId !== excludeFamily);
    return this.pickQuestions(pool, 1, seed)[0] ?? null;
  }

  practiceRespond(qid: string, fn: (r: Response) => Response) {
    this.update((d) => {
      if (!d.practice || d.practice.submitted[qid]) return;
      d.practice.responses[qid] = fn(d.practice.responses[qid] ?? emptyResponse());
    });
  }

  practiceSubmit(qid: string) {
    const q = this.byId.get(qid);
    if (!q) return;
    this.update((d) => {
      if (!d.practice || d.practice.submitted[qid]) return;
      d.practice.submitted[qid] = true;
      const now = this.now();
      d.answers.push(this.answerRecord(d, q, d.practice.responses[qid], 'practice', now));
      d.exposures = recordExposure(d.exposures, this.deps.bank, [qid], now);
    });
  }

  toggleBookmark(qid: string) {
    this.update((d) => {
      d.bookmarks = d.bookmarks.includes(qid) ? d.bookmarks.filter((x) => x !== qid) : [...d.bookmarks, qid];
    });
  }
}

export type PracticeFilter =
  | { kind: 'all' }
  | { kind: 'domain'; value: string }
  | { kind: 'objective'; value: string }
  | { kind: 'scenario'; value: ScenarioId }
  | { kind: 'bookmarks' }
  | { kind: 'mistakes' }
  | { kind: 'ids'; ids: string[] };

// ---------------- analytics ----------------
export function analytics(d: AppData) {
  const first = d.answers.filter((a) => a.firstTry);
  const retakes = d.answers.filter((a) => a.mode === 'retake');
  const byObjective: Record<string, { first: number; firstCorrect: number; all: number; allCorrect: number }> = {};
  for (const a of d.answers) {
    const o = (byObjective[a.objective] ??= { first: 0, firstCorrect: 0, all: 0, allCorrect: 0 });
    o.all++; if (a.correct) o.allCorrect++;
    if (a.firstTry) { o.first++; if (a.correct) o.firstCorrect++; }
  }
  return {
    firstAttempt: { n: first.length, correct: first.filter((a) => a.correct).length },
    retake: { n: retakes.length, correct: retakes.filter((a) => a.correct).length },
    lessonsCompleted: Object.values(d.lessons).filter((l) => l.completedAt).length,
    byObjective,
  };
}
