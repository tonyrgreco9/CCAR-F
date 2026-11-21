import { useEffect, useState } from '@rt/index';
import type { Lesson, ObjectiveId, ScenarioId } from '../content/types';
import { LESSONS, CASES, lessonById, caseByScenario, QUESTIONS } from '../content';
import { DOMAINS, OBJECTIVES, scenarioById, objectiveDomain } from '../content/blueprint';
import { sourceById } from '../content/sources';
import { DEV_MODULES, DEV_PATH, REFRESHERS, DIAGNOSTIC } from '../content/devpath';
import { Md, Inline } from './md';
import { store, lessonHref, practiceHref, go } from './ctx';
import { sectionName } from './question';

const SECTION_ORDER = ['concept', 'example', 'compare', 'mistake', 'exercise', 'check', 'review'] as const;

export function SourceList({ ids }: { ids: string[] }) {
  return (
    <ul class="sources">
      {ids.map((id) => {
        const s = sourceById(id);
        if (!s) return null;
        return (
          <li key={id}>
            {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : <span>{s.title}</span>}
            {!s.verified ? <span class="tag warn" title={s.note}>not verified</span> : null}
            {s.note ? <span class="muted small"> — {s.note}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function LearnHome() {
  const d = store.data;
  return (
    <div class="page">
      <h2>Architect learning path</h2>
      <p class="muted">30 lessons, one per task statement, in blueprint order. Each lesson teaches the concept, a worked example, a design comparison, a common mistake, an exercise, a closed-book check, and review cards.</p>
      {DOMAINS.map((dm) => (
        <section class="card" key={dm.id}>
          <h3>Domain {dm.id} — {dm.title} <span class="muted small">({dm.weight}% of exam)</span></h3>
          <ol class="lesson-list">
            {OBJECTIVES.filter((o) => o.domain === dm.id).map((o) => {
              const l = lessonById(o.id);
              const p = d.lessons[o.id];
              return (
                <li key={o.id} class={p?.completedAt ? 'done' : ''}>
                  <a href={lessonHref(o.id)}><strong>{o.id}</strong> {l?.title ?? o.statement}</a>
                  {p?.completedAt ? <span class="tag ok">Completed</span> : null}
                  <span class="muted small"> · {l?.minutes ?? '?'} min</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <section class="card">
        <h3>Guided case studies</h3>
        <p class="muted">One per exam scenario family. Decide first, then reveal the walkthrough.</p>
        <ul class="lesson-list">
          {CASES.map((c) => <li key={c.scenario}><a href={`#/case/${c.scenario}`}>{c.title}</a> <span class="muted small">· {scenarioById(c.scenario).title}</span>
            {d.cases[c.scenario] && Object.keys(d.cases[c.scenario]).length >= c.decisions.length ? <span class="tag ok">Done</span> : null}</li>)}
        </ul>
      </section>
      <section class="card">
        <h3>Companion: {DEV_PATH.title}</h3>
        <p><a href="#/devpath">Open the Developer Foundations companion, prerequisite diagnostic, and refreshers →</a></p>
      </section>
    </div>
  );
}

export function LessonPage({ id, section }: { id: string; section?: string | null }) {
  const l = lessonById(id);
  useEffect(() => {
    if (!section) { window.scrollTo(0, 0); return; }
    const el = document.getElementById(`sec-${section}`);
    if (el) { el.scrollIntoView({ block: 'start' }); (el as HTMLElement).focus({ preventScroll: true }); }
  }, [id, section]);
  if (!l) return <div class="page"><h2>Lesson {id} not found</h2></div>;
  const obj = OBJECTIVES.find((o) => o.id === l.id)!;
  const prog = store.data.lessons[l.id];
  const idx = LESSONS.findIndex((x) => x.id === l.id);
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const nQ = QUESTIONS.filter((q) => q.objective === l.id).length;
  const devModules = DEV_MODULES.filter((m) => m.inferredArchitectLessons.includes(l.id));
  const cases = CASES.filter((c) => c.lessons.includes(l.id));

  return (
    <article class="page lesson">
      <p class="crumb"><a href="#/learn">Learn</a> › Domain {obj.domain} › Task statement {l.id}</p>
      <h2>{l.id} {l.title}</h2>
      <p class="statement"><strong>Task statement:</strong> {obj.statement}</p>
      <div class="outcome card"><strong>Learning outcome:</strong> {l.outcome} <span class="muted small">· about {l.minutes} min</span></div>
      <nav class="toc" aria-label="Lesson sections">
        {SECTION_ORDER.map((s) => <a key={s} href={lessonHref(l.id, s)} class={section === s ? 'active' : ''}>{sectionName(s)}</a>)}
      </nav>

      <section class="card">
        <h3>What this lesson covers</h3>
        <ul>{l.learningPoints.map((p, i) => <li key={i}><Inline text={p} /></li>)}</ul>
        <p class="muted small">These sub-objectives are app-authored. The exam guide's "Knowledge of" / "Skills in" bullets were not supplied, so coverage against them is unverified.</p>
      </section>

      <section id="sec-concept" tabIndex={-1} class="lsec">
        <h3>1. Concept</h3>
        <Md text={l.concept} />
        <h4>Terminology</h4>
        <dl class="terms">{l.terms.map((t) => <div key={t.term}><dt>{t.term}</dt><dd><Inline text={t.definition} /></dd></div>)}</dl>
      </section>

      <section id="sec-example" tabIndex={-1} class="lsec">
        <h3>2. Worked example</h3>
        <Md text={l.example.intro} />
        {l.example.artifacts.map((a, i) => (
          <figure key={i} class="artifact">
            {a.caption ? <figcaption>{a.caption}</figcaption> : null}
            <pre class="code" data-lang={a.lang}><code>{a.code}</code></pre>
          </figure>
        ))}
        <Md text={l.example.walkthrough} />
      </section>

      <section id="sec-compare" tabIndex={-1} class="lsec">
        <h3>3. Compare two designs</h3>
        <p><strong><Inline text={l.compare.question} /></strong></p>
        <div class="compare">
          {[l.compare.a, l.compare.b].map((c, i) => (
            <div class="card" key={i}>
              <h4>{c.title}</h4>
              <Md text={c.body} />
              <p class="choose-when"><strong>Choose when:</strong> <Inline text={c.chooseWhen} /></p>
            </div>
          ))}
        </div>
        <div class="callout"><strong>The deciding detail</strong><Md text={l.compare.decidingDetail} /></div>
      </section>

      <section id="sec-mistake" tabIndex={-1} class="lsec">
        <h3>4. Common mistake</h3>
        <div class="mistake">
          <div><h4>The mistake</h4><Md text={l.mistake.mistake} /></div>
          <div><h4>Why it seems reasonable</h4><Md text={l.mistake.whyTempting} /></div>
          <div><h4>How to recognize it</h4><Md text={l.mistake.howToRecognize} /></div>
          <div><h4>The fix</h4><Md text={l.mistake.fix} /></div>
        </div>
      </section>

      <section id="sec-exercise" tabIndex={-1} class="lsec">
        <h3>5. Exercise</h3>
        <Exercise l={l} />
      </section>

      <section id="sec-check" tabIndex={-1} class="lsec">
        <h3>6. Knowledge check (closed book)</h3>
        <KnowledgeCheck l={l} />
      </section>

      <section id="sec-review" tabIndex={-1} class="lsec">
        <h3>7. Review cards</h3>
        <div class="cards">{l.review.map((c, i) => <Flashcard key={i} front={c.front} back={c.back} />)}</div>
        <h4>Targeted practice</h4>
        <p>
          <a class="btn" href={practiceHref('objective', l.id)}>Practice {l.id} ({nQ} questions)</a>{' '}
          <a class="btn secondary" href={practiceHref('domain', String(objectiveDomain(l.id)))}>Practice Domain {objectiveDomain(l.id)}</a>
        </p>
        {cases.length ? <p>Case studies using this skill: {cases.map((c, i) => <span key={c.scenario}>{i ? ', ' : ''}<a href={`#/case/${c.scenario}`}>{c.title}</a></span>)}</p> : null}
      </section>

      {l.notes?.length ? (
        <section class="card note">
          <h3>Implementation notes</h3>
          {l.notes.map((n, i) => <div key={i}><p class="muted small">Noted {n.date}</p><Md text={n.text} /></div>)}
        </section>
      ) : null}

      <section class="card">
        <h3>Sources</h3>
        <SourceList ids={l.sources} />
        {devModules.length ? <p class="small">Developer Foundations modules whose <em>titles</em> suggest overlap (inferred, not verified): {devModules.map((m) => `${m.order}. ${m.title}`).join('; ')}. <a href="#/devpath">See companion</a>.</p> : null}
      </section>

      <div class="lesson-foot">
        {prog?.completedAt
          ? <p class="tag ok">Lesson completed {new Date(prog.completedAt).toLocaleDateString()}</p>
          : <button class="btn" type="button" onClick={() => store.update((d) => { d.lessons[l.id] = { ...(d.lessons[l.id] ?? { checks: {} }), completedAt: store.now() }; })}>Mark lesson complete</button>}
        <span class="spacer" />
        {prev ? <a class="btn secondary" href={lessonHref(prev.id)}>← {prev.id}</a> : null}
        {next ? <a class="btn secondary" href={lessonHref(next.id)}>{next.id} →</a> : null}
      </div>
    </article>
  );
}

function Exercise({ l }: { l: Lesson }) {
  const saved = store.data.lessons[l.id]?.exercise ?? {};
  const [ans, setAns] = useState<Record<string, string>>(saved);
  const [checked, setChecked] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const score = l.exercise.items.filter((it) => ans[it.id] === it.answer).length;
  return (
    <div class="exercise">
      <Md text={l.exercise.prompt} />
      <div class="ex-inputs"><Md text={l.exercise.inputs} /></div>
      <ol class="ex-items">
        {l.exercise.items.map((it) => (
          <li key={it.id} class={checked ? (ans[it.id] === it.answer ? 'right' : 'wrong') : ''}>
            <p><Inline text={it.text} /></p>
            <div class="ex-labels" role="radiogroup" aria-label={`Label for item ${it.id}`}>
              {l.exercise.labels.map((lab) => (
                <label key={lab} class="chip">
                  <input type="radio" name={`ex-${l.id}-${it.id}`} checked={ans[it.id] === lab} onClick={() => { setAns({ ...ans, [it.id]: lab }); setChecked(false); }} />
                  <span>{lab}</span>
                </label>
              ))}
            </div>
            {checked ? <p class="small">{ans[it.id] === it.answer ? '✓ Correct.' : `✗ Expected: ${it.answer}.`} <Inline text={it.why} /></p> : null}
          </li>
        ))}
      </ol>
      <p>
        <button class="btn" type="button" disabled={Object.keys(ans).length < l.exercise.items.length}
          onClick={() => { setChecked(true); store.update((d) => { d.lessons[l.id] = { ...(d.lessons[l.id] ?? { checks: {} }), exercise: ans }; }); }}>Check my answers</button>{' '}
        <button class="btn secondary" type="button" onClick={() => setShowSol(!showSol)} aria-expanded={showSol ? 'true' : 'false'}>{showSol ? 'Hide' : 'Show'} explained solution</button>
        {checked ? <span class="pill"> {score} / {l.exercise.items.length} correct</span> : null}
      </p>
      {showSol ? <div class="callout"><Md text={l.exercise.solution} /></div> : null}
    </div>
  );
}

function KnowledgeCheck({ l }: { l: Lesson }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const prog = store.data.lessons[l.id];
  return (
    <div class="kc">
      {l.check.map((c, n) => {
        const p = picked[c.id];
        return (
          <div class="card" key={c.id}>
            <p><strong>{n + 1}.</strong> <Inline text={c.stem} /></p>
            <div role="radiogroup" aria-label={`Knowledge check ${n + 1}`}>
              {c.options.map((o, i) => (
                <label key={o.id} class={`kc-opt ${p ? (o.id === c.correct ? 'right' : p === o.id ? 'wrong' : '') : ''}`}>
                  <input type="radio" name={`kc-${l.id}-${c.id}`} checked={p === o.id} disabled={!!p}
                    onClick={() => {
                      if (p) return;
                      setPicked({ ...picked, [c.id]: o.id });
                      store.update((d) => {
                        const lp = (d.lessons[l.id] ??= { checks: {} });
                        if (!(c.id in lp.checks)) lp.checks[c.id] = o.id === c.correct;
                      });
                    }} />
                  <span>{'ABCD'[i]}. <Inline text={o.text} /></span>
                </label>
              ))}
            </div>
            {p ? <p class={`small ${p === c.correct ? 'ok-text' : 'bad-text'}`}>{p === c.correct ? 'Correct. ' : 'Not quite. '}<Inline text={c.why} /></p> : null}
          </div>
        );
      })}
      {prog && Object.keys(prog.checks).length ? <p class="muted small">First-try knowledge-check score for this lesson: {Object.values(prog.checks).filter(Boolean).length} / {Object.keys(prog.checks).length}</p> : null}
    </div>
  );
}

function Flashcard({ front, back }: { front: string; back: string }) {
  const [flip, setFlip] = useState(false);
  return (
    <button type="button" class={`flash ${flip ? 'flipped' : ''}`} aria-pressed={flip ? 'true' : 'false'} onClick={() => setFlip(!flip)}>
      <span class="flash-face">{flip ? <Inline text={back} /> : <Inline text={front} />}</span>
      <span class="muted small">{flip ? 'Answer — click to see prompt' : 'Prompt — click to reveal'}</span>
    </button>
  );
}

// ---------------- case studies ----------------
export function CasePage({ scenario }: { scenario: ScenarioId }) {
  const c = caseByScenario(scenario);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  if (!c) return <div class="page"><h2>Case study not found</h2></div>;
  const chosen = store.data.cases[scenario] ?? {};
  return (
    <article class="page">
      <p class="crumb"><a href="#/learn">Learn</a> › Case studies</p>
      <h2>{c.title}</h2>
      <p class="muted">Scenario family: {scenarioById(scenario).title}</p>
      <section class="card"><h3>Scenario brief</h3><Md text={c.brief} /></section>
      <section class="card"><h3>Constraints</h3><ul>{c.constraints.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ul></section>
      {c.decisions.map((dcs, n) => {
        const pick = chosen[dcs.id];
        const show = revealed[dcs.id];
        return (
          <section class="card decision" key={dcs.id}>
            <h3>Decision {n + 1}</h3>
            <Md text={dcs.prompt} />
            <div role="radiogroup" aria-label={`Decision ${n + 1}`}>
              {dcs.options.map((o, i) => (
                <label key={o.id} class={`kc-opt ${show ? (o.id === dcs.best ? 'right' : pick === o.id ? 'wrong' : '') : ''}`}>
                  <input type="radio" name={`case-${scenario}-${dcs.id}`} checked={pick === o.id}
                    onClick={() => store.update((d) => { (d.cases[scenario] ??= {})[dcs.id] = o.id; })} />
                  <span>{'ABCD'[i]}. <Inline text={o.text} /></span>
                  {show ? <span class="small block"><strong>Consequence:</strong> <Inline text={o.consequence} /></span> : null}
                </label>
              ))}
            </div>
            <button class="btn secondary" type="button" disabled={!pick} onClick={() => setRevealed({ ...revealed, [dcs.id]: !show })} aria-expanded={show ? 'true' : 'false'}>
              {pick ? (show ? 'Hide walkthrough' : 'Reveal consequences and walkthrough') : 'Choose an option to unlock the walkthrough'}
            </button>
            {show ? <div class="callout"><Md text={dcs.walkthrough} /></div> : null}
          </section>
        );
      })}
      <section class="card"><h3>Wrap-up</h3><Md text={c.wrapUp} />
        <p>Lessons exercised: {c.lessons.map((id, i) => <span key={id}>{i ? ', ' : ''}<a href={lessonHref(id)}>{id}</a></span>)}</p>
        <p><a class="btn" href={practiceHref('scenario', scenario)}>Practice this scenario</a></p>
      </section>
    </article>
  );
}

// ---------------- Developer Foundations companion ----------------
export function DevPathPage() {
  const d = store.data;
  const [ans, setAns] = useState<Record<string, string>>(d.diagnostic?.answers ?? {});
  const done = !!d.diagnostic;
  const weak = done ? DIAGNOSTIC.filter((x) => d.diagnostic!.answers[x.id] !== x.correct).map((x) => x.refresher) : [];
  return (
    <div class="page">
      <h2>Companion: {DEV_PATH.title}</h2>
      <div class="card warn-card">
        <p><strong>Source availability.</strong> The learning path at <a href={DEV_PATH.url} target="_blank" rel="noopener noreferrer">{DEV_PATH.url}</a> could not be read ({DEV_PATH.access}, checked {DEV_PATH.checkedOn}). Course lessons and learning objectives are <strong>not available</strong>, so this companion does not reproduce or paraphrase them. Module order is preserved; links to Architect lessons are inferred from module titles only.</p>
      </div>
      <section class="card">
        <h3>Official course order</h3>
        <ol class="modules">
          {DEV_MODULES.map((m) => (
            <li key={m.order}>
              <h4>{m.title} <span class="tag warn">Lessons unavailable</span></h4>
              <p class="small muted">Missing: {m.missing}</p>
              {m.inferredArchitectLessons.length
                ? <p class="small">Related Architect lessons <em>(inferred from title)</em>: {m.inferredArchitectLessons.map((id, i) => <span key={id}>{i ? ', ' : ''}<a href={lessonHref(id)}>{id}</a></span>)}</p>
                : null}
              <p class="small muted">{m.inferredRationale}</p>
            </li>
          ))}
        </ol>
      </section>

      <section class="card" id="diagnostic">
        <h3>Prerequisite diagnostic ({DIAGNOSTIC.length} questions)</h3>
        <p class="muted small">Original questions on prerequisite topics. Misses recommend a refresher below.</p>
        {DIAGNOSTIC.map((x, n) => (
          <div key={x.id} class="dx">
            <p><strong>{n + 1}.</strong> {x.stem}</p>
            {x.options.map((o, i) => (
              <label key={o.id} class={`kc-opt ${done ? (o.id === x.correct ? 'right' : ans[x.id] === o.id ? 'wrong' : '') : ''}`}>
                <input type="radio" name={`dx-${x.id}`} checked={ans[x.id] === o.id} disabled={done} onClick={() => setAns({ ...ans, [x.id]: o.id })} />
                <span>{'ABCD'[i]}. {o.text}</span>
              </label>
            ))}
            {done ? <p class="small">{x.why}</p> : null}
          </div>
        ))}
        {done ? (
          <p><strong>Score: {d.diagnostic!.score} / {DIAGNOSTIC.length}.</strong> {weak.length ? `Recommended refreshers: ${weak.map((w) => REFRESHERS.find((r) => r.id === w)!.course).join(', ')}.` : 'No refreshers needed — start the Architect path.'}{' '}
            <button class="btn small secondary" type="button" onClick={() => { setAns({}); store.update((dd) => { dd.diagnostic = null; }); }}>Retake diagnostic</button></p>
        ) : (
          <button class="btn" type="button" disabled={Object.keys(ans).length < DIAGNOSTIC.length}
            onClick={() => store.update((dd) => { dd.diagnostic = { at: store.now(), answers: ans, score: DIAGNOSTIC.filter((x) => ans[x.id] === x.correct).length }; })}>
            Submit diagnostic ({Object.keys(ans).length}/{DIAGNOSTIC.length} answered)
          </button>
        )}
      </section>

      <section class="card">
        <h3>Optional refreshers</h3>
        <p class="muted small">Short original refreshers on the public subject of each course. They are not summaries of the courses. Course pages were not verified; see the <a href="https://anthropic.skilljar.com/" target="_blank" rel="noopener noreferrer">Anthropic Academy catalog</a>.</p>
        {REFRESHERS.map((r) => (
          <details key={r.id} id={`ref-${r.id}`} class={`refresher ${weak.includes(r.id) ? 'recommended' : ''}`} open={weak.includes(r.id) ? true : undefined}>
            <summary><strong>{r.course}</strong>{weak.includes(r.id) ? <span class="tag warn">Recommended</span> : null}{d.refreshersDone.includes(r.id) ? <span class="tag ok">Reviewed</span> : null}</summary>
            <p>{r.summary}</p>
            <ul>{r.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
            <p class="small">Go deeper: {r.relatedLessons.map((id, i) => <span key={id}>{i ? ', ' : ''}<a href={lessonHref(id)}>Lesson {id}</a></span>)}</p>
            {!d.refreshersDone.includes(r.id) ? <button class="btn small secondary" type="button" onClick={() => store.update((dd) => { dd.refreshersDone.push(r.id); })}>Mark reviewed</button> : null}
          </details>
        ))}
      </section>
    </div>
  );
}

export const ObjLink = ({ id }: { id: ObjectiveId | string }) => <a href={lessonHref(id)}>{id}</a>;
export const _unused = go;
