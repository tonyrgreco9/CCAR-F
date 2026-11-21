import { describe, test, expect } from 'bun:test';
import { QUESTIONS } from '../src/content';
import { Store, EXAM_MS } from '../src/engine/store';
import { selectOption, eliminateOption, toggleFlag } from '../src/engine/exam';
import { STORAGE_KEY, SCHEMA_VERSION, migrate } from '../src/engine/storage';

function memKV() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; }
function mk(kv = memKV(), clock = { t: 1_700_000_000_000 }) { return { s: new Store({ kv, now: () => clock.t, bank: QUESTIONS }), kv, clock }; }

describe('exam lifecycle and persistence', () => {
  test('selections, eliminations, flags, position, order, and deadline survive reload', () => {
    const { s, kv, clock } = mk();
    const a = s.startExam(s.previewForm('persist'));
    const multiId = a.questionIds.find((id) => s.byId.get(id)!.selectCount === 2)!;
    const q = s.byId.get(multiId)!;
    const [A, B, C] = a.optionOrder[multiId];
    const correct = q.options.filter((o) => o.correct).map((o) => o.id);
    s.setResponse(a.id, multiId, (r) => selectOption(r, q, A).resp);
    s.setResponse(a.id, multiId, (r) => selectOption(r, q, C).resp);
    s.setResponse(a.id, multiId, (r) => eliminateOption(r, B));
    s.setResponse(a.id, multiId, toggleFlag);
    s.setCurrent(a.id, a.questionIds.indexOf(multiId));
    clock.t += 60_000;
    const s2 = new Store({ kv, now: () => clock.t, bank: QUESTIONS }); // "refresh"
    const a2 = s2.activeAttempt()!;
    expect(a2.id).toBe(a.id);
    expect(a2.deadline).toBe(a.deadline);
    expect(a2.questionIds).toEqual(a.questionIds);
    expect(a2.optionOrder).toEqual(a.optionOrder);
    expect(a2.current).toBe(a.questionIds.indexOf(multiId));
    expect(a2.responses[multiId]).toEqual({ selected: [A, C], eliminated: [B], flagged: true });
    // eliminating C makes the item incomplete; restoring does not reselect
    s2.setResponse(a.id, multiId, (r) => eliminateOption(r, C));
    expect(s2.activeAttempt()!.responses[multiId].selected).toEqual([A]);
    expect(correct.length).toBe(2);
  });

  test('a new attempt starts clean; an active attempt is never overwritten', () => {
    const { s } = mk();
    const a = s.startExam(s.previewForm('one'));
    s.setResponse(a.id, a.questionIds[0], (r) => eliminateOption(r, a.optionOrder[a.questionIds[0]][0]));
    expect(() => s.startExam(s.previewForm('two'))).toThrow('ACTIVE_ATTEMPT');
    s.submit(a.id, 'user');
    const b = s.startExam(s.previewForm('two'));
    expect(b.responses).toEqual({});
    expect(s.data.attempts.length).toBe(2); // previous results kept
  });

  test('timer expiry while open submits exactly once', () => {
    const { s, clock } = mk();
    const a = s.startExam(s.previewForm('t-open'));
    clock.t += EXAM_MS - 1000;
    expect(s.tick()).toBeNull();
    clock.t += 2000;
    const done = s.tick()!;
    expect(done.status).toBe('submitted');
    expect(done.submitReason).toBe('timeout');
    expect(done.submittedAt).toBe(a.deadline);
    expect(s.tick()).toBeNull();
    expect(s.data.attempts.filter((x) => x.status === 'submitted').length).toBe(1);
    expect(s.data.answers.filter((x) => x.attemptId === a.id).length).toBe(60);
  });

  test('timer expiry while closed: reopening after the deadline submits once; two tabs cannot double-submit', () => {
    const { s, kv, clock } = mk();
    const a = s.startExam(s.previewForm('t-closed'));
    clock.t += EXAM_MS + 3_600_000; // app closed for over an hour past deadline
    const tabA = new Store({ kv, now: () => clock.t, bank: QUESTIONS });
    const tabB = new Store({ kv, now: () => clock.t, bank: QUESTIONS });
    expect(tabA.tick()!.status).toBe('submitted');
    tabB.tick();
    const fresh = new Store({ kv, now: () => clock.t, bank: QUESTIONS });
    expect(fresh.data.attempts.filter((x) => x.id === a.id).length).toBe(1);
    expect(fresh.data.answers.filter((x) => x.attemptId === a.id).length).toBe(60);
    expect(fresh.attempt(a.id)!.submittedAt).toBe(a.deadline);
  });

  test('exact retry preserves form and option order, is labelled a retake, and is scored separately', () => {
    const { s } = mk();
    const a = s.startExam(s.previewForm('retake'));
    const q0 = a.questionIds[0];
    s.setResponse(a.id, q0, (r) => selectOption(r, s.byId.get(q0)!, a.optionOrder[q0][0]).resp);
    s.submit(a.id, 'user');
    const firstRecords = s.data.answers.filter((x) => x.attemptId === a.id);
    expect(firstRecords.every((x) => x.mode === 'exam')).toBe(true);
    expect(firstRecords.every((x) => x.firstTry)).toBe(true);
    const r = s.retake(a.id);
    expect(r.kind).toBe('retake');
    expect(r.retakeOf).toBe(a.id);
    expect(r.questionIds).toEqual(a.questionIds);
    expect(r.optionOrder).toEqual(a.optionOrder);
    expect(r.responses).toEqual({});
    s.submit(r.id, 'user');
    const rr = s.data.answers.filter((x) => x.attemptId === r.id);
    expect(rr.every((x) => x.mode === 'retake' && !x.firstTry)).toBe(true);
  });

  test('second generated exam for a new learner is fully fresh through the store', () => {
    const { s } = mk();
    const a = s.startExam(s.previewForm('n1'));
    s.submit(a.id, 'user');
    const p = s.previewForm('n2');
    expect(p.freshCount).toBe(60);
    const fams = new Set(a.questionIds.map((id) => s.byId.get(id)!.familyId));
    expect(p.questionIds.filter((id) => fams.has(s.byId.get(id)!.familyId)).length).toBe(0);
  });

  test('fresh question for the same skill comes from a different family', () => {
    const { s } = mk();
    const q = QUESTIONS[0];
    const f = s.freshQuestionFor(q.objective, q.familyId, 'x')!;
    expect(f.objective).toBe(q.objective);
    expect(f.familyId).not.toBe(q.familyId);
  });
});

