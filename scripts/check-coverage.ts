// Usage: bun scripts/check-coverage.ts <domain 1-5>
// Verifies every official guide bullet in the domain has a coverage entry pointing at real sections and real question IDs,
// and validates the domain's extra question file.
import { GUIDE_TASKS } from '../src/content/guide';
import { QUESTIONS, LESSONS } from '../src/content';
import { validateQuestion, validateLesson, SECTIONS } from '../src/content/validate';
const d = process.argv[2];
const { coverage } = await import(`../src/content/coverage/d${d}.ts`);
const { questions: extra } = await import(`../src/content/questions/extra-d${d}.ts`);
const ids = new Set(QUESTIONS.map((q) => q.id));
const lessonIds = new Set<string>(LESSONS.map((l) => l.id));
const errs: string[] = [];
let n = 0, gaps = 0;
for (const t of GUIDE_TASKS.filter((t) => t.id.startsWith(d + '.'))) for (const b of t.bullets) {
  n++;
  const c = coverage[b.id];
  if (!c) { errs.push(`${b.id}: no coverage entry`); continue; }
  if (!c.sections?.length) errs.push(`${b.id}: no sections`);
  for (const s of c.sections ?? []) if (!SECTIONS.includes(s)) errs.push(`${b.id}: bad section ${s}`);
  if (!c.how || c.how.length < 40) errs.push(`${b.id}: 'how' too short`);
  for (const q of c.questions ?? []) if (!ids.has(q)) errs.push(`${b.id}: unknown question ${q}`);
  if (!(c.questions ?? []).length && !c.gap) errs.push(`${b.id}: no assessing question and no gap note`);
  for (const q of c.questions ?? []) { const qq = QUESTIONS.find((x) => x.id === q); if (qq && qq.objective !== t.id) errs.push(`${b.id}: question ${q} is objective ${qq.objective}, not ${t.id}`); }
  if (c.gap) gaps++;
}
for (const k of Object.keys(coverage)) if (!k.startsWith(d + '.')) errs.push(`unexpected key ${k}`);
for (const q of extra) { errs.push(...validateQuestion(q, lessonIds)); if (!q.familyId.includes('-')) errs.push('bad family'); }
for (const l of LESSONS.filter((l) => l.id.startsWith(d + '.'))) errs.push(...validateLesson(l));
const fam = new Set(QUESTIONS.map((q) => q.familyId)); if (fam.size !== new Set(QUESTIONS.map((q) => q.familyId + '|' + q.scenario + '|' + q.objective)).size) errs.push('family spans scenario/objective');
if (new Set(QUESTIONS.map((q) => q.id)).size !== QUESTIONS.length) errs.push('duplicate question id across bank');
console.log(`domain ${d}: ${n} bullets, ${Object.keys(coverage).length} entries, ${gaps} with gap notes, ${extra.length} extra questions`);
if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
console.log('OK');
