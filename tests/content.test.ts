import { describe, test, expect } from 'bun:test';
import { QUESTIONS, LESSONS, CASES } from '../src/content';
import { OBJECTIVES, SCENARIOS, objectiveDomain } from '../src/content/blueprint';
import { validateBank, validateLesson, validateCase, validateQuestion, SECTIONS } from '../src/content/validate';
import { sourceById } from '../src/content/sources';
import { ALLOCATION } from './helpers/synthetic';

const lessonIds = new Set(LESSONS.map((l) => l.id));

describe('lessons', () => {
  test('one lesson per task statement (30)', () => {
    expect(LESSONS.length).toBe(30);
    expect([...lessonIds].sort()).toEqual(OBJECTIVES.map((o) => o.id).sort());
  });
  test('every lesson passes content validation', () => {
    const errs = LESSONS.flatMap(validateLesson);
    expect(errs).toEqual([]);
  });
});

describe('question bank', () => {
  test('passes validation: answer keys, counts, rationales, sources, remediation links', () => {
    expect(validateBank(QUESTIONS, lessonIds)).toEqual([]);
  });
  test('unique question ids and option ids', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
  test('every remediation link resolves to an existing lesson section', () => {
    for (const q of QUESTIONS) {
      expect(lessonIds.has(q.remediation.lesson)).toBe(true);
      expect(SECTIONS).toContain(q.remediation.section);
    }
  });
  test('every source reference exists', () => {
    for (const q of QUESTIONS) for (const s of q.sources) expect(sourceById(s)).toBeDefined();
  });
  test('per-scenario family allocation matches the blueprint plan', () => {
    for (const s of SCENARIOS) {
      const fams = new Map<string, string>();
      for (const q of QUESTIONS.filter((x) => x.scenario === s.id)) fams.set(q.familyId, q.objective);
      const tally: Record<string, number> = {};
      for (const o of fams.values()) tally[o] = (tally[o] ?? 0) + 1;
      expect(tally).toEqual(ALLOCATION[s.id] as any);
    }
  });
  test('family members share scenario and objective', () => {
    const m = new Map<string, string>();
    for (const q of QUESTIONS) {
      const k = `${q.scenario}|${q.objective}`;
      if (m.has(q.familyId)) expect(m.get(q.familyId)).toBe(k);
      m.set(q.familyId, k);
    }
  });
  test('selection counts are stated in the stem and match the key', () => {
    for (const q of QUESTIONS) {
      const word = ['', 'ONE', 'TWO', 'THREE'][q.selectCount];
      expect(q.stem).toContain(`Select ${word}`);
      expect(q.options.filter((o) => o.correct).length).toBe(q.selectCount);
    }
  });
  test('correct answers are not concentrated in one authored position', () => {
    const pos: Record<number, number> = {};
    for (const q of QUESTIONS.filter((x) => x.type === 'single')) { const i = q.options.findIndex((o) => o.correct); pos[i] = (pos[i] ?? 0) + 1; }
    const n = QUESTIONS.filter((x) => x.type === 'single').length;
    for (const v of Object.values(pos)) expect(v / n).toBeLessThan(0.45);
  });
  test('correct option is not systematically the longest', () => {
    const singles = QUESTIONS.filter((x) => x.type === 'single');
    const longest = singles.filter((q) => { const max = Math.max(...q.options.map((o) => o.text.length)); return q.options.find((o) => o.correct)!.text.length === max; }).length;
    expect(longest / singles.length).toBeLessThan(0.5);
  });
  test('both item types are present in every scenario', () => {
    for (const s of SCENARIOS) {
      const qs = QUESTIONS.filter((q) => q.scenario === s.id);
      expect(qs.some((q) => q.type === 'multi')).toBe(true);
      expect(qs.some((q) => q.type === 'single')).toBe(true);
    }
  });
  test('validator rejects generic or letter-based feedback', () => {
    const q = structuredClone(QUESTIONS[0]);
    const d = q.options.find((o) => !o.correct)!;
    d.refutingFact = 'This is incorrect because another answer is the best answer.';
    d.consequence = 'Option B would be better here, so choose B instead of this choice.';
    const errs = validateQuestion(q, lessonIds);
    expect(errs.some((e) => e.includes('generic'))).toBe(true);
    expect(errs.some((e) => e.includes('letter'))).toBe(true);
  });
  test('required refund pair exists with flipped decisions', () => {
    const a = QUESTIONS.find((q) => q.familyId === 'support-refund-timeout-no-idempotency');
    const b = QUESTIONS.find((q) => q.familyId === 'support-refund-timeout-idempotent-key');
    expect(a && b).toBeTruthy();
    expect(a!.familyId).not.toBe(b!.familyId);
  });
});

describe('case studies', () => {
  test('six case studies, one per scenario family, each valid', () => {
    expect(CASES.map((c) => c.scenario).sort()).toEqual(SCENARIOS.map((s) => s.id).sort());
    expect(CASES.flatMap((c) => validateCase(c, lessonIds))).toEqual([]);
  });
});

test('domain derived from objective', () => {
  expect(objectiveDomain('4.3')).toBe(4);
});
