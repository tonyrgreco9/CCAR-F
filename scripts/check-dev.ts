// Usage: bun scripts/check-dev.ts src/content/devLessons/m12.ts
import { validateLesson } from '../src/content/validate';
import { DEV_MODULES } from '../src/content/devpath';
import { resolve } from 'path';
const { devLessons } = await import(resolve(process.argv[2]));
const wanted = new Set(DEV_MODULES.flatMap((m) => m.objectives.map((o) => o.companion).filter(Boolean)));
const errs: string[] = [];
for (const l of devLessons) {
  errs.push(...validateLesson(l as any, { dev: true }));
  if (!wanted.has(l.id)) errs.push(`${l.id}: not referenced by any module objective in devpath.ts`);
  if (!DEV_MODULES.some((m) => m.order === l.module)) errs.push(`${l.id}: bad module`);
}
console.log(`${devLessons.length} dev lessons`);
if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
console.log('OK');
