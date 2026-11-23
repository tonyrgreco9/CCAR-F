// Usage: bun scripts/check-giveaways.ts [filter]
// Reports, for every closed-book item set, how often the correct option is the longest one.
// Target: at most 1 of 3 checks per lesson, at most 1 of 4 decisions per case, under 35% overall.
import { LESSONS, DEV_LESSONS, CASES } from '../src/content';
import { DIAGNOSTIC } from '../src/content/devpath';
const f = process.argv[2] ?? '';
const isLongest = (opts: { id: string; text: string }[], correct: string) => {
  const max = Math.max(...opts.map((o) => o.text.length));
  return opts.find((o) => o.id === correct)!.text.length === max;
};
let bad = 0, total = 0;
const report = (name: string, items: { id: string; opts: { id: string; text: string }[]; correct: string }[], maxAllowed: number) => {
  if (f && !name.includes(f)) return;
  const hits = items.filter((i) => isLongest(i.opts, i.correct));
  total += items.length; bad += hits.length;
  const flag = hits.length > maxAllowed ? '  <-- too many' : '';
  console.log(`${name.padEnd(34)} ${hits.length}/${items.length}${flag}${hits.length ? '  [' + hits.map((h) => h.id).join(', ') + ']' : ''}`);
  return hits.length <= maxAllowed;
};
let ok = true;
for (const l of LESSONS) ok = report(`lesson ${l.id}`, l.check.map((c) => ({ id: c.id, opts: c.options, correct: c.correct })), 1) !== false && ok;
for (const l of DEV_LESSONS) ok = report(`dev ${l.id}`, l.check.map((c) => ({ id: c.id, opts: c.options, correct: c.correct })), 1) !== false && ok;
for (const c of CASES) ok = report(`case ${c.scenario}`, c.decisions.map((d) => ({ id: d.id, opts: d.options, correct: d.best })), 1) !== false && ok;
ok = report('diagnostic', DIAGNOSTIC.map((d) => ({ id: d.id, opts: d.options, correct: d.correct })), 3) !== false && ok;
console.log(`\noverall: ${bad}/${total} (${Math.round((100 * bad) / Math.max(1, total))}%)`);
process.exit(ok ? 0 : 1);
