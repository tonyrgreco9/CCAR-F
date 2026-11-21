import { useState } from '@rt/index';
import { LESSONS, QUESTIONS, CASES, lessonById, CONTENT_VERSION } from '../content';
import { DOMAINS, OBJECTIVES, EXAM_GUIDE, INDEPENDENCE_NOTICE, SCENARIOS } from '../content/blueprint';
import { SOURCES } from '../content/sources';
import { DEV_MODULES, DEV_PATH, REFRESHERS, DIAGNOSTIC } from '../content/devpath';
import { analytics } from '../engine/store';
import { buildPlan, weakObjectives } from '../engine/planner';
import { remainingMs } from '../engine/exam';
import { store, lessonHref, practiceHref, fmtDuration, pct, go } from './ctx';
import { launchPractice } from './practice';

export function Dashboard() {
  const d = store.data;
  const an = analytics(d);
  const active = store.activeAttempt();
  const nextLesson = LESSONS.find((l) => !d.lessons[l.id]?.completedAt);
  const weak = weakObjectives(d).slice(0, 3);
  const mistakes = store.practicePool({ kind: 'mistakes' }).length;
  const exams = d.attempts.filter((a) => a.status === 'submitted');
  const lastExam = exams[exams.length - 1];
  const seenFam = Object.keys(d.exposures).length;
  const totalFam = new Set(QUESTIONS.map((q) => q.familyId)).size;
  return (
    <div class="page">
      <h2>Dashboard</h2>
      <div class="grid2 actions-grid">
        <section class="card">
          <h3>Continue learning</h3>
          {nextLesson ? <><p>Next: <strong>{nextLesson.id} {nextLesson.title}</strong></p><a class="btn" href={lessonHref(nextLesson.id)}>Continue learning</a></>
            : <p>All 30 lessons completed. <a href="#/learn">Browse lessons</a></p>}
          {!d.diagnostic ? <p class="small">New here? <a href="#/devpath">Take the 9-question prerequisite diagnostic</a> first.</p> : null}
        </section>
        <section class="card">
          <h3>10-question practice</h3>
          <p>Immediate feedback after each answer; new question families first.</p>
          <button class="btn" type="button" onClick={() => launchPractice({ kind: 'all' }, 'Mixed 10-question practice')}>10-question practice</button>
        </section>
        <section class="card">
          <h3>Full exam</h3>
          {active ? (
            <><p>In progress · {fmtDuration(remainingMs(active, store.now()))} left</p><a class="btn resume" href="#/exam/run">▶ Resume exam</a></>
          ) : (
            <><p>60 questions · 120 minutes · 4 scenarios</p><a class="btn" href="#/exam">Start full exam</a></>
          )}
        </section>
        <section class="card">
          <h3>Review mistakes</h3>
          <p>{mistakes} question{mistakes === 1 ? '' : 's'} last answered incorrectly.</p>
          <button class="btn secondary" type="button" disabled={!mistakes} onClick={() => launchPractice({ kind: 'mistakes' }, 'Past mistakes')}>Review mistakes</button>
        </section>
      </div>

      <section class="card">
        <h3>Progress</h3>
        <div class="stats">
          <div class="stat"><span class="big">{an.lessonsCompleted} / 30</span><span>lessons completed</span></div>
          <div class="stat"><span class="big">{an.firstAttempt.n ? `${pct(an.firstAttempt.correct, an.firstAttempt.n)}%` : '—'}</span><span>first-attempt accuracy ({an.firstAttempt.n} question families)</span></div>
          <div class="stat"><span class="big">{an.retake.n ? `${pct(an.retake.correct, an.retake.n)}%` : '—'}</span><span>retake accuracy ({an.retake.n} answers)</span></div>
          <div class="stat"><span class="big">{seenFam} / {totalFam}</span><span>question families seen</span></div>
        </div>
        {lastExam?.score ? <p>Latest exam: <a href={`#/results/${lastExam.id}`}>{lastExam.score.raw}/{lastExam.score.total}</a>{lastExam.kind === 'retake' ? ' (retake)' : ''}</p> : null}
      </section>

      <section class="card">
        <h3>Recommendations</h3>
        {weak.length ? (
          <ul>{weak.map((w) => <li key={w.id}><strong>{w.id} {lessonById(w.id)?.title}</strong> — {Math.round(w.acc * 100)}% across {w.n} answers. <a href={lessonHref(w.id, 'compare')}>Revisit the lesson</a> · <a href={practiceHref('objective', w.id)}>practice fresh questions</a></li>)}</ul>
        ) : <p class="muted">Answer a few practice questions to get recommendations based on your results.</p>}
        <p><a href="#/plan">Build a study plan for your exam date →</a></p>
      </section>

      <section class="card">
        <h3>Domain accuracy (all answers)</h3>
        <table class="tbl"><thead><tr><th>Domain</th><th>Weight</th><th>Lessons done</th><th>Accuracy</th></tr></thead><tbody>
          {DOMAINS.map((dm) => {
            const objs = OBJECTIVES.filter((o) => o.domain === dm.id);
            const ans = d.answers.filter((a) => a.objective.startsWith(dm.id + '.'));
            return <tr key={dm.id}><td>D{dm.id} {dm.title}</td><td>{dm.weight}%</td><td>{objs.filter((o) => d.lessons[o.id]?.completedAt).length}/{objs.length}</td>
              <td>{ans.length ? `${pct(ans.filter((a) => a.correct).length, ans.length)}% (${ans.length})` : '—'}</td></tr>;
          })}
        </tbody></table>
      </section>
    </div>
  );
}

