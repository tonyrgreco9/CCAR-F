import { useState } from '@rt/index';
import type { Question, QuestionOption } from '../content/types';
import { reviewOptions, selectOption, toggleEliminate, type Response } from '../engine/exam';
import { Md, Inline } from './md';
import { LETTERS, lessonHref } from './ctx';
import { lessonById } from '../content';

export const countWord = (n: number) => (n === 1 ? 'ONE' : n === 2 ? 'TWO' : 'THREE');

interface QVProps {
  q: Question;
  order: string[];
  resp: Response;
  onChange: (next: Response) => void;
  /** After submission: show review markers, disable inputs. */
  review?: boolean;
  /** Hide nothing extra; just a label prefix for screen readers. */
  label?: string;
}

/** One question with separate select and eliminate controls per option. */
export function QuestionView({ q, order, resp, onChange, review, label }: QVProps) {
  const [msg, setMsg] = useState('');
  const opts = order.map((id) => q.options.find((o) => o.id === id)!).filter(Boolean);
  const multi = q.type === 'multi';
  const rs = review ? reviewOptions(resp, q) : [];
  const letter = (id: string) => LETTERS[order.indexOf(id)];

  const choose = (e: Event, o: QuestionOption) => {
    if (review) { e.preventDefault(); return; }
    const res = selectOption(resp, q, o.id);
    if (res.blocked === 'eliminated') {
      e.preventDefault();
      setMsg(`Option ${letter(o.id)} is eliminated. Restore option ${letter(o.id)} before selecting it.`);
      return;
    }
    if (res.blocked === 'limit') {
      e.preventDefault();
      setMsg(`You have already selected ${q.selectCount}. Deselect one before choosing option ${letter(o.id)}.`);
      return;
    }
    const n = res.resp.selected.length;
    setMsg(multi ? `${n} of ${q.selectCount} selected.` : `Option ${letter(o.id)} selected.`);
    onChange(res.resp);
  };

  const elim = (o: QuestionOption) => {
    if (review) return;
    const was = resp.eliminated.includes(o.id);
    const wasSelected = resp.selected.includes(o.id);
    const next = toggleEliminate(resp, o.id);
    setMsg(was
      ? `Option ${letter(o.id)} restored. It is not selected.`
      : `Option ${letter(o.id)} eliminated${wasSelected ? ' and deselected' : ''}.${multi ? ` ${next.selected.length} of ${q.selectCount} selected.` : ''}`);
    onChange(next);
  };

  const answered = resp.selected.length === q.selectCount;

  return (
    <div class="qv" data-qid={q.id}>
      <div class="stem" id={`stem-${q.id}`}><Md text={q.stem} /></div>
      <div class="select-count" aria-live="off">
        <span class={`pill ${answered ? 'ok' : ''}`}>
          Select {countWord(q.selectCount)} · {resp.selected.length} of {q.selectCount} selected
        </span>
        {multi && !answered && resp.selected.length > 0 ? <span class="muted small"> Incomplete — choose {q.selectCount - resp.selected.length} more to answer this item.</span> : null}
      </div>
      <fieldset class="options" aria-describedby={`stem-${q.id}`}>
        <legend class="sr-only">{label ?? 'Answer choices'}. Select {countWord(q.selectCount)}.</legend>
        {opts.map((o, i) => {
          const L = LETTERS[i];
          const sel = resp.selected.includes(o.id);
          const el = resp.eliminated.includes(o.id);
          const st = rs.find((x) => x.id === o.id);
          const cls = ['opt', sel && 'selected', el && 'eliminated', st?.correct && 'is-correct', st && st.selected && !st.correct && 'is-wrong'].filter(Boolean).join(' ');
          const inputId = `opt-${q.id}-${o.id}`;
          return (
            <div key={o.id} class={cls} data-option={o.id} data-letter={L}>
              <label class="opt-select" for={inputId}>
                <input
                  id={inputId}
                  type={multi ? 'checkbox' : 'radio'}
                  name={`q-${q.id}`}
                  checked={sel}
                  aria-disabled={el || review ? 'true' : undefined}
                  disabled={review ? true : undefined}
                  onClick={(e: Event) => choose(e, o)}
                />
                <span class="letter" aria-hidden="true">{L}</span>
                <span class="opt-text">
                  <span class="sr-only">Option {L}{el ? ' (eliminated)' : ''}: </span>
                  <Inline text={o.text} />
                </span>
              </label>
              {review ? (
                <div class="opt-marks">
                  {st?.selected ? <span class="mark you">Your selection</span> : null}
                  {st?.correct ? <span class="mark correct">Correct answer</span> : null}
                  {st?.eliminated ? <span class={`mark elim ${st.correct ? 'bad' : ''}`}>{st.correct ? 'You eliminated this correct answer' : 'You eliminated this'}</span> : null}
                </div>
              ) : (
                <button
                  type="button"
                  class={`elim-btn ${el ? 'restore' : ''}`}
                  aria-pressed={el ? 'true' : 'false'}
                  aria-label={el ? `Restore option ${L}` : `Eliminate option ${L}`}
                  title={el ? `Restore option ${L}` : `Eliminate option ${L}`}
                  onClick={() => elim(o)}
                >
                  <span aria-hidden="true">{el ? '↺' : '✕'}</span>
                  <span class="elim-label">{el ? `Restore ${L}` : `Eliminate ${L}`}</span>
                </button>
              )}
            </div>
          );
        })}
      </fieldset>
      <div class="sr-only" role="status" aria-live="polite">{msg}</div>
      {msg && !review ? <p class="hint small" aria-hidden="true">{msg}</p> : null}
    </div>
  );
}

