// Versioned learner data. Everything lives in localStorage under one key; no account or backend.
// Migrations only ADD defaults or reshape — they never drop learner progress.
import type { ScenarioId } from '../content/types';
import type { ExamAttempt, Response } from './exam';
import type { ExposureMap } from './builder';

export const STORAGE_KEY = 'ccarf-prep';
export const SCHEMA_VERSION = 2;

export interface AnswerRecord {
  qid: string;
  familyId: string;
  objective: string;
  scenario: ScenarioId;
  correct: boolean;
  unanswered?: boolean;
  /** practice = practice mode; exam = first attempt at a full exam form; retake = exact retry */
  mode: 'practice' | 'exam' | 'retake';
  at: number;
  attemptId?: string;
  /** true when this is the learner's first-ever answer to this question family */
  firstTry: boolean;
}

export interface LessonProgress {
  completedAt?: number;
  checks: Record<string, boolean>; // knowledge-check item id -> correct on first try
  exercise?: Record<string, string>; // exercise item id -> label chosen
  lastSection?: string;
}

export interface PracticeSession {
  id: string;
  label: string;
  questionIds: string[];
  optionOrder: Record<string, string[]>;
  responses: Record<string, Response>;
  submitted: Record<string, boolean>;
  current: number;
  startedAt: number;
}

export interface AppData {
  schemaVersion: number;
  createdAt: number;
  lessons: Record<string, LessonProgress>;
  exposures: ExposureMap;
  answers: AnswerRecord[];
  attempts: ExamAttempt[];
  activeAttemptId: string | null;
  bookmarks: string[];
  plan: { examDate: string; dailyMinutes: number } | null;
  diagnostic: { at: number; answers: Record<string, string>; score: number } | null;
  cases: Record<string, Record<string, string>>; // scenario -> decision id -> chosen option
  practice: PracticeSession | null;
  refreshersDone: string[];
}

export function defaultData(now = Date.now()): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    lessons: {},
    exposures: {},
    answers: [],
    attempts: [],
    activeAttemptId: null,
    bookmarks: [],
    plan: null,
    diagnostic: null,
    cases: {},
    practice: null,
    refreshersDone: [],
  };
}

/**
 * Bring any previously stored shape up to the current schema.
 * v1 (initial release): lacked refreshersDone and stored completed lessons as `completedLessons: string[]`.
 * Unknown future fields are preserved.
 */
export function migrate(raw: any, now = Date.now()): AppData {
  if (!raw || typeof raw !== 'object') return defaultData(now);
  const d: any = { ...defaultData(now), ...raw };
  const from = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;
  if (from < 2) {
    if (Array.isArray(raw.completedLessons)) {
      d.lessons = { ...(raw.lessons ?? {}) };
      for (const id of raw.completedLessons) d.lessons[id] = { checks: {}, ...(d.lessons[id] ?? {}), completedAt: d.lessons[id]?.completedAt ?? raw.createdAt ?? now };
      delete d.completedLessons;
    }
    d.refreshersDone = Array.isArray(raw.refreshersDone) ? raw.refreshersDone : [];
  }
  // defensive normalisation
  d.attempts = Array.isArray(d.attempts) ? d.attempts : [];
  d.answers = Array.isArray(d.answers) ? d.answers : [];
  d.bookmarks = Array.isArray(d.bookmarks) ? d.bookmarks : [];
  d.exposures = d.exposures && typeof d.exposures === 'object' ? d.exposures : {};
  for (const a of d.attempts) {
    a.responses ??= {};
    for (const k of Object.keys(a.responses)) {
      const r = a.responses[k];
      a.responses[k] = { selected: r.selected ?? [], eliminated: r.eliminated ?? [], flagged: !!r.flagged };
    }
    a.deviations ??= [];
  }
  if (d.activeAttemptId && !d.attempts.some((a: ExamAttempt) => a.id === d.activeAttemptId && a.status === 'active')) d.activeAttemptId = null;
  d.schemaVersion = SCHEMA_VERSION;
  return d as AppData;
}

export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }

export function load(kv: KV | null, now = Date.now()): AppData {
  try {
    const s = kv?.getItem(STORAGE_KEY);
    return migrate(s ? JSON.parse(s) : null, now);
  } catch {
    return defaultData(now);
  }
}

export function save(kv: KV | null, d: AppData) {
  try { kv?.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
}
