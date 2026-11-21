import { useState, useEffect, useRef } from '@rt/index';
import type { ScenarioId } from '../content/types';
import { DOMAINS, OBJECTIVES, SCENARIOS, scenarioById } from '../content/blueprint';
import { lessonById } from '../content';
import { emptyResponse, isAnswered, isCorrect } from '../engine/exam';
import type { PracticeFilter } from '../engine/store';
import { store, go } from './ctx';
import { QuestionView, Feedback } from './question';
import { Md } from './md';
import { startFresh } from './exam';

export function filterFromQuery(q: URLSearchParams): { f: PracticeFilter; label: string } | null {
  if (q.has('objective')) { const v = q.get('objective')!; return { f: { kind: 'objective', value: v }, label: `Objective ${v}: ${lessonById(v)?.title ?? ''}` }; }
  if (q.has('domain')) { const v = q.get('domain')!; return { f: { kind: 'domain', value: v }, label: `Domain ${v}` }; }
  if (q.has('scenario')) { const v = q.get('scenario') as ScenarioId; return { f: { kind: 'scenario', value: v }, label: scenarioById(v)?.title ?? v }; }
  if (q.has('bookmarks')) return { f: { kind: 'bookmarks' }, label: 'Bookmarks' };
  if (q.has('mistakes')) return { f: { kind: 'mistakes' }, label: 'Past mistakes' };
  if (q.has('mixed')) return { f: { kind: 'all' }, label: 'Mixed 10-question practice' };
  return null;
}

export function launchPractice(f: PracticeFilter, label: string, n = 10) {
  const pool = store.practicePool(f);
  const qs = store.pickQuestions(pool, n, `${Date.now()}`);
  if (!qs.length) { alert('No questions match this filter yet.'); return false; }
  store.startPractice(label, qs);
  go('/practice/session');
  return true;
}

export function PracticeHome({ query }: { query: URLSearchParams }) {
  const pending = filterFromQuery(query);
  const d = store.data;
  const mistakes = store.practicePool({ kind: 'mistakes' }).length;
  const [obj, setObj] = useState('1.1');
  return (
    <div class="page">
      <h2>Practice</h2>
      <p class="muted">Untimed. You get the full explanation right after you submit each answer. Answer elimination works here exactly as in the timed exam, so you can learn the controls first.</p>
      {pending ? (
        <div class="card"><p>Start 10 questions on <strong>{pending.label}</strong>? ({store.practicePool(pending.f).length} available)</p>
          <button class="btn" type="button" onClick={() => launchPractice(pending.f, pending.label)}>Start practice</button></div>
      ) : null}
      {d.practice && d.practice.questionIds.some((id) => !d.practice!.submitted[id]) ? (
        <div class="card resume-card"><p>Unfinished practice set: <strong>{d.practice.label}</strong></p><a class="btn resume" href="#/practice/session">▶ Continue practice</a></div>
      ) : null}
      <div class="grid2">
        <section class="card"><h3>Mixed</h3><p>10 questions across the blueprint, new families first.</p>
          <button class="btn" type="button" onClick={() => launchPractice({ kind: 'all' }, 'Mixed 10-question practice')}>10-question practice</button></section>
        <section class="card"><h3>Past mistakes</h3><p>{mistakes} question{mistakes === 1 ? '' : 's'} you last answered incorrectly.</p>
          <button class="btn" type="button" disabled={!mistakes} onClick={() => launchPractice({ kind: 'mistakes' }, 'Past mistakes')}>Review mistakes</button></section>
        <section class="card"><h3>Bookmarks</h3><p>{d.bookmarks.length} bookmarked.</p>
          <button class="btn" type="button" disabled={!d.bookmarks.length} onClick={() => launchPractice({ kind: 'bookmarks' }, 'Bookmarks')}>Practice bookmarks</button></section>
        <section class="card"><h3>By objective</h3>
          <label class="field"><span>Objective</span>
            <select value={obj} onChange={(e: any) => setObj(e.target.value)}>
              {OBJECTIVES.map((o) => <option key={o.id} value={o.id}>{o.id} {lessonById(o.id)?.title ?? o.statement}</option>)}
            </select></label>
          <button class="btn" type="button" onClick={() => launchPractice({ kind: 'objective', value: obj }, `Objective ${obj}`)}>Practice objective</button></section>
      </div>
      <section class="card"><h3>By domain</h3>
        <p>{DOMAINS.map((dm) => <button key={dm.id} type="button" class="btn secondary small" onClick={() => launchPractice({ kind: 'domain', value: String(dm.id) }, `Domain ${dm.id}: ${dm.title}`)}>D{dm.id} {dm.title}</button>)}</p></section>
      <section class="card"><h3>By scenario</h3>
        <p>{SCENARIOS.map((s) => <button key={s.id} type="button" class="btn secondary small" onClick={() => launchPractice({ kind: 'scenario', value: s.id }, s.title)}>{s.title}</button>)}</p></section>
    </div>
  );
}

