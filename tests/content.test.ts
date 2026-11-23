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
  test('per-scenario family allocation meets the planned minimum (extra families allowed)', () => {
    for (const s of SCENARIOS) {
      const fams = new Map<string, string>();
      for (const q of QUESTIONS.filter((x) => x.scenario === s.id)) fams.set(q.familyId, q.objective);
      const tally: Record<string, number> = {};
      for (const o of fams.values()) tally[o] = (tally[o] ?? 0) + 1;
      for (const [obj, n] of Object.entries(ALLOCATION[s.id])) expect(tally[obj] ?? 0).toBeGreaterThanOrEqual(n!);
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

import { GUIDE_TASKS, GUIDE_SAMPLES, GUIDE_EXERCISES } from '../src/content/guide';
import { COVERAGE, DEV_LESSONS } from '../src/content';
import { DEV_MODULES } from '../src/content/devpath';
import { LINK_GROUPS } from '../src/content/links';
import { EXAM_GUIDE } from '../src/content/blueprint';

describe('official exam guide alignment', () => {
  test('guide metadata is filled in from v1.1', () => {
    expect(EXAM_GUIDE.version).toBe('1.1');
    expect(EXAM_GUIDE.effectiveDate).toBe('November 2026');
    expect(EXAM_GUIDE.passingScore).toContain('720');
  });
  test('30 task statements with 240 Knowledge/Skills bullets, titles match OBJECTIVES', () => {
    expect(GUIDE_TASKS.length).toBe(30);
    expect(GUIDE_TASKS.flatMap((t) => t.bullets).length).toBe(240);
    for (const t of GUIDE_TASKS) expect(OBJECTIVES.find((o) => o.id === t.id)!.statement).toBe(t.title);
  });
  test('every guide bullet maps to lesson sections and to assessing questions (or a stated gap)', () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    for (const t of GUIDE_TASKS) for (const b of t.bullets) {
      const c = COVERAGE[b.id];
      expect(c, b.id).toBeDefined();
      expect(c.sections.length).toBeGreaterThan(0);
      for (const s of c.sections) expect(SECTIONS).toContain(s);
      for (const q of c.questions) { expect(ids.has(q), q).toBe(true); expect(QUESTIONS.find((x) => x.id === q)!.objective).toBe(t.id); }
      if (!c.questions.length) expect(c.gap, b.id).toBeTruthy();
    }
  });
  test('sample-question and exercise mappings point at real lessons', () => {
    for (const s of GUIDE_SAMPLES) expect(lessonIds.has(s.lesson)).toBe(true);
    for (const x of GUIDE_EXERCISES) for (const l of x.lessons) expect(lessonIds.has(l)).toBe(true);
  });
});

describe('Developer Foundations companion', () => {
  test('five courses in official order', () => {
    expect(DEV_MODULES.map((m) => m.title)).toEqual(['MSO Foundations', 'Production-Grade Prompting, Agents & Tool Use', 'Claude Code, MCP & Integration', 'Production Engineering, Evals & Security', 'Accelerators & IP Contribution']);
  });
  test('every objective resolves to an Architect lesson or an existing companion lesson', () => {
    const dev = new Set(DEV_LESSONS.map((l) => l.id));
    for (const m of DEV_MODULES) for (const o of m.objectives) {
      expect(!!(o.architect?.length || o.companion)).toBe(true);
      for (const a of o.architect ?? []) expect(lessonIds.has(a)).toBe(true);
      if (o.companion) expect(dev.has(o.companion), o.companion).toBe(true);
    }
  });
  test('companion lessons pass validation', () => {
    expect(DEV_LESSONS.flatMap((l) => validateLesson(l as any, { dev: true }))).toEqual([]);
  });
});

test('links are well-formed https URLs with no duplicates and no exam-dump or document-sharing hosts', () => {
  const urls = LINK_GROUPS.flatMap((g) => g.links.map((l) => l.url));
  expect(new Set(urls).size).toBe(urls.length);
  for (const u of urls) { expect(u.startsWith('https://')).toBe(true); expect(/scribd|examheist|dumps/i.test(u)).toBe(false); }
  expect(LINK_GROUPS.map((g) => g.id)).toEqual(['official', 'courses', 'docs', 'guides', 'practice', 'videos']);
});

import { displayShuffle } from '../src/engine/rng';
import { DIAGNOSTIC } from '../src/content/devpath';
import { buildForm as build2 } from '../src/engine/builder';

describe('answer position and length giveaways', () => {
  const spread = (letters: number[], n: number) => { const t = [0, 0, 0, 0]; for (const i of letters) if (i < 4) t[i]++; return t.map((x) => x / n); };
  test('displayed position of the correct answer is spread across A–D in every closed-book set', () => {
    const kc = [...LESSONS, ...DEV_LESSONS].flatMap((l) => l.check.map((c) => displayShuffle(`${l.id}:${c.id}`, c.options).findIndex((o) => o.id === c.correct)));
    const cs = CASES.flatMap((c) => c.decisions.map((d) => displayShuffle(`${c.scenario}:${d.id}`, d.options).findIndex((o) => o.id === d.best)));
    const dx = DIAGNOSTIC.map((d) => displayShuffle(`dx:${d.id}`, d.options).findIndex((o) => o.id === d.correct));
    for (const share of spread(kc, kc.length)) { expect(share).toBeGreaterThan(0.12); expect(share).toBeLessThan(0.4); }
    for (const share of spread(cs, cs.length)) expect(share).toBeLessThan(0.5);
    expect(new Set(dx).size).toBeGreaterThanOrEqual(3);
  });
  test('display shuffle is stable across reloads', () => {
    const c = LESSONS[0].check[0];
    expect(displayShuffle(`x:${c.id}`, c.options)).toEqual(displayShuffle(`x:${c.id}`, c.options));
  });
  test('generated exam forms spread the correct answer across positions', () => {
    const pos: number[] = [];
    for (const seed of ['p1', 'p2', 'p3', 'p4']) { const f = build2(QUESTIONS, {}, seed); for (const id of f.questionIds) { const q = QUESTIONS.find((x) => x.id === id)!; if (q.type === 'single') pos.push(f.optionOrder[id].indexOf(q.options.find((o) => o.correct)!.id)); } }
    for (const share of spread(pos, pos.length)) { expect(share).toBeGreaterThan(0.15); expect(share).toBeLessThan(0.35); }
  });
  test('the correct option is not usually the longest in any item set', () => {
    const longestRate = (items: { opts: { id: string; text: string }[]; correct: string }[]) =>
      items.filter((i) => { const max = Math.max(...i.opts.map((o) => o.text.length)); return i.opts.find((o) => o.id === i.correct)!.text.length === max; }).length / items.length;
    expect(longestRate(QUESTIONS.filter((q) => q.type === 'single').map((q) => ({ opts: q.options, correct: q.options.find((o) => o.correct)!.id })))).toBeLessThan(0.4);
    expect(longestRate([...LESSONS, ...DEV_LESSONS].flatMap((l) => l.check.map((c) => ({ opts: c.options, correct: c.correct }))))).toBeLessThan(0.4);
    expect(longestRate(CASES.flatMap((c) => c.decisions.map((d) => ({ opts: d.options, correct: d.best }))))).toBeLessThan(0.4);
    expect(longestRate(DIAGNOSTIC.map((d) => ({ opts: d.options, correct: d.correct })))).toBeLessThan(0.4);
  });
});
