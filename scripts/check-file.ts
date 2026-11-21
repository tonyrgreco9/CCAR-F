// Usage: bun scripts/check-file.ts src/content/questions/support.ts
// Validates one content file in isolation (lesson links checked against all 30 objective IDs).
import { validateQuestion, validateLesson, validateCase } from '../src/content/validate';
import { OBJECTIVES } from '../src/content/blueprint';
import { resolve } from 'path';

const file = process.argv[2];
if (!file) { console.error('usage: bun scripts/check-file.ts <file>'); process.exit(2); }
const mod = await import(resolve(file));
const ids = new Set<string>(OBJECTIVES.map((o) => o.id));
const errs: string[] = [];
if (mod.questions) {
  const qs = mod.questions as any[];
  const seen = new Set<string>();
  for (const q of qs) { if (seen.has(q.id)) errs.push('duplicate id ' + q.id); seen.add(q.id); errs.push(...validateQuestion(q, ids)); }
  const tally: Record<string, number> = {};
  const fams = new Set(qs.map((q) => q.familyId));
  for (const q of qs) tally[q.objective] = (tally[q.objective] ?? 0) + 1;
  const pos: Record<string, number> = {};
  for (const q of qs) for (const o of q.options) if (o.correct) pos[o.id] = (pos[o.id] ?? 0) + 1;
  console.log(`${qs.length} questions, ${fams.size} families, multi=${qs.filter((q) => q.type === 'multi').length}`);
  console.log('per objective:', JSON.stringify(tally));
  console.log('correct option ids:', JSON.stringify(pos));
}
if (mod.lessons) for (const l of mod.lessons) errs.push(...validateLesson(l));
if (mod.caseStudy) errs.push(...validateCase(mod.caseStudy, ids));
if (errs.length) { console.log(errs.join('\n')); console.log(`\n${errs.length} problem(s)`); process.exit(1); }
console.log('OK');
