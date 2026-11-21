// External resources for CCAR-F preparation. Compiled from web search on 2026-11-21.
// Official items are Anthropic / Pearson VUE pages. Everything else is third-party and unofficial;
// links were found by search and not opened from the build environment (network policy), so a link
// may move or change. Deliberately excluded: re-uploads of the exam guide on document-sharing sites,
// and any site offering "real exam questions" (sharing exam content violates the exam NDA, guide §14).

export interface ExtLink { title: string; url: string; note?: string }
export interface LinkGroup { id: string; title: string; intro: string; links: ExtLink[] }

export const LINKS_CHECKED_ON = '2026-11-21';

export const LINK_GROUPS: LinkGroup[] = [
  {
    id: 'official',
    title: 'Official exam resources',
    intro: 'Published by Anthropic or its exam delivery partner. The exam guide is the authority for scope.',
    links: [
      { title: 'CCAR-F Exam Guide v1.1 (PDF, effective November 2026)', url: 'https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf', note: 'Read in full for this app; 60 items, 120 min, 4 of 6 scenarios, pass = 720 scaled.' },
      { title: 'Anthropic Partner Academy — Earn your Claude certification', url: 'https://anthropic-partners.skilljar.com/page/partner-certifications', note: 'Registration starts here (Claude Partner Network members).' },
      { title: 'Anthropic Partner Academy — Certifications FAQ', url: 'https://anthropic-partners.skilljar.com/page/faq-certifications' },
      { title: 'Pearson VUE — Claude Certification Program by Anthropic', url: 'https://www.pearsonvue.com/us/en/anthropic.html', note: 'Scheduling, online proctoring, test centres, support.' },
      { title: 'Claude Certified Developer – Foundations prep path (Partner Academy)', url: 'https://anthropic-partners.skilljar.com/path/claude-certified-developer-foundations', note: 'Companion path; lessons need a partner login.' },
    ],
  },
  {
    id: 'courses',
    title: 'Free Anthropic courses (recommended background)',
    intro: 'Anthropic Academy / Claude Academy courses that cover the technologies the exam tests.',
    links: [
      { title: 'Claude Academy — course catalog', url: 'https://academy.claude.com/', note: 'Also available on the older anthropic.skilljar.com.' },
      { title: 'Building with the Claude API', url: 'https://academy.claude.com/courses/building-with-the-claude-api' },
      { title: 'Introduction to Model Context Protocol', url: 'https://academy.claude.com/courses/introduction-to-model-context-protocol' },
      { title: 'Build with Claude collection', url: 'https://academy.claude.com/collections/build-with-claude' },
      { title: 'Anthropic Academy (legacy catalog)', url: 'https://anthropic.skilljar.com/' },
    ],
  },
  {
    id: 'docs',
    title: 'Official documentation most relevant to the blueprint',
    intro: 'Primary sources for the mechanisms the guide names.',
    links: [
      { title: 'Claude Docs — Tool use', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview' },
      { title: 'Claude Docs — Agent SDK overview', url: 'https://docs.claude.com/en/docs/agent-sdk/overview' },
      { title: 'Claude Code Docs — Memory (CLAUDE.md)', url: 'https://docs.claude.com/en/docs/claude-code/memory' },
      { title: 'Claude Code Docs — Skills', url: 'https://docs.claude.com/en/docs/claude-code/skills' },
      { title: 'Claude Code Docs — MCP', url: 'https://docs.claude.com/en/docs/claude-code/mcp' },
      { title: 'Claude Code Docs — Headless mode / CI', url: 'https://docs.claude.com/en/docs/claude-code/headless' },
      { title: 'Claude Docs — Message Batches', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' },
      { title: 'Anthropic Engineering — How we built our multi-agent research system', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
      { title: 'Model Context Protocol — Tools specification', url: 'https://modelcontextprotocol.io/specification/2025-06-18/server/tools' },
    ],
  },
  {
    id: 'guides',
    title: 'Study guides (third-party, unofficial)',
    intro: 'Community and commercial guides. Check claims against the official guide; some still cite v1.0 or call the exam "CCA-F".',
    links: [
      { title: 'dnacenta/claude-certified-architect — unofficial study guide (GitHub)', url: 'https://github.com/dnacenta/claude-certified-architect', note: 'Domain notes, question bank, slide deck; tracks guide v1.1.' },
      { title: 'sarveshtalele/claude-architect-exam-guide (GitHub)', url: 'https://github.com/sarveshtalele/claude-architect-exam-guide' },
      { title: 'Tutorials Dojo — CCAR-F study guide', url: 'https://tutorialsdojo.com/ccar-f-claude-certified-architect-foundations-study-guide/' },
      { title: 'Claude Certification Guide — CCAR-F curriculum', url: 'https://claudecertificationguide.com/learn' },
      { title: 'Claude Certification Guide — CCAR-F exam guide & blueprint', url: 'https://claudecertificationguide.com/blog/claude-certified-architect-foundations-exam-guide' },
      { title: 'Riddam Jain — CCAR-F 2026 blueprint guide', url: 'https://riddam.github.io/guides/cca-f-study-guide/' },
      { title: 'Szymon Paluch — CCAR-F: what it is, format and study guide', url: 'https://szymonpaluch.com/blog/posts/claude-certified-architect-certification-guide' },
      { title: 'NBH — Claude Certified Architect Foundations exam guide', url: 'https://www.nbh.co/learn/claude-certified-architect-foundations-exam/' },
      { title: 'Timo Labs — CCAR-F exam guide', url: 'https://www.timolabs.dev/certifications/architect-foundations' },
      { title: 'Skillmarked — CCAR-F study guide', url: 'https://skillmarked.com/study-guides/ccar-f' },
      { title: 'FlashGenius — CCAR-F exam guide 2026', url: 'https://flashgenius.net/blog-article/a-guide-to-the-claude-certified-architect-foundations-certification' },
      { title: 'Udemy — Claude Certified Architect (CCAR-F) 2026 Exam Prep (paid)', url: 'https://www.udemy.com/course/certified-claude-architect-masterclass-2026/' },
    ],
  },
  {
    id: 'practice',
    title: 'Practice exams (third-party, unofficial)',
    intro: 'Question quality varies and advertised bank sizes disagree widely. Avoid any site claiming to have real exam questions.',
    links: [
      { title: 'Timo Labs — free CCAR-F mock exam', url: 'https://www.timolabs.dev/mock-exams/ccar-f' },
      { title: 'Szymon Paluch — free CCAR-F mock exam', url: 'https://szymonpaluch.com/claude-certified-architect-practice-exam' },
      { title: 'Open Exam Prep — free practice questions', url: 'https://open-exam-prep.com/practice/anthropic-cca-f' },
      { title: 'certified-architect.com — mock exam & study guide', url: 'https://certified-architect.com/' },
      { title: 'Claude Certified Architects — 10 free practice questions', url: 'https://www.claudecertifiedarchitects.com/blog/cca-foundations-exam-practice-questions-free/' },
      { title: 'OlivierAlter — practice exam (GitHub)', url: 'https://github.com/OlivierAlter/Claude-Certified-Architect-Foundations-Certification-Exam/blob/main/Claude%20Certification%20Exam.md' },
      { title: 'SecuSpark — CCA-F practice test', url: 'https://www.secuspark.com/practice-tests/claude-ccaf' },
    ],
  },
  {
    id: 'videos',
    title: 'YouTube videos (third-party, unofficial)',
    intro: 'Creator-published overviews, walkthroughs and practice-question sessions.',
    links: [
      { title: 'Claude Certified Architect – Foundations (overview)', url: 'https://www.youtube.com/watch?v=reDRM0tqhNs' },
      { title: 'CCAR-F Exam Guide 2026: 5 Domains, 6 Scenarios, What to Study', url: 'https://www.youtube.com/watch?v=d1asV0WqVFE' },
      { title: 'CCAR-F / CCA-F Exam Prep 2026: Complete free 45-lesson course', url: 'https://www.youtube.com/watch?v=Cnk0_VyURPk' },
      { title: 'Claude Certified Architect', url: 'https://www.youtube.com/watch?v=Fr9Lxc8cotc' },
      { title: 'CCA-F is now CCAR-F: practice exam', url: 'https://www.youtube.com/watch?v=QvmX0btswck' },
      { title: 'CCAR-F practice questions — set 1', url: 'https://www.youtube.com/watch?v=wSBrOlFyWQ0' },
      { title: 'Anthropic CCAR-F practice questions', url: 'https://www.youtube.com/watch?v=w1asoFmeCfk' },
      { title: 'Anthropic CCAR-F practice questions 2026', url: 'https://www.youtube.com/watch?v=Bt9HKyyK9XM' },
    ],
  },
];
