// Content validation used by tests and `bun run validate`.
import type { Question, Lesson, CaseStudy, LessonSection, ObjectiveId } from './types';
import { OBJECTIVES } from './blueprint';
import { sourceById } from './sources';

export const SECTIONS: LessonSection[] = ['concept', 'example', 'compare', 'mistake', 'exercise', 'check', 'review'];
const OBJ_IDS = new Set(OBJECTIVES.map((o) => o.id));

/** Phrases that signal generic, non-specific feedback. */
const GENERIC = [
  /\bis (the )?(best|correct|right) answer\b/i,
  /\bbecause (another|the other|a different) (option|answer|choice)\b/i,
  /^(this|it) is (incorrect|wrong|not correct)\.?$/i,
  /^incorrect\.?$/i,
  /^correct\.?$/i,
];
/** Rationales must not reference shuffled display letters. */
const LETTER_REF = /\b(option|choice|answer)s? \(?[A-F]\)?(?![a-z])|\b[A-F] (is|would|and [A-F])\b|\(([A-F])\)/;

function checkText(errs: string[], where: string, text: string | undefined, min = 60) {
  if (!text || !text.trim()) { errs.push(`${where}: missing`); return; }
  if (text.trim().length < min) errs.push(`${where}: too short (${text.trim().length} < ${min})`);
  for (const g of GENERIC) if (g.test(text)) errs.push(`${where}: generic feedback ("${text.slice(0, 60)}…")`);
  if (LETTER_REF.test(text)) errs.push(`${where}: references an option letter`);
}

export function validateQuestion(q: Question, lessonIds?: Set<string>): string[] {
  const e: string[] = [];
  const w = `question ${q.id}`;
  if (!/^[a-z0-9-]+$/.test(q.id)) e.push(`${w}: id must be kebab-case`);
  if (!q.id.startsWith(q.familyId + '-v')) e.push(`${w}: id must be <familyId>-vN`);
  if (!q.familyId.startsWith(q.scenario + '-')) e.push(`${w}: familyId must start with scenario`);
  if (!OBJ_IDS.has(q.objective)) e.push(`${w}: unknown objective ${q.objective}`);
  const correct = q.options.filter((o) => o.correct);
  if (q.type === 'single') {
    if (q.selectCount !== 1) e.push(`${w}: single must have selectCount 1`);
    if (q.options.length !== 4) e.push(`${w}: single must have 4 options`);
    if (!/Select ONE\.?\s*$/.test(q.stem.trim())) e.push(`${w}: stem must end with "Select ONE."`);
  } else {
    if (q.selectCount !== 2 && q.selectCount !== 3) e.push(`${w}: multi selectCount must be 2 or 3`);
    if (q.options.length < 5 || q.options.length > 6) e.push(`${w}: multi must have 5–6 options`);
    const word = q.selectCount === 2 ? 'TWO' : 'THREE';
    if (!new RegExp(`Select ${word}\\.?\\s*$`).test(q.stem.trim())) e.push(`${w}: stem must end with "Select ${word}."`);
  }
  if (correct.length !== q.selectCount) e.push(`${w}: ${correct.length} correct options but selectCount ${q.selectCount}`);
  const ids = new Set<string>();
  for (const o of q.options) {
    if (ids.has(o.id)) e.push(`${w}: duplicate option id ${o.id}`);
    ids.add(o.id);
    if (!/^[a-f]$/.test(o.id)) e.push(`${w}: option id must be a–f`);
    if (!o.text || o.text.length < 8) e.push(`${w}/${o.id}: option text too short`);
    if (/\b(all|none) of the above\b/i.test(o.text)) e.push(`${w}/${o.id}: all/none of the above`);
    if (o.correct) {
      checkText(e, `${w}/${o.id}.whyItWorks`, o.whyItWorks);
      checkText(e, `${w}/${o.id}.supportingClue`, o.supportingClue, 30);
    } else {
      checkText(e, `${w}/${o.id}.assumption`, o.assumption, 30);
      checkText(e, `${w}/${o.id}.refutingFact`, o.refutingFact, 30);
      checkText(e, `${w}/${o.id}.consequence`, o.consequence, 30);
      if (o.wouldBeRightIf !== undefined) checkText(e, `${w}/${o.id}.wouldBeRightIf`, o.wouldBeRightIf, 30);
    }
  }
  checkText(e, `${w}.decidingClue`, q.decidingClue, 25);
  checkText(e, `${w}.explanation`, q.explanation, 80);
  if (!q.sources?.length) e.push(`${w}: no sources`);
  for (const s of q.sources ?? []) if (!sourceById(s)) e.push(`${w}: unknown source ${s}`);
  if (!SECTIONS.includes(q.remediation?.section)) e.push(`${w}: bad remediation section`);
  if (lessonIds && !lessonIds.has(q.remediation?.lesson)) e.push(`${w}: remediation lesson ${q.remediation?.lesson} missing`);
  if (q.stem.length < 120) e.push(`${w}: stem too short`);
  return e;
}

