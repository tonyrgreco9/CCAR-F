import { useEffect, useState } from '@rt/index';
import { currentRoute, store } from './ctx';
import { INDEPENDENCE_NOTICE, EXAM_GUIDE } from '../content/blueprint';
import { LearnHome, LessonPage, CasePage, DevPathPage } from './learn';
import { ExamHome, ExamRunner, Results, MissedReview } from './exam';
import { PracticeHome, PracticeSessionPage } from './practice';
import { Dashboard, PlanPage, CoveragePage, AboutPage } from './pages';

const NAV: [string, string][] = [
  ['#/', 'Dashboard'], ['#/learn', 'Learn'], ['#/practice', 'Practice'], ['#/exam', 'Exam'], ['#/plan', 'Study plan'], ['#/coverage', 'Coverage'], ['#/about', 'About'],
];

export function App() {
  const [, setN] = useState(0);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => { setN((x) => x + 1); setMenu(false); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const r = currentRoute();
  const [p0, p1, p2] = r.path;
  const inExam = p0 === 'exam' && p1 === 'run' && !!store.activeAttempt();

  let page;
  if (!p0) page = <Dashboard />;
  else if (p0 === 'learn') page = <LearnHome />;
  else if (p0 === 'lesson') page = <LessonPage id={p1} section={r.query.get('s')} />;
  else if (p0 === 'case') page = <CasePage scenario={p1 as any} />;
  else if (p0 === 'devpath') page = <DevPathPage />;
  else if (p0 === 'practice' && p1 === 'session') page = <PracticeSessionPage />;
  else if (p0 === 'practice') page = <PracticeHome query={r.query} />;
  else if (p0 === 'exam' && p1 === 'run') page = <ExamRunner />;
  else if (p0 === 'exam') page = <ExamHome />;
  else if (p0 === 'results' && p2 === 'missed') page = <MissedReview id={p1} index={Number(r.query.get('i') ?? 0)} />;
  else if (p0 === 'results') page = <Results id={p1} query={r.query} />;
  else if (p0 === 'plan') page = <PlanPage />;
  else if (p0 === 'coverage') page = <CoveragePage />;
  else if (p0 === 'about') page = <AboutPage />;
  else page = <div class="page"><h2>Page not found</h2><a href="#/">Dashboard</a></div>;

  const active = '#/' + (p0 ?? '');
  return (
    <div class={`app ${inExam ? 'exam-mode' : ''}`}>
      <a class="skip" href="#main">Skip to content</a>
      {!inExam ? (
        <header class="topbar">
          <a class="brand" href="#/">CCAR-F Prep</a>
          <button type="button" class="menu-btn" aria-expanded={menu ? 'true' : 'false'} aria-controls="mainnav" onClick={() => setMenu(!menu)}>Menu</button>
          <nav id="mainnav" class={menu ? 'open' : ''} aria-label="Main">
            {NAV.map(([href, label]) => {
              const cur = href === active || (href === '#/learn' && ['lesson', 'case', 'devpath'].includes(p0 ?? '')) || (href === '#/exam' && p0 === 'results');
              return <a key={href} href={href} aria-current={cur ? 'page' : undefined}>{label}</a>;
            })}
          </nav>
        </header>
      ) : null}
      {!inExam && store.activeAttempt() && p0 !== 'exam' ? (
        <div class="banner" role="status">An exam is in progress and the timer is running. <a href="#/exam/run">Resume exam</a></div>
      ) : null}
      <div id="main">{page}</div>
      {!inExam ? (
        <footer class="foot small">
          <p>{INDEPENDENCE_NOTICE}</p>
          <p>Exam guide version: {EXAM_GUIDE.version ?? 'not available'} · effective date: {EXAM_GUIDE.effectiveDate ?? 'not available'} (guide not supplied — see <a href="#/coverage">Coverage</a>).</p>
        </footer>
      ) : null}
    </div>
  );
}
