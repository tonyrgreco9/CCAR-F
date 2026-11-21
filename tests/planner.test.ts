import { test, expect } from 'bun:test';
import { buildPlan } from '../src/engine/planner';
import { defaultData } from '../src/engine/storage';
import { LESSONS, CASES } from '../src/content';
test('plan fits daily budget and front-loads prerequisites and heavy domains', () => {
  const d = defaultData(0);
  const p = buildPlan({ data: d, lessons: LESSONS, examDate: '2026-12-20', dailyMinutes: 60, today: new Date('2026-11-20T09:00:00'), refresherIds: [{ id: 'intro-mcp', course: 'Intro MCP' }], diagnosticWeak: ['intro-mcp'], caseScenarios: CASES.map((c) => ({ scenario: c.scenario, title: c.title })) });
  expect(p.daysLeft).toBe(30);
  for (const day of p.days) expect(day.minutes <= 60 || day.items.length === 1).toBe(true);
  const flat = p.days.flatMap((x) => x.items);
  expect(flat[0].label).toContain('diagnostic');
  const firstLesson = flat.find((i) => i.kind === 'lesson')!;
  expect(firstLesson.ref.startsWith('1.')).toBe(true); // Domain 1 has the highest weight
});
