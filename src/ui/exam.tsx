import { useEffect, useState, useRef } from '@rt/index';
import type { Question } from '../content/types';
import { EXAM_GUIDE, DOMAINS, OBJECTIVES, scenarioById, domainTitle } from '../content/blueprint';
import { lessonById } from '../content';
import { isAnswered, navStatus, remainingMs, toggleFlag, emptyResponse, type ExamAttempt, outcomeOf } from '../engine/exam';
import type { BuiltForm } from '../engine/builder';
import { store, go, fmtDuration, pct, lessonHref } from './ctx';
import { QuestionView, Feedback } from './question';
import { Md } from './md';

let preview: BuiltForm | null = null; // in-memory preview so the counts shown are exactly what starts

function startFresh(q: Question) {
  const fresh = store.freshQuestionFor(q.objective, q.familyId);
  if (!fresh) { alert('No other question on this skill is available.'); return; }
  store.startPractice(`Fresh question on ${q.objective}`, [fresh]);
  go('/practice/session');
}

export function ExamHome() {
  const [, setT] = useState(0);
  const active = store.activeAttempt();
  const attempts = store.data.attempts.filter((a) => a.status === 'submitted').slice().reverse();
  const gen = () => { preview = store.previewForm(); setT((x) => x + 1); };
  return (
    <div class="page">
      <h2>Full-length practice exam</h2>
      <p class="muted">{EXAM_GUIDE.format.questions} questions · {EXAM_GUIDE.format.minutes} minutes · {EXAM_GUIDE.format.scenariosPerForm} of {EXAM_GUIDE.format.scenarioFamilies} scenarios · single-answer and multiple-response items. Format per the official exam guide v1.1.</p>
      {active ? (
        <section class="card resume-card">
          <h3>Exam in progress</h3>
          <p>{active.kind === 'retake' ? 'Retake · ' : ''}Question {active.current + 1} of {active.questionIds.length} · {Object.values(active.responses).filter((r, i) => r.selected.length).length} with selections · <strong>{fmtDuration(remainingMs(active, store.now()))}</strong> remaining. Time keeps running while the app is closed.</p>
          <a class="btn resume" href="#/exam/run">▶ Resume exam</a>
        </section>
      ) : null}
      <section class="card">
        <h3>Generate new practice exam</h3>
        {active ? <p class="warn-text">You have an exam in progress. Resume it and submit it before generating a new one — a new exam never replaces an active attempt.</p> : (
          <>
            <p>Builds a new form from the question bank. It prefers question families you have never seen, then the least recently seen.</p>
            <button class="btn" type="button" onClick={gen}>Generate new practice exam</button>
            {preview ? (
              <div class="preview card inner" aria-live="polite">
                <h4>Form ready (seed <code>{preview.seed}</code>)</h4>
                <p><strong>{preview.freshCount}</strong> new question families · <strong>{preview.seenCount}</strong> previously seen</p>
                <p class="small">Domain counts: {DOMAINS.map((d) => `D${d.id} ${preview!.domainCounts[d.id]}`).join(' · ')} (target 16 · 11 · 12 · 12 · 9)</p>
                {preview.deviations.length ? <p class="warn-text small">Documented deviation: {preview.deviations.join('; ')}</p> : null}
                <p>
                  <button class="btn" type="button" onClick={() => { const a = store.startExam(preview!); preview = null; go('/exam/run'); return a; }}>Start this exam (120:00)</button>{' '}
                  <button class="btn secondary" type="button" onClick={gen}>Generate a different form</button>
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>
      <section class="card">
        <h3>Previous attempts</h3>
        {attempts.length ? (
          <table class="tbl">
            <thead><tr><th>Date</th><th>Type</th><th>Score</th><th>Unanswered</th><th></th></tr></thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.startedAt).toLocaleString()}</td>
                  <td>{a.kind === 'retake' ? 'Retake (exact retry)' : 'New form'}{a.submitReason === 'timeout' ? ' · time expired' : ''}</td>
                  <td>{a.score?.raw} / {a.score?.total}</td>
                  <td>{a.score?.unanswered}</td>
                  <td><a href={`#/results/${a.id}`}>Results</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p class="muted">No completed exams yet.</p>}
      </section>
    </div>
  );
}

export function ExamRunner() {
  const a = store.activeAttempt();
  const [, setTick] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const headRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const done = store.tick();
      if (done) { go(`/results/${done.id}?expired=1`); return; }
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { headRef.current?.focus({ preventScroll: false } as any); }, [a?.current, reviewing]);

  if (!a) {
    const last = store.data.attempts[store.data.attempts.length - 1];
    return <div class="page"><h2>No exam in progress</h2>{last?.status === 'submitted' ? <p><a href={`#/results/${last.id}`}>See your latest results</a></p> : null}<p><a class="btn" href="#/exam">Exam dashboard</a></p></div>;
  }
  const byId = store.byId;
  const nav = navStatus(a, byId);
  const remaining = remainingMs(a, store.now());
  const unanswered = nav.filter((n) => !n.answered).length;
  const flagged = nav.filter((n) => n.flagged).length;
  const qid = a.questionIds[a.current];
  const q = byId.get(qid)!;
  const resp = a.responses[qid] ?? emptyResponse();
  const scen = scenarioById(q.scenario);
  const scenIndex = a.scenarios.indexOf(q.scenario) + 1;
  const goTo = (i: number) => { store.setCurrent(a.id, i); setReviewing(false); setShowNav(false); };
  const submit = () => { const done = store.submit(a.id, 'user'); if (done) go(`/results/${done.id}`); };
  const low = remaining < 5 * 60 * 1000;

  const Navigator = () => (
    <div class="navigator" role="navigation" aria-label="Question navigator">
      <p class="legend small"><span class="nv current">1</span> current <span class="nv answered">1</span> answered <span class="nv">1</span> unanswered <span class="nv partial">1</span> incomplete <span class="nv"><span class="flag-dot">⚑</span>1</span> flagged</p>
      {a.scenarios.map((s, si) => (
        <div key={s} class="nav-group">
          <p class="small muted">Scenario {si + 1}: {scenarioById(s).title}</p>
          <div class="nav-grid">
            {nav.filter((n) => byId.get(n.id)!.scenario === s).map((n) => (
              <button key={n.id} type="button" class={`nv ${n.current && !reviewing ? 'current' : ''} ${n.answered ? 'answered' : ''} ${n.partial ? 'partial' : ''}`}
                aria-current={n.current && !reviewing ? 'true' : undefined}
                aria-label={`Question ${n.index + 1}, ${n.answered ? 'answered' : n.partial ? 'incomplete' : 'unanswered'}${n.flagged ? ', flagged' : ''}${n.current ? ', current' : ''}`}
                onClick={() => goTo(n.index)}>
                {n.flagged ? <span class="flag-dot" aria-hidden="true">⚑</span> : null}{n.index + 1}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div class="exam">
      <header class="exam-bar">
        <span class="exam-title">{a.kind === 'retake' ? 'Practice exam · Retake' : 'Practice exam'}</span>
        <span class={`timer ${low ? 'low' : ''}`} role="timer" aria-label={`Time remaining ${fmtDuration(remaining)}`}>⏱ {fmtDuration(remaining)}</span>
        <span class="small exam-counts">{60 - unanswered} answered · {unanswered} unanswered · {flagged} flagged</span>
        <button type="button" class="btn small secondary" aria-expanded={showNav ? 'true' : 'false'} onClick={() => setShowNav(!showNav)}>Navigator</button>
        <button type="button" class="btn small" onClick={() => { setReviewing(true); setShowNav(false); }}>Review &amp; submit</button>
      </header>
      {showNav ? <Navigator /> : null}

      {reviewing ? (
        <section class="page review-screen" aria-labelledby="rv-h">
          <h2 id="rv-h" tabIndex={-1} ref={headRef}>Review before submitting</h2>
          <p><strong>{fmtDuration(remaining)}</strong> remaining · <strong>{unanswered}</strong> unanswered · <strong>{flagged}</strong> flagged</p>
          <Navigator />
          <div class="rv-list">
            {nav.filter((n) => !n.answered || n.flagged).map((n) => (
              <p key={n.id} class="small"><button type="button" class="linklike" onClick={() => goTo(n.index)}>Question {n.index + 1}</button> — {n.answered ? 'answered' : n.partial ? 'incomplete' : 'unanswered'}{n.flagged ? ', flagged' : ''}</p>
            ))}
          </div>
          <p>
            <button type="button" class="btn secondary" onClick={() => setReviewing(false)}>Return to question {a.current + 1}</button>{' '}
            <button type="button" class="btn danger" onClick={() => setConfirm(true)}>Submit exam</button>
          </p>
          {confirm ? (
            <div class="confirm card" role="alertdialog" aria-labelledby="cf-h">
              <h3 id="cf-h">Submit now?</h3>
              <p>You have <strong>{unanswered}</strong> unanswered question{unanswered === 1 ? '' : 's'} and <strong>{fmtDuration(remaining)}</strong> remaining. You cannot change answers after submitting.</p>
              <button type="button" class="btn danger" onClick={submit}>Yes, submit exam</button>{' '}
              <button type="button" class="btn secondary" onClick={() => setConfirm(false)}>Keep working</button>
            </div>
          ) : null}
        </section>
      ) : (
        <main class="page qpage">
          <div class="qhead">
            <h2 tabIndex={-1} ref={headRef}>Question {a.current + 1} <span class="muted">of {a.questionIds.length}</span></h2>
            <span class="muted small">Scenario {scenIndex} of 4: {scen.title}</span>
            <button type="button" class="btn small secondary" aria-expanded={showBrief ? 'true' : 'false'} onClick={() => setShowBrief(!showBrief)}>{showBrief ? 'Hide' : 'View'} scenario brief</button>
          </div>
          {showBrief ? <div class="brief card"><h3>{scen.title}</h3><Md text={scen.brief} /></div> : null}
          <QuestionView q={q} order={a.optionOrder[qid]} resp={resp} label={`Question ${a.current + 1}`}
            onChange={(r) => store.setResponse(a.id, qid, () => r)} />
          <div class="qfoot">
            <button type="button" class="btn secondary" disabled={a.current === 0} onClick={() => goTo(a.current - 1)}>← Previous</button>
            <button type="button" class={`btn flag ${resp.flagged ? 'on' : ''}`} aria-pressed={resp.flagged ? 'true' : 'false'}
              onClick={() => store.setResponse(a.id, qid, toggleFlag)}>⚑ {resp.flagged ? 'Flagged for review' : 'Flag for review'}</button>
            <span class={`status small ${isAnswered(resp, q) ? 'ok-text' : ''}`}>{isAnswered(resp, q) ? 'Answered' : resp.selected.length ? 'Incomplete' : 'Unanswered'}</span>
            {a.current < a.questionIds.length - 1
              ? <button type="button" class="btn" onClick={() => goTo(a.current + 1)}>Next →</button>
              : <button type="button" class="btn" onClick={() => setReviewing(true)}>Review &amp; submit</button>}
          </div>
          <p class="muted small sim-note">Simulator features: answer elimination (strikethrough), flags, and navigator are study aids in this independent practice app.</p>
        </main>
      )}
    </div>
  );
}

// ---------------- results ----------------
type Filter = 'all' | 'missed' | 'unanswered' | 'flagged' | 'bookmarked';

export function Results({ id, query }: { id: string; query: URLSearchParams }) {
  const a = store.attempt(id);
  const [filter, setFilter] = useState<Filter>((query.get('f') as Filter) ?? 'all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (!a || a.status !== 'submitted' || !a.score) return <div class="page"><h2>Results not available</h2><p><a href="#/exam">Exam dashboard</a></p></div>;
  const s = a.score;
  const byId = store.byId;
  const elapsed = (a.submittedAt ?? a.deadline) - a.startedAt;
  const items = a.questionIds.map((qid, i) => ({ i, q: byId.get(qid)!, r: a.responses[qid] })).filter((x) => x.q);
  const shown = items.filter(({ q, r }) => {
    const o = outcomeOf(r, q);
    if (filter === 'missed') return o !== 'correct';
    if (filter === 'unanswered') return o === 'unanswered';
    if (filter === 'flagged') return !!r?.flagged;
    if (filter === 'bookmarked') return store.data.bookmarks.includes(q.id);
    return true;
  });
  const missedCount = items.filter(({ q, r }) => outcomeOf(r, q) !== 'correct').length;
  // objective attempt counts across all history
  const hist = store.data.answers;
  const origin = a.retakeOf ? store.attempt(a.retakeOf) : null;

  return (
    <div class="page results">
      <h2>Results {a.kind === 'retake' ? <span class="tag">Retake</span> : null}</h2>
      {query.get('expired') || a.submitReason === 'timeout' ? <p class="warn-text">Time expired — the exam was submitted automatically.</p> : null}
      <div class="stats">
        <div class="stat"><span class="big">{s.raw} / {s.total}</span><span>raw score ({pct(s.raw, s.total)}%)</span></div>
        <div class="stat"><span class="big">{fmtDuration(elapsed)}</span><span>elapsed of 120:00</span></div>
        <div class="stat"><span class="big">{s.unanswered}</span><span>unanswered</span></div>
        <div class="stat"><span class="big">{s.incomplete}</span><span>incomplete multi-select</span></div>
      </div>
      <div class="card small">
        <p><strong>Scoring rule (practice):</strong> each question is worth one point. Multiple-response items score only when your submitted selection exactly matches the correct set — no partial credit. Eliminated options are study aids and never score.</p>
        <p><strong>Official passing score (exam guide v{EXAM_GUIDE.version}):</strong> {EXAM_GUIDE.passingScore}. The official exam uses a scaled score set by a standard-setting study; this raw practice score is not converted to it and does not predict a pass.</p>
        {a.kind === 'retake' && origin?.score ? <p><strong>Retake comparison:</strong> original attempt {origin.score.raw}/{origin.score.total}; this retake {s.raw}/{s.total}. Retakes are tracked separately from first-attempt accuracy.</p> : null}
      </div>
      <p class="actions">
        {missedCount ? <a class="btn" href={`#/results/${a.id}/missed?i=0`}>Review missed questions ({missedCount})</a> : null}{' '}
        <a class="btn secondary" href="#/exam">Generate new practice exam</a>{' '}
        <button class="btn secondary" type="button" disabled={!!store.activeAttempt()} onClick={() => { const r = store.retake(a.id); go('/exam/run'); return r; }}>Retry this exact exam</button>
      </p>

      <section class="card">
        <h3>Accuracy by domain</h3>
        <table class="tbl">
          <thead><tr><th>Domain</th><th>Correct</th><th>Accuracy</th></tr></thead>
          <tbody>{DOMAINS.map((d) => { const x = s.byDomain[d.id]; return (
            <tr key={d.id}><td>D{d.id} {d.title}</td><td>{x.correct} / {x.total}</td><td><span class="bar" style={{ '--w': `${pct(x.correct, x.total)}%` }} aria-hidden="true" /> {pct(x.correct, x.total)}%</td></tr>); })}</tbody>
        </table>
      </section>

      <section class="card">
        <h3>Performance by objective</h3>
        <table class="tbl">
          <thead><tr><th>Objective</th><th>This exam</th><th>All attempts (history)</th><th></th></tr></thead>
          <tbody>{OBJECTIVES.filter((o) => s.byObjective[o.id]).map((o) => {
            const x = s.byObjective[o.id];
            const h = hist.filter((r) => r.objective === o.id);
            return (
              <tr key={o.id}><td><strong>{o.id}</strong> <span class="small">{lessonById(o.id)?.title}</span></td><td>{x.correct} / {x.total}</td>
                <td>{h.filter((r) => r.correct).length} / {h.length} answers</td><td><a href={lessonHref(o.id)} class="small">Lesson</a></td></tr>);
          })}</tbody>
        </table>
      </section>

      <section class="card">
        <h3>Question review</h3>
        <div class="filters" role="group" aria-label="Filter questions">
          {(['all', 'missed', 'unanswered', 'flagged', 'bookmarked'] as Filter[]).map((f) => (
            <button key={f} type="button" class={`chip ${filter === f ? 'on' : ''}`} aria-pressed={filter === f ? 'true' : 'false'} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        {shown.length === 0 ? <p class="muted">No questions match this filter.</p> : null}
        {shown.map(({ i, q, r }) => {
          const o = outcomeOf(r, q);
          const isOpen = open[q.id];
          return (
            <div key={q.id} class={`rq ${o}`}>
              <button type="button" class="rq-head" aria-expanded={isOpen ? 'true' : 'false'} onClick={() => setOpen({ ...open, [q.id]: !isOpen })}>
                <span>Q{i + 1}</span><span class={`tag ${o === 'correct' ? 'ok' : o === 'unanswered' ? '' : 'bad'}`}>{o}</span>
                {r?.flagged ? <span class="tag">⚑ flagged</span> : null}
                <span class="small muted">{q.objective} · {domainTitle(Number(q.objective[0]) as any)}</span>
              </button>
              {isOpen ? <ReviewItem a={a} q={q} /> : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ReviewItem({ a, q }: { a: ExamAttempt; q: Question }) {
  const r = a.responses[q.id] ?? emptyResponse();
  const bm = store.data.bookmarks.includes(q.id);
  return (
    <div class="review-item">
      <details class="brief"><summary>Scenario: {scenarioById(q.scenario).title}</summary><Md text={scenarioById(q.scenario).brief} /></details>
      <QuestionView q={q} order={a.optionOrder[q.id]} resp={r} onChange={() => {}} review />
      <Feedback q={q} order={a.optionOrder[q.id]} resp={r} onFresh={() => startFresh(q)} />
      <button type="button" class="btn small secondary" aria-pressed={bm ? 'true' : 'false'} onClick={() => store.toggleBookmark(q.id)}>{bm ? '★ Bookmarked' : '☆ Bookmark'}</button>
    </div>
  );
}

/** Step through missed (incorrect or unanswered) questions one at a time. */
export function MissedReview({ id, index }: { id: string; index: number }) {
  const a = store.attempt(id);
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => { ref.current?.focus(); window.scrollTo(0, 0); }, [index]);
  if (!a || !a.score) return <div class="page"><h2>Results not available</h2></div>;
  const missed = a.questionIds.map((qid, i) => ({ i, q: store.byId.get(qid)! })).filter(({ q }) => q && outcomeOf(a.responses[q.id], q) !== 'correct');
  if (!missed.length) return <div class="page"><h2>No missed questions</h2><a href={`#/results/${id}`}>Back to results</a></div>;
  const k = Math.max(0, Math.min(missed.length - 1, index));
  const { i, q } = missed[k];
  return (
    <div class="page">
      <p class="crumb"><a href={`#/results/${id}`}>Results</a> › Missed questions</p>
      <h2 tabIndex={-1} ref={ref}>Missed question {k + 1} of {missed.length} <span class="muted small">(exam question {i + 1})</span></h2>
      <ReviewItem a={a} q={q} />
      <div class="qfoot">
        <a class={`btn secondary ${k === 0 ? 'disabled' : ''}`} aria-disabled={k === 0 ? 'true' : undefined} href={k === 0 ? undefined : `#/results/${id}/missed?i=${k - 1}`}>← Previous missed</a>
        <span class="spacer" />
        {k < missed.length - 1 ? <a class="btn" href={`#/results/${id}/missed?i=${k + 1}`}>Next missed →</a> : <a class="btn" href={`#/results/${id}`}>Back to results</a>}
      </div>
    </div>
  );
}

export { startFresh };
