import { describe, test, expect } from 'bun:test';
import { selectOption, eliminateOption, restoreOption, toggleFlag, isAnswered, isCorrect, emptyResponse, reviewOptions, scoreAttempt } from '../src/engine/exam';
import type { Question } from '../src/content/types';

const multi = { type: 'multi', selectCount: 2, options: [
  { id: 'a', correct: true }, { id: 'b', correct: false }, { id: 'c', correct: true }, { id: 'd', correct: false }, { id: 'e', correct: false },
] } as unknown as Question;
const single = { type: 'single', selectCount: 1, options: [
  { id: 'a', correct: false }, { id: 'b', correct: true }, { id: 'c', correct: false }, { id: 'd', correct: false },
] } as unknown as Question;

describe('elimination', () => {
  test('eliminating an unselected choice never selects or answers', () => {
    const r = eliminateOption(emptyResponse(), 'b');
    expect(r.selected).toEqual([]);
    expect(r.eliminated).toEqual(['b']);
    expect(isAnswered(r, single)).toBe(false);
  });
  test('eliminating does not change another selection', () => {
    let r = selectOption(emptyResponse(), single, 'a').resp;
    r = eliminateOption(r, 'c');
    expect(r.selected).toEqual(['a']);
  });
  test('eliminating a selected choice clears it and updates answered status', () => {
    let r = selectOption(emptyResponse(), single, 'b').resp;
    expect(isAnswered(r, single)).toBe(true);
    r = eliminateOption(r, 'b');
    expect(r.selected).toEqual([]);
    expect(isAnswered(r, single)).toBe(false);
  });
  test('eliminated choice must be restored before it can be selected', () => {
    let r = eliminateOption(emptyResponse(), 'b');
    const res = selectOption(r, single, 'b');
    expect(res.blocked).toBe('eliminated');
    expect(res.resp.selected).toEqual([]);
    r = restoreOption(r, 'b');
    expect(r.selected).toEqual([]); // restore does not select
    expect(selectOption(r, single, 'b').resp.selected).toEqual(['b']);
  });
  test('acceptance: Select TWO with A+C, eliminate B, flag; eliminate C -> incomplete; restore C does not reselect', () => {
    let r = emptyResponse();
    r = selectOption(r, multi, 'a').resp;
    r = selectOption(r, multi, 'c').resp;
    r = eliminateOption(r, 'b');
    r = toggleFlag(r);
    // simulate persistence round-trip
    r = JSON.parse(JSON.stringify(r));
    expect(r).toEqual({ selected: ['a', 'c'], eliminated: ['b'], flagged: true });
    expect(isAnswered(r, multi)).toBe(true);
    r = eliminateOption(r, 'c');
    expect(r.selected).toEqual(['a']);
    expect(isAnswered(r, multi)).toBe(false);
    r = restoreOption(r, 'c');
    expect(r.selected).toEqual(['a']);
    expect(r.eliminated).toEqual(['b']);
    expect(r.flagged).toBe(true);
  });
  test('multi selection cannot exceed the required count', () => {
    let r = selectOption(emptyResponse(), multi, 'a').resp;
    r = selectOption(r, multi, 'b').resp;
    const res = selectOption(r, multi, 'c');
    expect(res.blocked).toBe('limit');
    expect(res.resp.selected).toEqual(['a', 'b']);
  });
  test('flag is independent of answer status', () => {
    const r = toggleFlag(emptyResponse());
    expect(r.flagged).toBe(true);
    expect(isAnswered(r, single)).toBe(false);
  });
});

describe('scoring', () => {
  test('exact match required for multi', () => {
    expect(isCorrect({ selected: ['a', 'c'], eliminated: [], flagged: false }, multi)).toBe(true);
    expect(isCorrect({ selected: ['c', 'a'], eliminated: [], flagged: false }, multi)).toBe(true);
    expect(isCorrect({ selected: ['a'], eliminated: [], flagged: false }, multi)).toBe(false);
    expect(isCorrect({ selected: ['a', 'b'], eliminated: [], flagged: false }, multi)).toBe(false);
  });
  test('eliminating distractors earns nothing', () => {
    expect(isCorrect({ selected: [], eliminated: ['a', 'c', 'd'], flagged: false }, single)).toBe(false);
  });
  test('review states for the acceptance case: one right, one wrong, one eliminated correct', () => {
    const r = { selected: ['a', 'b'], eliminated: ['c'], flagged: false };
    const st = Object.fromEntries(reviewOptions(r, multi).map((s) => [s.id, s.kind]));
    expect(st).toEqual({ a: 'correct-selected', b: 'wrong-selected', c: 'correct-eliminated', d: 'wrong-unselected', e: 'wrong-unselected' });
  });
  test('scoreAttempt counts raw, unanswered, incomplete', () => {
    const byId = new Map([['m', { ...multi, id: 'm', objective: '1.1', scenario: 'support' } as Question], ['s', { ...single, id: 's', objective: '2.1', scenario: 'ci' } as Question]]);
    const s = scoreAttempt(['m', 's'], { m: { selected: ['a'], eliminated: [], flagged: false } }, byId);
    expect(s.raw).toBe(0); expect(s.unanswered).toBe(1); expect(s.incomplete).toBe(1);
    expect(s.byDomain[1]).toEqual({ correct: 0, total: 1 });
  });
});
