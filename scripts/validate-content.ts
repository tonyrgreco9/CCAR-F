// `bun run validate` — validates all bundled content and prints bank statistics.
import { QUESTIONS, LESSONS, CASES } from '../src/content';
import { validateBank, validateLesson, validateCase } from '../src/content/validate';
import { SCENARIOS } from '../src/content/blueprint';
const ids = new Set<string>(LESSONS.map((l) => l.id));
const errs = [...validateBank(QUESTIONS, ids), ...LESSONS.flatMap(validateLesson), ...CASES.flatMap((c) => validateCase(c, ids))];
const fams = new Set(QUESTIONS.map((q) => q.familyId));
console.log(`lessons: ${LESSONS.length}  case studies: ${CASES.length}  questions: ${QUESTIONS.length}  families: ${fams.size}  multi-response: ${QUESTIONS.filter((q) => q.type === 'multi').length}`);
for (const s of SCENARIOS) { const qs = QUESTIONS.filter((q) => q.scenario === s.id); console.log(`  ${s.id.padEnd(11)} ${qs.length} questions, ${new Set(qs.map((q) => q.familyId)).size} families`); }
if (errs.length) { console.error(errs.join('\n')); console.error(`${errs.length} problem(s)`); process.exit(1); }
console.log('content OK');
