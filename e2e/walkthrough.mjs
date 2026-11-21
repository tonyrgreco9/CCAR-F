// Browser walkthrough (Playwright). Usage: bun run build && node e2e/walkthrough.mjs
// Starts `bun scripts/serve.ts` on a free port, drives the app on desktop and mobile, saves screenshots to e2e/screens/.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright'); // pre-installed globally (offline environment)
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';

const PORT = 5199; // separate from the 4317 default
const BASE = `http://localhost:${PORT}/`;
mkdirSync('e2e/screens', { recursive: true });
const server = spawn('bun', ['scripts/serve.ts'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const shot = (page, n) => page.screenshot({ path: `e2e/screens/${n}.png`, fullPage: false });

const browser = await chromium.launch();
try {
  // ---------------- desktop ----------------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForSelector('text=Continue learning');
  check('dashboard renders with core actions', await page.locator('text=10-question practice').count() > 0 && await page.locator('text=Review mistakes').count() > 0);
  check('footer shows exam guide version 1.1 and effective date', (await page.textContent('footer')).includes('version 1.1, effective November 2026'));
  check('Links is the first navigation item', (await page.textContent('#mainnav a >> nth=0')).trim() === 'Links');
  await page.click('#mainnav a >> nth=0');
  await page.waitForSelector('.links-page');
  check('Links page lists official resources, study guides, practice exams and videos', await (async () => { const t = await page.textContent('.links-page'); return ['Official exam resources', 'Study guides', 'Practice exams', 'YouTube videos'].every((x) => t.includes(x)); })() && (await page.locator('.links-page section.card').count()) === 6 && (await page.locator('.links-page a[target=_blank]').count()) > 30);
  await page.goto(BASE + '#/lesson/1.1');
  await page.waitForSelector('.guide-bullets');
  check('lesson shows official guide bullets with coverage links', (await page.locator('.guide-bullets .bullets li').count()) === 6 && (await page.locator('.guide-bullets .bullets li a').count()) >= 6);
  await page.goto(BASE + '#/devpath');
  await page.waitForSelector('.dev-objectives');
  const devLink = page.locator('.dev-objectives a[href^="#/dev/"]').first();
  check('Developer path lists public objectives with lesson links', (await page.locator('.dev-objectives li').count()) >= 25 && await devLink.count() === 1);
  await devLink.click();
  await page.waitForSelector('#sec-exercise');
  check('companion lesson opens with full lesson sequence', (await page.locator('.lsec').count()) === 7);
  await page.goto(BASE + '#/coverage');
  check('coverage page reports 240 guide bullets', /\/ 240/.test(await page.textContent('.stats')));
  await page.goto(BASE);
  await page.waitForSelector('text=Continue learning');
  await shot(page, '01-dashboard');

  // complete a lesson
  await page.click('a.btn:has-text("Continue learning")');
  await page.waitForSelector('#sec-concept');
  const lessonTitle = await page.textContent('h2');
  await page.click('button:has-text("Mark lesson complete")');
  check('lesson can be completed', await page.locator('text=Lesson completed').count() === 1, lessonTitle);
  // knowledge check + exercise interact
  await page.locator('.kc input[type=radio]').first().click();
  check('knowledge check gives immediate feedback', await page.locator('.kc .ok-text, .kc .bad-text').count() >= 1);
  await shot(page, '02-lesson');

  // practice: answer a single-choice question incorrectly
  await page.goto(BASE + '#/practice');
  await page.click('button:has-text("10-question practice")');
  await page.waitForSelector('.qv');
  // advance to the first single-answer question
  for (let i = 0; i < 10; i++) {
    const qid = await page.getAttribute('.qv', 'data-qid');
    const t = await page.evaluate((id) => window.__ccarf.byId.get(id).type, qid);
    if (t === 'single') break;
    await page.click('button:has-text("Next →")');
  }
  const qid = await page.getAttribute('.qv', 'data-qid');
  const info = await page.evaluate((id) => { const q = window.__ccarf.byId.get(id); const w = q.options.find((o) => !o.correct); return { wrong: w.id, text: w.text, refuting: w.refutingFact, objective: q.objective, family: q.familyId, lesson: q.remediation.lesson, section: q.remediation.section }; }, qid);
  // try eliminate then restore then select (practice includes elimination)
  await page.click(`.opt[data-option="${info.wrong}"] .elim-btn`);
  check('practice: eliminate marks option struck through', await page.locator(`.opt[data-option="${info.wrong}"].eliminated`).count() === 1);
  await page.click(`.opt[data-option="${info.wrong}"] input`, { force: true }); // aria-disabled: Playwright would otherwise refuse
  check('practice: eliminated option cannot be selected until restored', !(await page.isChecked(`.opt[data-option="${info.wrong}"] input`)));
  await page.click(`.opt[data-option="${info.wrong}"] .elim-btn`);
  await page.click(`.opt[data-option="${info.wrong}"] input`);
  await page.click('button:has-text("Submit answer")');
  await page.waitForSelector('.feedback');
  const fb = await page.textContent('.feedback');
  check('single-choice feedback addresses the selected distractor', fb.includes('Your answer') && fb.includes('Why your answer was wrong') && fb.includes(info.refuting.slice(0, 40)));
  check('feedback has correct-answer, change, and review sections', fb.includes('Why the correct answer works') && fb.includes('Review this concept'));
  await shot(page, '03-practice-feedback');

  // follow remediation link
  await page.click('.review-concept a.btn');
  await page.waitForSelector(`#sec-${info.section}`);
  check('remediation link opens the lesson section', page.url().includes(`#/lesson/${info.lesson}?s=${info.section}`));
  const inView = await page.evaluate((s) => { const r = document.getElementById('sec-' + s).getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }, info.section);
  check('linked section is scrolled into view', inView);
  await page.goBack();
  await page.waitForSelector('.feedback');
  await page.click('button:has-text("Try a fresh question on this skill")');
  await page.waitForSelector('.qv');
  const fq = await page.getAttribute('.qv', 'data-qid');
  const fqi = await page.evaluate((id) => { const q = window.__ccarf.byId.get(id); return { objective: q.objective, family: q.familyId, correct: q.options.filter((o) => o.correct).map((o) => o.id), n: q.selectCount }; }, fq);
  check('fresh question tests the same skill from a different family', fqi.objective === info.objective && fqi.family !== info.family, `${fqi.objective} ${fqi.family}`);
  for (const c of fqi.correct) await page.click(`.opt[data-option="${c}"] input`);
  await page.click('button:has-text("Submit answer")');
  check('fresh question answered with feedback', (await page.textContent('.result-line')).includes('Correct'));

  // ---------------- exam ----------------
  await page.goto(BASE + '#/exam');
  await page.click('button:has-text("Generate new practice exam")');
  await page.waitForSelector('.preview');
  const prevText = await page.textContent('.preview');
  check('preview shows fresh vs previously seen count', /\d+ new question families · \d+ previously seen/.test(prevText.replace(/\s+/g, ' ')), prevText.replace(/\s+/g, ' ').slice(0, 120));
  await page.click('button:has-text("Start this exam")');
  await page.waitForSelector('.exam-bar .timer');
  check('timer counts down from ~120:00', /1:59:\d\d|2:00:00/.test(await page.textContent('.timer')));
  const att = await page.evaluate(() => { const a = window.__ccarf.activeAttempt(); return { id: a.id, ids: a.questionIds, order: a.optionOrder }; });
  const meta = await page.evaluate((ids) => ids.map((id) => { const q = window.__ccarf.byId.get(id); return { id, type: q.type, n: q.selectCount, correct: q.options.filter((o) => o.correct).map((o) => o.id) }; }), att.ids);
  const iMulti = meta.findIndex((m) => m.n === 2);
  const iSingle = meta.findIndex((m) => m.type === 'single');
  check('exam has 60 questions with both item types', att.ids.length === 60 && iMulti >= 0 && iSingle >= 0);
  // answer single question wrong
  await page.click('button:has-text("Navigator")');
  await page.click(`.nav-grid button >> text="${iSingle + 1}"`);
  const sm = meta[iSingle];
  const sWrong = att.order[sm.id].find((o) => !sm.correct.includes(o));
  await page.click(`.opt[data-option="${sWrong}"] input`);
  // acceptance example on the Select TWO item using display letters A..: select A and C, eliminate B, flag
  await page.click('button:has-text("Navigator")');
  await page.click(`.nav-grid button >> text="${iMulti + 1}"`);
  const mm = meta[iMulti];
  const ord = att.order[mm.id];
  await page.click(`.opt[data-letter="A"] input`);
  await page.click(`.opt[data-letter="C"] input`);
  // keyboard: focus Eliminate B and press Enter
  await page.focus(`.opt[data-letter="B"] .elim-btn`);
  await page.keyboard.press('Enter');
  check('keyboard: Enter on "Eliminate option B" eliminates it', await page.getAttribute('.opt[data-letter="B"] .elim-btn', 'aria-label') === 'Restore option B');
  check('eliminating B did not select it or change A/C', await page.isChecked('.opt[data-letter="A"] input') && await page.isChecked('.opt[data-letter="C"] input') && !(await page.isChecked('.opt[data-letter="B"] input')));
  await page.click('button.flag');
  check('select count shows 2 of 2', (await page.textContent('.select-count')).includes('2 of 2 selected'));
  await shot(page, '04-exam-elimination');
  await page.reload();
  await page.waitForSelector('.qv');
  const qNow = await page.getAttribute('.qv', 'data-qid');
  const persisted = qNow === mm.id && await page.isChecked('.opt[data-letter="A"] input') && await page.isChecked('.opt[data-letter="C"] input')
    && await page.locator('.opt[data-letter="B"].eliminated').count() === 1 && await page.getAttribute('button.flag', 'aria-pressed') === 'true';
  check('after refresh: same question, A and C selected, B struck through, flag kept', persisted);
  // eliminate C -> incomplete; restore C does not reselect
  await page.click('.opt[data-letter="C"] .elim-btn');
  check('eliminating selected C clears it: 1 of 2 selected, incomplete', (await page.textContent('.select-count')).includes('1 of 2 selected') && (await page.textContent('.qfoot .status')).includes('Incomplete'));
  await page.click('.opt[data-letter="C"] .elim-btn');
  check('restoring C does not reselect it', !(await page.isChecked('.opt[data-letter="C"] input')) && (await page.textContent('.select-count')).includes('1 of 2'));
  // now set up the review acceptance case: one correct, one wrong selected, the other correct eliminated
  for (const L of ['A', 'B', 'C', 'D', 'E', 'F']) {
    if (await page.locator(`.opt[data-letter="${L}"]`).count() === 0) continue;
    if (await page.locator(`.opt[data-letter="${L}"].eliminated`).count()) await page.click(`.opt[data-letter="${L}"] .elim-btn`);
    if (await page.isChecked(`.opt[data-letter="${L}"] input`)) await page.click(`.opt[data-letter="${L}"] input`);
  }
  const [c1, c2] = mm.correct; const w1 = ord.find((o) => !mm.correct.includes(o));
  await page.click(`.opt[data-option="${c1}"] input`);
  await page.click(`.opt[data-option="${w1}"] input`);
  await page.click(`.opt[data-option="${c2}"] .elim-btn`);
  // flagged nav state independent of answer status
  await page.click('button:has-text("Navigator")');
  const navLabel = await page.getAttribute(`.nav-grid button >> nth=${iMulti}`, 'aria-label');
  check('navigator distinguishes answered + flagged + current', /answered, flagged, current/.test(navLabel), navLabel);
  // close and reopen the tab (time continues)
  const page2 = await ctx.newPage();
  await page.close();
  await page2.goto(BASE + '#/exam');
  await page2.waitForSelector('a:has-text("Resume exam")');
  check('Resume exam is offered and visually distinct', await page2.locator('a.btn.resume').count() >= 1);
  check('Generate is blocked while an exam is active', (await page2.textContent('main, #main')).includes('never replaces an active attempt'));
  await page2.click('a.btn.resume');
  await page2.waitForSelector('.qv');
  check('resume returns to the same question', (await page2.getAttribute('.qv', 'data-qid')) === mm.id);
  // submit via review screen
  await page2.click('.exam-bar button:has-text("Review & submit")');
  const rvText = await page2.textContent('.review-screen');
  check('review screen shows remaining time and unanswered count', /\d+ unanswered/.test(rvText) && /remaining/.test(rvText));
  await page2.click('button:has-text("Submit exam")');
  check('confirmation states unanswered count', /unanswered question/.test(await page2.textContent('.confirm')));
  await page2.click('button:has-text("Yes, submit exam")');
  await page2.waitForSelector('.results');
  const resText = await page2.textContent('.results');
  check('results show raw score, elapsed, unanswered, domain and objective tables', /\/ 60/.test(resText) && resText.includes('elapsed') && resText.includes('Accuracy by domain') && resText.includes('Performance by objective'));
  check('results explain exact-match rule and passing-score caveat', resText.includes('exactly matches the correct set') && resText.includes('not converted to the official scaled score'));
  await shot(page2, '05-results');
  // review missed sequentially, find the multi item
  await page2.click('a:has-text("Review missed questions")');
  await page2.waitForSelector('.feedback');
  check('missed review keeps scenario and answer choices visible', await page2.locator('.review-item details.brief').count() === 1 && await page2.locator('.review-item .opt').count() >= 4);
  let found = false;
  for (let i = 0; i < 60; i++) {
    if ((await page2.getAttribute('.qv', 'data-qid')) === mm.id) { found = true; break; }
    const next = page2.locator('a:has-text("Next missed")');
    if (!(await next.count())) break;
    await next.click();
    await page2.waitForTimeout(50);
  }
  const verifyMulti = async (p) => {
    const t = await p.textContent('.feedback');
    return t.includes('What you got right') && t.includes('Why your incorrect choice was wrong') && t.includes('You eliminated this correct answer') && t.includes('The clue that supported it');
  };
  check('Select TWO review explains right, wrong, and eliminated-correct choices', found && await verifyMulti(page2));
  check('option markers distinguish selection / correct / eliminated', await page2.locator('.mark.you').count() >= 2 && await page2.locator('.mark.correct').count() === 2 && await page2.locator('.mark.elim.bad').count() >= 1);
  await shot(page2, '06-missed-review-multi');
  await page2.reload();
  await page2.waitForSelector('.feedback');
  check('multi review is identical after refresh', await verifyMulti(page2));
  // the wrong single item feedback
  await page2.goto(BASE + `#/results/${att.id}`);
  await page2.click('button.chip:has-text("Missed")');
  check('results filter to missed works', await page2.locator('.rq').count() >= 1);
  await page2.click('button.chip:has-text("Flagged")');
  check('results filter to flagged works', await page2.locator('.rq').count() === 1);

  // generate a different exam from results
  await page2.click('button.chip:has-text("All")');
  await page2.click('a:has-text("Generate new practice exam")');
  await page2.click('button:has-text("Generate new practice exam")');
  await page2.waitForSelector('.preview');
  const t2 = (await page2.textContent('.preview')).replace(/\s+/g, ' ');
  const fresh2 = Number(/(\d+) new question families/.exec(t2)[1]);
  await page2.click('button:has-text("Start this exam")');
  await page2.waitForSelector('.qv');
  const overlap = await page2.evaluate((firstId) => {
    const s = window.__ccarf; const a = s.attempt(firstId); const b = s.activeAttempt();
    const fam = (id) => s.byId.get(id).familyId; const A = new Set(a.questionIds.map(fam));
    return b.questionIds.map(fam).filter((x) => A.has(x)).length;
  }, att.id);
  // Practice answers seen earlier can legitimately reduce freshness; exam-to-exam overlap must be 0.
  check('second exam has zero question-family overlap with the first', overlap === 0, `overlap=${overlap}, fresh shown=${fresh2}`);
  results.push({ name: 'measured overlap between first two exam forms', ok: true, detail: String(overlap) });

  // timer expiry while closed: reopen with the clock shifted past the deadline
  await page2.close();
  const page3 = await ctx.newPage();
  await page3.goto(BASE + '?clockOffsetMs=' + (121 * 60 * 1000) + '#/');
  await page3.waitForSelector('.results');
  check('exam expired while closed is auto-submitted on reopen', (await page3.textContent('.results')).includes('Time expired'));
  const subs = await page3.evaluate(() => window.__ccarf.data.attempts.filter((a) => a.status === 'submitted').length);
  await page3.reload(); await page3.waitForTimeout(1500);
  const subs2 = await page3.evaluate(() => window.__ccarf.data.attempts.filter((a) => a.status === 'submitted').length);
  check('no duplicate submission after reload', subs === 2 && subs2 === 2, `${subs} -> ${subs2}`);
  await page3.close();
  check('no uncaught page errors (desktop)', errors.length === 0, errors.join(' | '));

  // ---------------- mobile ----------------
  const m = await browser.newContext({ ...devices['iPhone 13'] });
  const mp = await m.newPage();
  const merr = [];
  mp.on('pageerror', (e) => merr.push(e.message));
  await mp.goto(BASE);
  await mp.waitForSelector('text=Continue learning');
  const noHScroll = async () => mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('mobile dashboard: no horizontal scroll', await noHScroll());
  await mp.screenshot({ path: 'e2e/screens/07-mobile-dashboard.png' });
  await mp.goto(BASE + '#/exam');
  await mp.click('button:has-text("Generate new practice exam")');
  await mp.click('button:has-text("Start this exam")');
  await mp.waitForSelector('.qv');
  await mp.click('.opt[data-letter="B"] .elim-btn');
  const sizes = await mp.evaluate(() => [...document.querySelectorAll('.opt')].map((o) => { const a = o.querySelector('.opt-select').getBoundingClientRect(); const b = o.querySelector('.elim-btn').getBoundingClientRect(); return { sel: a.height, elimW: b.width, elimH: b.height, overlap: a.right > b.left + 1 }; }));
  check('mobile: select and eliminate targets are separate and ≥44px', sizes.every((s) => s.sel >= 44 && s.elimW >= 44 && s.elimH >= 44 && !s.overlap), JSON.stringify(sizes[0]));
  check('mobile exam: no horizontal scroll', await noHScroll());
  await mp.screenshot({ path: 'e2e/screens/08-mobile-exam.png' });
  await mp.goto(BASE + '#/lesson/4.3');
  await mp.waitForSelector('#sec-concept');
  check('mobile lesson: no horizontal page scroll (code blocks scroll internally)', await noHScroll());
  await mp.screenshot({ path: 'e2e/screens/09-mobile-lesson.png' });
  check('no uncaught page errors (mobile)', merr.length === 0, merr.join(' | '));
} catch (e) {
  check('walkthrough completed without exceptions', false, String(e && e.stack || e));
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