export function validateLesson(l: Lesson): string[] {
  const e: string[] = [];
  const w = `lesson ${l.id}`;
  if (!OBJ_IDS.has(l.id)) e.push(`${w}: unknown objective`);
  if (!l.outcome || l.outcome.length < 30) e.push(`${w}: outcome missing`);
  if (l.learningPoints.length < 4) e.push(`${w}: needs ≥4 learningPoints`);
  if (l.terms.length < 2) e.push(`${w}: needs ≥2 terms`);
  if (l.concept.length < 900) e.push(`${w}: concept too short (${l.concept.length})`);
  if (!l.example.artifacts.length) e.push(`${w}: example needs an artifact`);
  if (l.example.walkthrough.length < 200) e.push(`${w}: example walkthrough too short`);
  if (l.compare.decidingDetail.length < 80) e.push(`${w}: compare.decidingDetail too short`);
  for (const k of ['mistake', 'whyTempting', 'howToRecognize', 'fix'] as const) if ((l.mistake[k] ?? '').length < 40) e.push(`${w}: mistake.${k} too short`);
  if (l.exercise.items.length < 3) e.push(`${w}: exercise needs ≥3 items`);
  for (const it of l.exercise.items) if (!l.exercise.labels.includes(it.answer)) e.push(`${w}: exercise item ${it.id} answer not in labels`);
  if (l.check.length < 3) e.push(`${w}: needs 3 knowledge checks`);
  for (const c of l.check) {
    if (!c.options.some((o) => o.id === c.correct)) e.push(`${w}: check ${c.id} correct id missing`);
    if (c.options.length !== 4) e.push(`${w}: check ${c.id} needs 4 options`);
    if (!c.why || c.why.length < 40) e.push(`${w}: check ${c.id} why too short`);
  }
  if (l.review.length < 2) e.push(`${w}: needs ≥2 review cards`);
  if (!l.sources.length) e.push(`${w}: no sources`);
  for (const s of l.sources) if (!sourceById(s)) e.push(`${w}: unknown source ${s}`);
  return e;
}

export function validateCase(c: CaseStudy, lessonIds?: Set<string>): string[] {
  const e: string[] = [];
  const w = `case ${c.scenario}`;
  if (c.brief.length < 300) e.push(`${w}: brief too short`);
  if (c.constraints.length < 3) e.push(`${w}: needs ≥3 constraints`);
  if (c.decisions.length < 3) e.push(`${w}: needs ≥3 decisions`);
  for (const d of c.decisions) {
    if (!d.options.some((o) => o.id === d.best)) e.push(`${w}/${d.id}: best option missing`);
    if (d.options.length < 3) e.push(`${w}/${d.id}: needs ≥3 options`);
    for (const o of d.options) if (!o.consequence || o.consequence.length < 40) e.push(`${w}/${d.id}/${o.id}: consequence too short`);
    if (d.walkthrough.length < 200) e.push(`${w}/${d.id}: walkthrough too short`);
  }
  if (lessonIds) for (const l of c.lessons) if (!lessonIds.has(l)) e.push(`${w}: lesson ${l} missing`);
  return e;
}

export function validateBank(questions: Question[], lessonIds: Set<ObjectiveId | string>): string[] {
  const e: string[] = [];
  const seen = new Set<string>();
  const famMeta = new Map<string, string>();
  for (const q of questions) {
    if (seen.has(q.id)) e.push(`duplicate question id ${q.id}`);
    seen.add(q.id);
    const meta = `${q.scenario}|${q.objective}`;
    if (famMeta.has(q.familyId) && famMeta.get(q.familyId) !== meta) e.push(`family ${q.familyId} spans scenario/objective`);
    famMeta.set(q.familyId, meta);
    e.push(...validateQuestion(q, lessonIds as Set<string>));
  }
  return e;
}
