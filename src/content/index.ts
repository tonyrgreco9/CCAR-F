// Content registry: everything the app ships offline.
import type { Lesson, Question, CaseStudy, ObjectiveId, ScenarioId } from './types';
import { lessons as d1a } from './lessons/d1a';
import { lessons as d1b } from './lessons/d1b';
import { lessons as d2 } from './lessons/d2';
import { lessons as d3 } from './lessons/d3';
import { lessons as d4 } from './lessons/d4';
import { lessons as d5 } from './lessons/d5';
import { questions as qSupport } from './questions/support';
import { questions as qCodegen } from './questions/codegen';
import { questions as qResearch } from './questions/research';
import { questions as qDevprod } from './questions/devprod';
import { questions as qCi } from './questions/ci';
import { questions as qExtraction } from './questions/extraction';
import { caseStudy as cSupport } from './cases/support';
import { caseStudy as cCodegen } from './cases/codegen';
import { caseStudy as cResearch } from './cases/research';
import { caseStudy as cDevprod } from './cases/devprod';
import { caseStudy as cCi } from './cases/ci';
import { caseStudy as cExtraction } from './cases/extraction';

/** Bump when the bank changes; stored progress keys on stable IDs, so bumps never erase history. */
export const CONTENT_VERSION = '2026.11.20';

export const LESSONS: Lesson[] = [...d1a, ...d1b, ...d2, ...d3, ...d4, ...d5].sort((a, b) =>
  a.id.localeCompare(b.id, undefined, { numeric: true }),
);
export const QUESTIONS: Question[] = [...qSupport, ...qCodegen, ...qResearch, ...qDevprod, ...qCi, ...qExtraction];
export const CASES: CaseStudy[] = [cSupport, cCodegen, cResearch, cDevprod, cCi, cExtraction];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const caseByScenario = (id: ScenarioId) => CASES.find((c) => c.scenario === id);
export const questionsForObjective = (id: ObjectiveId) => QUESTIONS.filter((q) => q.objective === id);