export function PlanPage() {
  const d = store.data;
  const today = new Date(store.now());
  const def = new Date(today); def.setDate(def.getDate() + 21);
  const [date, setDate] = useState(d.plan?.examDate ?? def.toISOString().slice(0, 10));
  const [mins, setMins] = useState(String(d.plan?.dailyMinutes ?? 60));
  const weakDx = d.diagnostic ? DIAGNOSTIC.filter((x) => d.diagnostic!.answers[x.id] !== x.correct).map((x) => x.refresher) : [];
  const plan = d.plan ? buildPlan({ data: d, lessons: LESSONS, examDate: d.plan.examDate, dailyMinutes: d.plan.dailyMinutes, today, refresherIds: REFRESHERS.map((r) => ({ id: r.id, course: r.course })), diagnosticWeak: weakDx, caseScenarios: CASES.map((c) => ({ scenario: c.scenario, title: c.title })) }) : null;
  const href = (it: { kind: string; ref: string }) => it.kind === 'lesson' ? lessonHref(it.ref) : it.kind === 'revisit' ? lessonHref(it.ref, 'compare') : it.kind === 'practice' ? practiceHref('objective', it.ref)
    : it.kind === 'case' ? `#/case/${it.ref}` : it.kind === 'exam' ? '#/exam' : it.kind === 'mistakes' ? practiceHref('mistakes') : it.ref === 'diagnostic' ? '#/devpath' : `#/devpath`;
  return (
    <div class="page">
      <h2>Study plan</h2>
      <form class="card plan-form" onSubmit={(e: Event) => { e.preventDefault(); const m = Math.max(15, Math.min(480, Number(mins) || 60)); store.update((dd) => { dd.plan = { examDate: date, dailyMinutes: m }; }); }}>
        <label class="field"><span>Exam date</span><input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} required /></label>
        <label class="field"><span>Daily study time (minutes)</span><input type="number" min="15" max="480" step="5" value={mins} onChange={(e: any) => setMins(e.target.value)} required /></label>
        <button class="btn" type="submit">{d.plan ? 'Update plan' : 'Build plan'}</button>
      </form>
      {plan ? (
        <>
          <p>{plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'} until your exam · {d.plan!.dailyMinutes} min/day. Order: prerequisite gaps, observed weaknesses, then lessons by domain weight, case studies, and two timed exams.</p>
          {plan.warnings.map((w, i) => <p key={i} class="warn-text">{w}</p>)}
          {plan.days.map((day) => (
            <section class="card day" key={day.date}>
              <h3>{new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} <span class="muted small">· {day.minutes} min</span></h3>
              <ul>{day.items.map((it, i) => <li key={i}><a href={href(it)}>{it.label}</a> <span class="muted small">· {it.minutes} min · {it.why}</span></li>)}</ul>
            </section>
          ))}
        </>
      ) : <p class="muted">Enter your exam date and daily time to get a day-by-day plan based on your progress.</p>}
    </div>
  );
}

