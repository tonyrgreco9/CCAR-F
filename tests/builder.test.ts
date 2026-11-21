import { describe, test, expect } from 'bun:test';
import { QUESTIONS } from '../src/content';
import { buildForm, recordExposure, allCombos, familiesOf, type ExposureMap } from '../src/engine/builder';
import { EXAM_GUIDE, objectiveDomain } from '../src/content/blueprint';

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const fam = (id: string) => byId.get(id)!.familyId;

function checkForm(f: ReturnType<typeof buildForm>) {
  expect(f.questionIds.length).toBe(60);
  expect(new Set(f.questionIds).size).toBe(60);
  const fams = f.questionIds.map(fam);
  expect(new Set(fams).size).toBe(60); // no repeated family
  expect(new Set(f.scenarios).size).toBe(4);
  // grouped by scenario, 15 each, in scenario order
  f.scenarios.forEach((s, i) => {
    const block = f.questionIds.slice(i * 15, i * 15 + 15);
    for (const id of block) expect(byId.get(id)!.scenario).toBe(s);
  });
  const dc: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const id of f.questionIds) dc[objectiveDomain(byId.get(id)!.objective)]++;
  expect(dc).toEqual(EXAM_GUIDE.format.domainTargets as any);
  expect(f.deviations).toEqual([]);
  for (const id of f.questionIds) expect([...f.optionOrder[id]].sort()).toEqual(byId.get(id)!.options.map((o) => o.id).sort());
}

describe('form builder', () => {
  test('all 15 four-scenario combinations produce valid 60-question forms on the blueprint', () => {
    const combos = allCombos();
    expect(combos.length).toBe(15);
    for (const c of combos) {
      const f = buildForm(QUESTIONS, {}, `combo-${c.join('-')}`, { combos: [c] });
      expect([...f.scenarios].sort()).toEqual([...c].sort());
      checkForm(f);
    }
  });

  test('two consecutive fresh exams have zero family overlap — every first combination, several seeds', () => {
    let worst = 60;
    const overlaps: number[] = [];
    for (const c of allCombos()) for (const seed of ['s1', 's2', 's3']) {
      const f1 = buildForm(QUESTIONS, {}, `${seed}-${c.join()}`, { combos: [c] });
      checkForm(f1);
      expect(f1.freshCount).toBe(60);
      const ex = recordExposure({}, QUESTIONS, f1.questionIds, 1000);
      const f2 = buildForm(QUESTIONS, ex, `${seed}-second`);
      checkForm(f2);
      const a = new Set(f1.questionIds.map(fam));
      const overlap = f2.questionIds.map(fam).filter((x) => a.has(x)).length;
      overlaps.push(overlap);
      worst = Math.min(worst, f2.freshCount);
      expect(f2.freshCount).toBe(60);
      expect(f2.seenCount).toBe(overlap);
    }
    expect(Math.max(...overlaps)).toBe(0);
  });

  test('unconstrained random first forms (many seeds) are always followed by a fully fresh second form', () => {
    for (let i = 0; i < 25; i++) {
      const f1 = buildForm(QUESTIONS, {}, `rand-${i}`);
      const f2 = buildForm(QUESTIONS, recordExposure({}, QUESTIONS, f1.questionIds, 1), `rand-${i}-b`);
      expect(f2.seenCount).toBe(0);
    }
  });

  test('seeded forms are reproducible', () => {
    const a = buildForm(QUESTIONS, {}, 'repro');
    const b = buildForm(QUESTIONS, {}, 'repro');
    expect(b).toEqual(a);
    const c = buildForm(QUESTIONS, {}, 'repro-2');
    expect(c.questionIds).not.toEqual(a.questionIds);
  });

  test('repeat counts are accurate and least-recently-seen material is reused after exhaustion', () => {
    let ex: ExposureMap = {};
    const totalFam = familiesOf(QUESTIONS).size;
    let t = 1000;
    const forms = [];
    for (let i = 0; i < 6; i++) {
      const f = buildForm(QUESTIONS, ex, `exhaust-${i}`);
      checkForm(f);
      const seenNow = f.questionIds.filter((id) => ex[fam(id)]).length;
      expect(f.seenCount).toBe(seenNow);
      expect(f.freshCount).toBe(60 - seenNow);
      // reused families must be the least recently seen ones available in the chosen cells
      if (seenNow > 0) {
        const reused = f.questionIds.map(fam).filter((x) => ex[x]);
        const maxReusedTime = Math.max(...reused.map((x) => ex[x].lastSeen));
        const mostRecent = Math.max(...Object.values(ex).map((e) => e.lastSeen));
        expect(maxReusedTime).toBeLessThanOrEqual(mostRecent);
      }
      forms.push(f);
      ex = recordExposure(ex, QUESTIONS, f.questionIds, (t += 1000));
    }
    expect(Object.keys(ex).length).toBeLessThanOrEqual(totalFam);
    // after exhaustion, families from the most recent form are avoided when older ones exist
    const last = forms[5], prev = new Set(forms[4].questionIds.map(fam));
    const repeatsOfPrev = last.questionIds.map(fam).filter((x) => prev.has(x)).length;
    expect(repeatsOfPrev).toBeLessThan(15);
  });

  test('freshness counts drive the form preview', () => {
    const f1 = buildForm(QUESTIONS, {}, 'pv');
    expect(f1.freshCount + f1.seenCount).toBe(60);
  });
});