// ---------------- feedback ----------------

interface FBProps {
  q: Question;
  order: string[];
  resp: Response | undefined;
  onFresh?: () => void;
}

/** Post-submission explanation, written against stable option IDs. */
export function Feedback({ q, order, resp, onFresh }: FBProps) {
  const letter = (id: string) => LETTERS[order.indexOf(id)];
  const opt = (id: string) => q.options.find((o) => o.id === id)!;
  const states = reviewOptions(resp, q);
  const unanswered = !resp || resp.selected.length === 0;
  const correctOpts = q.options.filter((o) => o.correct).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const allRight = !unanswered && states.every((s) => (s.correct ? s.selected : !s.selected));
  const lesson = lessonById(q.remediation.lesson);
  const OptName = ({ o }: { o: QuestionOption }) => <><strong>Option {letter(o.id)}:</strong> <Inline text={o.text} /></>;

  const wrongBlock = (o: QuestionOption, mine: boolean) => (
    <div class="fb-wrong" key={o.id}>
      <p><strong>{mine ? 'Why this choice was wrong' : 'Why this choice is wrong'}:</strong> It assumes {lc(o.assumption)} {o.refutingFact} {o.consequence}</p>
      {o.wouldBeRightIf ? <p class="fb-change"><strong>What would change the answer?</strong> {o.wouldBeRightIf}</p> : null}
    </div>
  );

  let body;
  if (q.type === 'single') {
    const c = correctOpts[0];
    if (unanswered) {
      body = (
        <>
          <section class="fb-sec"><h4>You left this unanswered</h4><p>Here is how to work through the decision.</p>
            <p><strong>The deciding detail:</strong> {q.decidingClue}</p></section>
          <section class="fb-sec"><h4>Why the correct answer works</h4><p><OptName o={c} /></p><p>{c.whyItWorks}</p><p class="muted">Clue: {c.supportingClue}</p></section>
          <section class="fb-sec"><h4>Why the other choices fail</h4>
            {order.map(opt).filter((o) => !o.correct).map((o) => <div key={o.id} class="fb-item"><p><OptName o={o} /></p>{wrongBlock(o, false)}</div>)}
          </section>
        </>
      );
    } else if (allRight) {
      body = (
        <>
          <section class="fb-sec ok"><h4>Your answer is correct</h4><p><OptName o={c} /></p><p>{c.whyItWorks}</p><p class="muted">Deciding detail: {q.decidingClue}</p></section>
          <details class="fb-sec"><summary>Why the other choices fail</summary>
            {order.map(opt).filter((o) => !o.correct).map((o) => <div key={o.id} class="fb-item"><p><OptName o={o} /></p>{wrongBlock(o, false)}</div>)}
          </details>
        </>
      );
    } else {
      const mine = opt(resp!.selected[0]);
      const elimC = resp!.eliminated.includes(c.id);
      body = (
        <>
          <section class="fb-sec"><h4>Your answer</h4><p><OptName o={mine} /></p></section>
          <section class="fb-sec bad"><h4>Why your answer was wrong</h4>
            <p><strong>The assumption:</strong> {mine.assumption}</p>
            <p><strong>What the scenario says:</strong> {mine.refutingFact}</p>
            <p><strong>Likely consequence:</strong> {mine.consequence}</p></section>
          <section class="fb-sec ok"><h4>Why the correct answer works</h4>
            <p><OptName o={c} />{elimC ? <span class="mark elim bad"> You eliminated this correct answer</span> : null}</p>
            <p>{c.whyItWorks}</p>
            {elimC ? <p><strong>The clue that supported it:</strong> {c.supportingClue}</p> : <p class="muted">Clue: {c.supportingClue}</p>}</section>
          {mine.wouldBeRightIf ? <section class="fb-sec"><h4>What would change the answer?</h4><p>{mine.wouldBeRightIf}</p></section> : null}
        </>
      );
    }
  } else {
    const items = order.map((id) => states.find((s) => s.id === id)!);
    const right = items.filter((s) => s.kind === 'correct-selected');
    const wrongSel = items.filter((s) => s.kind === 'wrong-selected');
    const missed = items.filter((s) => s.kind === 'correct-missed');
    const elimCorrect = items.filter((s) => s.kind === 'correct-eliminated');
    body = (
      <>
        {unanswered ? <section class="fb-sec"><h4>You left this unanswered</h4><p>Here is how to work through the decision. This item needs exactly {q.selectCount} choices.</p><p><strong>The deciding detail:</strong> {q.decidingClue}</p></section>
          : <section class="fb-sec"><h4>Your answer</h4>
              <p>You selected {resp!.selected.length} of {q.selectCount}: {order.filter((id) => resp!.selected.includes(id)).map((id) => `Option ${letter(id)}`).join(', ')}.
                {allRight ? ' All correct.' : ' Scored as incorrect — multiple-response items need the exact set.'}</p></section>}
        {right.length ? <section class="fb-sec ok"><h4>What you got right</h4>{right.map((s) => { const o = opt(s.id); return <div class="fb-item" key={o.id}><p><OptName o={o} /></p><p>{o.whyItWorks}</p></div>; })}</section> : null}
        {wrongSel.length ? <section class="fb-sec bad"><h4>Why your incorrect choice{wrongSel.length > 1 ? 's were' : ' was'} wrong</h4>{wrongSel.map((s) => { const o = opt(s.id); return (
          <div class="fb-item" key={o.id}><p><OptName o={o} /></p>
            <p><strong>The assumption:</strong> {o.assumption}</p><p><strong>What the scenario says:</strong> {o.refutingFact}</p><p><strong>Likely consequence:</strong> {o.consequence}</p>
            {o.wouldBeRightIf ? <p class="fb-change"><strong>What would change the answer?</strong> {o.wouldBeRightIf}</p> : null}</div>); })}</section> : null}
        {elimCorrect.length ? <section class="fb-sec bad"><h4>You eliminated {elimCorrect.length > 1 ? 'correct answers' : 'a correct answer'}</h4>{elimCorrect.map((s) => { const o = opt(s.id); return (
          <div class="fb-item" key={o.id}><p><OptName o={o} /> <span class="mark elim bad">You eliminated this correct answer</span></p>
            <p><strong>The clue that supported it:</strong> {o.supportingClue}</p><p><strong>Why it works:</strong> {o.whyItWorks}</p></div>); })}</section> : null}
        {missed.length ? <section class="fb-sec"><h4>{unanswered ? 'The correct choices' : `Correct choice${missed.length > 1 ? 's' : ''} you missed`}</h4>{missed.map((s) => { const o = opt(s.id); return (
          <div class="fb-item" key={o.id}><p><OptName o={o} /></p><p>{o.whyItWorks}</p><p class="muted">Clue: {o.supportingClue}</p></div>); })}</section> : null}
        {unanswered ? <section class="fb-sec"><h4>Why the other choices fail</h4>{items.filter((s) => !s.correct).map((s) => { const o = opt(s.id); return <div key={o.id} class="fb-item"><p><OptName o={o} /></p>{wrongBlock(o, false)}</div>; })}</section>
          : <details class="fb-sec"><summary>Other incorrect choices</summary>{items.filter((s) => s.kind === 'wrong-unselected').map((s) => { const o = opt(s.id); return <div key={o.id} class="fb-item"><p><OptName o={o} /></p>{wrongBlock(o, false)}</div>; })}</details>}
      </>
    );
  }

  return (
    <div class="feedback" data-feedback-for={q.id}>
      {body}
      <section class="fb-sec"><h4>Summary</h4><p>{q.explanation}</p></section>
      <section class="fb-sec review-concept"><h4>Review this concept</h4>
        <p><a href={lessonHref(q.remediation.lesson, q.remediation.section)} class="btn small">Lesson {q.remediation.lesson}: {lesson?.title ?? 'lesson'} — {sectionName(q.remediation.section)}</a>
          {onFresh ? <button type="button" class="btn small secondary" onClick={onFresh}>Try a fresh question on this skill</button> : null}</p>
      </section>
    </div>
  );
}

export const sectionName = (s: string) => ({ concept: 'Concept', example: 'Worked example', compare: 'Compare designs', mistake: 'Common mistake', exercise: 'Exercise', check: 'Knowledge check', review: 'Review cards' } as Record<string, string>)[s] ?? s;
const lc = (s?: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