export function CoveragePage() {
  const [open, setOpen] = useState<string | null>(null);
  const fams = (id: string) => new Set(QUESTIONS.filter((q) => q.objective === id).map((q) => q.familyId)).size;
  const unverified = SOURCES.filter((s) => !s.verified);
  return (
    <div class="page">
      <h2>Source coverage</h2>
      <section class="card warn-card">
        <h3>What could not be verified</h3>
        <ul>
          <li><strong>CCAR-F exam guide</strong> — not present in <code>docs/</code> (checked {EXAM_GUIDE.checkedOn}). Missing: version, effective date, official passing score, every "Knowledge of" and "Skills in" bullet under the 30 task statements, the guide's preparation exercises, and its sample questions and explanations. Task statements, domain weights, scenario families, and exam format come from the build request.</li>
          <li><strong>{DEV_PATH.title}</strong> — {DEV_PATH.access}. Missing: every lesson and learning objective in all {DEV_MODULES.length} modules ({DEV_MODULES.map((m) => m.title).join('; ')}).</li>
          <li><strong>Prerequisite courses</strong> — course pages not reachable: {REFRESHERS.map((r) => r.course).join('; ')}. Refreshers here are original and do not claim to reflect course content.</li>
          <li><strong>Anthropic documentation</strong> — {unverified.filter((s) => s.kind !== 'exam-guide' && s.kind !== 'academy').length} cited pages could not be opened from the build environment; product details are marked "not verified" and version-sensitive points carry dated notes in lessons.</li>
        </ul>
        <p class="small">Coverage below is therefore measured against task statements and app-authored sub-objectives, not against the guide's bullets. It is not a claim of complete coverage.</p>
      </section>

      <section class="card">
        <h3>Task statements → lesson, example/exercise, assessment</h3>
        <table class="tbl cov">
          <thead><tr><th>Task</th><th>Guide bullets</th><th>Lesson</th><th>Example · Exercise</th><th>Check items</th><th>Bank items / families</th><th>Case studies</th></tr></thead>
          <tbody>
            {OBJECTIVES.map((o) => {
              const l = lessonById(o.id);
              const qn = QUESTIONS.filter((q) => q.objective === o.id).length;
              const cs = CASES.filter((c) => c.lessons.includes(o.id));
              return (
                <>
                  <tr key={o.id}>
                    <td><button type="button" class="linklike" aria-expanded={open === o.id ? 'true' : 'false'} onClick={() => setOpen(open === o.id ? null : o.id)}>{o.id}</button></td>
                    <td><span class="tag warn">Unavailable</span></td>
                    <td>{l ? <a href={lessonHref(o.id)}>{l.title}</a> : <span class="bad-text">missing</span>}</td>
                    <td>{l ? `${l.example.artifacts.length} artifact(s) · ${l.exercise.items.length} items` : '—'}</td>
                    <td>{l?.check.length ?? 0}</td>
                    <td>{qn} / {fams(o.id)}</td>
                    <td>{cs.map((c) => c.scenario).join(', ') || '—'}</td>
                  </tr>
                  {open === o.id && l ? (
                    <tr key={o.id + '-d'} class="cov-detail"><td colSpan={7}>
                      <p><strong>Statement:</strong> {o.statement}</p>
                      <p><strong>App-authored sub-objectives (verified against lesson content):</strong></p>
                      <ul>{l.learningPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                      <p class="small">Example: <a href={lessonHref(o.id, 'example')}>worked example</a> · Compare: <a href={lessonHref(o.id, 'compare')}>{l.compare.question}</a> · Exercise: <a href={lessonHref(o.id, 'exercise')}>{l.exercise.labels.join(' / ')}</a> · Assessment: <a href={lessonHref(o.id, 'check')}>{l.check.length} checks</a>, <a href={practiceHref('objective', o.id)}>{qn} bank items</a></p>
                    </td></tr>
                  ) : null}
                </>
              );
            })}
          </tbody>
        </table>
      </section>

      <section class="card">
        <h3>Scenario families → bank and case studies</h3>
        <table class="tbl"><thead><tr><th>Scenario</th><th>Questions</th><th>Families</th><th>Multiple-response</th><th>Case study</th></tr></thead><tbody>
          {SCENARIOS.map((s) => { const qs = QUESTIONS.filter((q) => q.scenario === s.id); return (
            <tr key={s.id}><td>{s.title}</td><td>{qs.length}</td><td>{new Set(qs.map((q) => q.familyId)).size}</td><td>{qs.filter((q) => q.type === 'multi').length}</td>
              <td>{CASES.find((c) => c.scenario === s.id) ? <a href={`#/case/${s.id}`}>Yes</a> : 'No'}</td></tr>); })}
        </tbody></table>
      </section>

      <section class="card">
        <h3>Developer Foundations learning objectives</h3>
        <p>Verified objectives mapped: <strong>0</strong>. All objectives are unavailable (see above). Title-based links are shown on the <a href="#/devpath">companion page</a> and labelled as inferred.</p>
      </section>

      <section class="card">
        <h3>Source registry</h3>
        <table class="tbl small"><thead><tr><th>Source</th><th>Kind</th><th>Status</th></tr></thead><tbody>
          {SOURCES.map((s) => <tr key={s.id}><td>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}</td><td>{s.kind}</td><td>{s.verified ? 'verified' : 'not verified'}{s.note ? ` — ${s.note}` : ''}</td></tr>)}
        </tbody></table>
      </section>
    </div>
  );
}

