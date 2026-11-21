// Synthetic bank shaped like the authored allocation (for builder tests independent of content edits).
import type { Question, ScenarioId, ObjectiveId } from '../../src/content/types';
export const ALLOCATION: Record<ScenarioId, Partial<Record<ObjectiveId, number>>> = {
  support: { '1.1': 2, '1.2': 1, '1.4': 3, '1.5': 2, '1.7': 1, '2.1': 3, '2.2': 2, '2.3': 2, '3.1': 1, '3.2': 1, '3.5': 1, '4.1': 2, '4.2': 1, '4.3': 1, '4.4': 1, '5.1': 3, '5.2': 4, '5.5': 1 },
  codegen: { '1.3': 1, '1.5': 1, '1.6': 2, '1.7': 2, '2.4': 2, '2.5': 4, '3.1': 2, '3.2': 2, '3.3': 2, '3.4': 3, '3.5': 2, '4.1': 1, '4.2': 1, '4.6': 2, '5.1': 1, '5.4': 4 },
  research: { '1.1': 1, '1.2': 4, '1.3': 3, '1.6': 3, '1.7': 1, '2.1': 1, '2.2': 2, '2.3': 2, '3.2': 1, '3.4': 1, '4.1': 1, '4.3': 1, '4.4': 1, '4.5': 1, '4.6': 1, '5.1': 1, '5.3': 3, '5.6': 4 },
  devprod: { '1.2': 1, '1.3': 1, '1.5': 1, '1.6': 2, '1.7': 2, '2.1': 1, '2.2': 1, '2.4': 3, '2.5': 2, '3.1': 3, '3.2': 3, '3.3': 2, '3.4': 1, '3.5': 1, '4.1': 1, '4.2': 1, '4.5': 1, '4.6': 1, '5.2': 1, '5.3': 1, '5.4': 2 },
  ci: { '1.1': 2, '1.4': 1, '1.5': 1, '1.6': 1, '1.7': 1, '2.2': 1, '2.3': 1, '2.4': 1, '2.5': 1, '3.1': 1, '3.2': 1, '3.3': 1, '3.5': 1, '3.6': 6, '4.1': 2, '4.2': 1, '4.3': 2, '4.5': 2, '4.6': 2, '5.3': 1, '5.4': 1, '5.5': 1 },
  extraction: { '1.1': 2, '1.2': 1, '1.4': 1, '1.5': 2, '2.1': 2, '2.2': 2, '2.3': 2, '3.5': 1, '3.6': 1, '4.1': 1, '4.2': 2, '4.3': 3, '4.4': 3, '4.5': 2, '4.6': 1, '5.3': 1, '5.5': 4, '5.6': 1 },
};
export function syntheticBank(scale = 1): Question[] {
  const out: Question[] = [];
  for (const [s, alloc] of Object.entries(ALLOCATION)) for (const [obj, n] of Object.entries(alloc)) for (let i = 0; i < Math.round(n! * scale); i++) {
    const fam = `${s}-o${obj.replace('.', '')}-${i}`;
    out.push({ id: `${fam}-v1`, familyId: fam, scenario: s as ScenarioId, objective: obj as ObjectiveId, type: 'single', selectCount: 1, stem: '', options: [{ id: 'a', text: 'x', correct: true }, { id: 'b', text: 'y', correct: false }, { id: 'c', text: 'z', correct: false }, { id: 'd', text: 'w', correct: false }], decidingClue: '', explanation: '', remediation: { lesson: obj as ObjectiveId, section: 'compare' }, sources: [] });
  }
  return out;
}
