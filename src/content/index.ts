// Content registry: everything the app ships offline.
import type { Lesson, Question, CaseStudy, ObjectiveId, ScenarioId, BulletCoverage, DevLesson } from './types';
import { devLessons as dl12 } from './devLessons/m12';
import { devLessons as dl3 } from './devLessons/m3';
import { devLessons as dl45 } from './devLessons/m45';
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
import { questions as x1 } from './questions/extra-d1';
import { questions as x2 } from './questions/extra-d2';
import { questions as x3 } from './questions/extra-d3';
import { questions as x4 } from './questions/extra-d4';
import { questions as x5 } from './questions/extra-d5';
import { coverage as cv1 } from './coverage/d1';
import { coverage as cv2 } from './coverage/d2';
import { coverage as cv3 } from './coverage/d3';
import { coverage as cv4 } from './coverage/d4';
import { coverage as cv5 } from './coverage/d5';
import { caseStudy as cSupport } from './cases/support';
import { caseStudy as cCodegen } from './cases/codegen';
import { caseStudy as cResearch } from './cases/research';
import { caseStudy as cDevprod } from './cases/devprod';
import { caseStudy as cCi } from './cases/ci';
import { caseStudy as cExtraction } from './cases/extraction';

/** Bump when the bank changes; stored progress keys on stable IDs, so bumps never erase history. */
export const CONTENT_VERSION = '2026.11.21';

export const LESSONS: Lesson[] = [...d1a, ...d1b, ...d2, ...d3, ...d4, ...d5].sort((a, b) =>
  a.id.localeCompare(b.id, undefined, { numeric: true }),
);
export const QUESTIONS: Question[] = [...qSupport, ...qCodegen, ...qResearch, ...qDevprod, ...qCi, ...qExtraction, ...x1, ...x2, ...x3, ...x4, ...x5];
export const COVERAGE: Record<string, BulletCoverage> = { ...cv1, ...cv2, ...cv3, ...cv4, ...cv5 };
export const CASES: CaseStudy[] = [cSupport, cCodegen, cResearch, cDevprod, cCi, cExtraction];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const caseByScenario = (id: ScenarioId) => CASES.find((c) => c.scenario === id);
export const questionsForObjective = (id: ObjectiveId) => QUESTIONS.filter((q) => q.objective === id);

export const DEV_LESSONS: DevLesson[] = [...dl12, ...dl3, ...dl45].sort((a, b) => a.module - b.module);
export const devLessonById = (id: string) => DEV_LESSONS.find((l) => l.id === id);