export function PracticeSessionPage() {
  const s = store.data.practice;
  const ref = useRef<HTMLElement | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  useEffect(() => { ref.current?.focus(); }, [s?.current, s?.id]);
  if (!s) return <div class="page"><h2>No practice set</h2><a class="btn" href="#/practice">Choose practice</a></div>;
  const qid = s.questionIds[s.current];
  const q = store.byId.get(qid);
  if (!q) return <div class="page"><h2>Question unavailable</h2></div>;
  const resp = s.responses[qid] ?? emptyResponse();
  const submitted = !!s.submitted[qid];
  const done = s.questionIds.filter((id) => s.submitted[id]);
  const correct = done.filter((id) => isCorrect(s.responses[id], store.byId.get(id)!)).length;
  const setCur = (i: number) => store.update((d) => { if (d.practice) d.practice.current = i; });
  const bm = store.data.bookmarks.includes(qid);
  const scen = scenarioById(q.scenario);
  const allDone = done.length === s.questionIds.length;
  return (
    <div class="page">
      <p class="crumb"><a href="#/practice">Practice</a> › {s.label}</p>
      <div class="qhead">
        <h2 tabIndex={-1} ref={ref}>Question {s.current + 1} <span class="muted">of {s.questionIds.length}</span></h2>
        <span class="small muted">{correct} / {done.length} correct so far · {scen.title}</span>
        <button type="button" class="btn small secondary" aria-expanded={showBrief ? 'true' : 'false'} onClick={() => setShowBrief(!showBrief)}>{showBrief ? 'Hide' : 'View'} scenario brief</button>
      </div>
      {showBrief ? <div class="brief card"><Md text={scen.brief} /></div> : null}
      <QuestionView q={q} order={s.optionOrder[qid]} resp={resp} review={submitted}
        onChange={(r) => store.practiceRespond(qid, () => r)} />
      {!submitted ? (
        <p><button type="button" class="btn" disabled={!isAnswered(resp, q)} onClick={() => store.practiceSubmit(qid)}>Submit answer</button>
          {!isAnswered(resp, q) ? <span class="muted small"> Select {q.selectCount} to submit.</span> : null}</p>
      ) : (
        <>
          <p class={`result-line ${isCorrect(resp, q) ? 'ok-text' : 'bad-text'}`} role="status"><strong>{isCorrect(resp, q) ? 'Correct.' : 'Incorrect.'}</strong></p>
          <Feedback q={q} order={s.optionOrder[qid]} resp={resp} onFresh={() => startFresh(q)} />
        </>
      )}
      <div class="qfoot">
        <button type="button" class="btn secondary" disabled={s.current === 0} onClick={() => setCur(s.current - 1)}>← Previous</button>
        <button type="button" class="btn secondary small" aria-pressed={bm ? 'true' : 'false'} onClick={() => store.toggleBookmark(qid)}>{bm ? '★ Bookmarked' : '☆ Bookmark'}</button>
        <span class="spacer" />
        {s.current < s.questionIds.length - 1
          ? <button type="button" class="btn" onClick={() => setCur(s.current + 1)}>Next →</button>
          : allDone ? <a class="btn" href="#/practice">Finish ({correct}/{done.length})</a> : null}
      </div>
    </div>
  );
}