export function AboutPage() {
  const fams = new Set(QUESTIONS.map((q) => q.familyId)).size;
  return (
    <div class="page">
      <h2>About this app</h2>
      <p class="callout"><strong>{INDEPENDENCE_NOTICE}</strong></p>
      <section class="card">
        <h3>Exam guide</h3>
        <dl class="terms">
          <div><dt>Guide</dt><dd>{EXAM_GUIDE.title}</dd></div>
          <div><dt>Version</dt><dd>{EXAM_GUIDE.version ?? 'Not available — guide not supplied'}</dd></div>
          <div><dt>Effective date</dt><dd>{EXAM_GUIDE.effectiveDate ?? 'Not available — guide not supplied'}</dd></div>
          <div><dt>Official passing score</dt><dd>{EXAM_GUIDE.passingScore ?? 'Not available — guide not supplied'} (guide information only; never derived from practice scores)</dd></div>
          <div><dt>Format used</dt><dd>{EXAM_GUIDE.format.questions} questions, {EXAM_GUIDE.format.minutes} minutes, {EXAM_GUIDE.format.scenariosPerForm} of {EXAM_GUIDE.format.scenarioFamilies} scenarios, domain targets {Object.values(EXAM_GUIDE.format.domainTargets).join('/')}, {EXAM_GUIDE.format.itemTypes.toLowerCase()} items.</dd></div>
        </dl>
      </section>
      <section class="card">
        <h3>Simulator features (not claims about the real exam)</h3>
        <ul>
          <li>Answer elimination with strikethrough, the question navigator, flags, and the review screen are practice aids in this app.</li>
          <li>Multiple-response items use exact-match scoring in practice; no partial credit.</li>
          <li>Raw practice scores are not converted to the official scaled score.</li>
        </ul>
      </section>
      <section class="card">
        <h3>Content</h3>
        <p>Content version {CONTENT_VERSION}: {LESSONS.length} lessons, {CASES.length} case studies, {QUESTIONS.length} original questions in {fams} question families, {DIAGNOSTIC.length} diagnostic items, {REFRESHERS.length} refreshers. <a href="#/coverage">Source coverage →</a></p>
      </section>
      <section class="card">
        <h3>Your data</h3>
        <p>Progress is stored only in this browser (localStorage). No account, backend, or API calls.</p>
        <p><button type="button" class="btn secondary small" onClick={() => {
          const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ccarf-prep-progress.json'; a.click();
        }}>Export my progress</button></p>
      </section>
    </div>
  );
}

export const _go = go;