describe('data migration', () => {
  test('v1 learner data survives an update', () => {
    const kv = memKV();
    const v1 = {
      schemaVersion: 1, createdAt: 1, completedLessons: ['1.1', '2.3'], lessons: { '1.1': { checks: { k1: true } } },
      exposures: { 'support-x': { lastSeen: 5, count: 1 } }, answers: [{ qid: 'gone-question-v1', familyId: 'gone', objective: '1.1', scenario: 'support', correct: true, mode: 'practice', at: 2, firstTry: true }],
      attempts: [{ id: 'old', seed: 's', kind: 'fresh', scenarios: [], questionIds: ['removed-q-v1'], optionOrder: {}, startedAt: 1, deadline: 2, durationMs: 1, status: 'submitted', responses: { 'removed-q-v1': { selected: ['a'] } }, current: 0, freshCount: 60, seenCount: 0 }],
      activeAttemptId: null, bookmarks: ['support-refund-timeout-no-idempotency-v1'], plan: { examDate: '2027-01-01', dailyMinutes: 45 }, diagnostic: null, cases: {}, practice: null,
      futureField: { keep: true },
    };
    kv.setItem(STORAGE_KEY, JSON.stringify(v1));
    const s = new Store({ kv, now: () => 10, bank: QUESTIONS });
    expect(s.data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.data.lessons['1.1'].completedAt).toBeDefined();
    expect(s.data.lessons['1.1'].checks).toEqual({ k1: true });
    expect(s.data.lessons['2.3'].completedAt).toBeDefined();
    expect(s.data.answers.length).toBe(1);
    expect(s.data.attempts[0].responses['removed-q-v1']).toEqual({ selected: ['a'], eliminated: [], flagged: false });
    expect(s.data.bookmarks).toEqual(['support-refund-timeout-no-idempotency-v1']);
    expect(s.data.plan).toEqual({ examDate: '2027-01-01', dailyMinutes: 45 });
    expect((s.data as any).futureField).toEqual({ keep: true });
    // a new exam still builds alongside old history
    expect(s.previewForm('m').questionIds.length).toBe(60);
  });
  test('corrupt storage falls back to defaults without throwing', () => {
    const kv = memKV(); kv.setItem(STORAGE_KEY, '{not json');
    expect(new Store({ kv, now: () => 1, bank: QUESTIONS }).data.attempts).toEqual([]);
    expect(migrate(null).schemaVersion).toBe(SCHEMA_VERSION);
  });
});

test('update() keeps in-place mutations of the draft (lesson completion, practice sessions)', () => {
  const { s, kv } = mk();
  s.update((d) => { d.lessons['1.1'] = { checks: {}, completedAt: 5 }; });
  expect(s.data.lessons['1.1'].completedAt).toBe(5);
  const p = s.startPractice('x', QUESTIONS.slice(0, 2), 'seed');
  expect(s.data.practice?.id).toBe(p.id);
  expect(new Store({ kv, now: () => 1, bank: QUESTIONS }).data.lessons['1.1'].completedAt).toBe(5);
});
