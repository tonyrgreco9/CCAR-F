// Study plan: packs recommended activities into daily sessions within the learner's time budget.
import type { AppData } from './storage';
import type { Lesson, ObjectiveId } from '../content/types';
import { DOMAINS, objectiveDomain } from '../content/blueprint';

export interface PlanItem { kind: 'refresher' | 'lesson' | 'revisit' | 'practice' | 'case' | 'exam' | 'mistakes'; ref: string; label: string; minutes: number; why: string }
export interface PlanDay { date: string; items: PlanItem[]; minutes: number }

export interface PlanInput {
  data: AppData;
  lessons: Lesson[];
  examDate: string; // YYYY-MM-DD
  dailyMinutes: number;
  today: Date;
  refresherIds: { id: string; course: string }[];
  diagnosticWeak: string[];
  caseScenarios: { scenario: string; title: string }[];
}

export function weakObjectives(d: AppData): { id: string; acc: number; n: number }[] {
  const m = new Map<string, { c: number; n: number }>();
  for (const a of d.answers) { const x = m.get(a.objective) ?? { c: 0, n: 0 }; x.n++; if (a.correct) x.c++; m.set(a.objective, x); }
  return [...m.entries()].filter(([, x]) => x.n >= 2 && x.c / x.n < 0.7).map(([id, x]) => ({ id, acc: x.c / x.n, n: x.n })).sort((a, b) => a.acc - b.acc);
}

export function buildPlan(p: PlanInput): { days: PlanDay[]; overflowMinutes: number; daysLeft: number; warnings: string[] } {
  const warnings: string[] = [];
  const start = new Date(p.today.getFullYear(), p.today.getMonth(), p.today.getDate());
  const exam = new Date(p.examDate + 'T00:00:00');
  const daysLeft = Math.max(0, Math.round((exam.getTime() - start.getTime()) / 86400000));
  const budget = Math.max(15, p.dailyMinutes);
  const items: PlanItem[] = [];
  const weight = (id: string) => DOMAINS.find((d) => d.id === objectiveDomain(id as ObjectiveId))!.weight;

  for (const r of p.refresherIds.filter((r) => p.diagnosticWeak.includes(r.id) && !p.data.refreshersDone.includes(r.id)))
    items.push({ kind: 'refresher', ref: r.id, label: `Refresher: ${r.course}`, minutes: 10, why: 'Missed on the prerequisite diagnostic' });
  if (!p.data.diagnostic) items.unshift({ kind: 'refresher', ref: 'diagnostic', label: 'Prerequisite diagnostic', minutes: 10, why: 'Find prerequisite gaps first' });

  const weak = weakObjectives(p.data);
  for (const w of weak) {
    items.push({ kind: 'revisit', ref: w.id, label: `Revisit lesson ${w.id} (compare + mistake sections)`, minutes: 15, why: `${Math.round(w.acc * 100)}% over ${w.n} answers` });
    items.push({ kind: 'practice', ref: w.id, label: `Practice ${w.id} (fresh questions)`, minutes: 15, why: 'Observed weakness' });
  }
  const todo = p.lessons.filter((l) => !p.data.lessons[l.id]?.completedAt)
    .sort((a, b) => weight(b.id) - weight(a.id) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  // keep blueprint order within domain but schedule heavier domains first
  for (const l of todo) items.push({ kind: 'lesson', ref: l.id, label: `Lesson ${l.id}: ${l.title}`, minutes: l.minutes, why: `Domain ${objectiveDomain(l.id)} (${weight(l.id)}% weight)` });
  for (const c of p.caseScenarios.filter((c) => !p.data.cases[c.scenario])) items.push({ kind: 'case', ref: c.scenario, label: `Case study: ${c.title}`, minutes: 20, why: 'Apply decisions in an exam scenario' });
  const examsDone = p.data.attempts.filter((a) => a.status === 'submitted' && a.kind === 'fresh').length;
  for (let i = examsDone; i < 2; i++) items.push({ kind: 'exam', ref: 'exam', label: `Full practice exam ${i + 1} (120 min)`, minutes: 120, why: 'Timed rehearsal on a fresh form' });
  items.push({ kind: 'mistakes', ref: 'mistakes', label: 'Review missed questions', minutes: 20, why: 'Close the loop on errors' });

  if (budget < 120 && items.some((i) => i.kind === 'exam')) warnings.push('A full exam needs 120 minutes; schedule it on a day when you have that time, or extend that day.');
  const days: PlanDay[] = [];
  const nDays = Math.max(1, daysLeft);
  let di = 0;
  let day: PlanDay | null = null;
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const newDay = () => { const d = new Date(start); d.setDate(start.getDate() + di++); day = { date: fmt(d), items: [], minutes: 0 }; days.push(day); };
  let overflow = 0;
  for (const it of items) {
    if (!day || (day as PlanDay).minutes + it.minutes > budget && (day as PlanDay).items.length) {
      if (di >= nDays) { overflow += it.minutes; continue; }
      newDay();
    }
    const dd = day as unknown as PlanDay;
    dd.items.push(it); dd.minutes += it.minutes;
  }
  if (overflow) warnings.push(`About ${Math.ceil(overflow / 60)} hour(s) of recommended work does not fit before the exam date. Increase daily time or prioritise the highest-weight domains.`);
  if (daysLeft === 0) warnings.push('The exam date is today or in the past.');
  return { days, overflowMinutes: overflow, daysLeft, warnings };
}
