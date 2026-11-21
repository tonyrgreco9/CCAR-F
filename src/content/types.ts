// Content contracts for the CCAR-F prep app.
// Every authored lesson, question, and case study must satisfy these types.
// See docs/CONTENT_GUIDE.md for the authoring rules that tests enforce.

export type DomainId = 1 | 2 | 3 | 4 | 5;

export type ObjectiveId =
  | '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6' | '1.7'
  | '2.1' | '2.2' | '2.3' | '2.4' | '2.5'
  | '3.1' | '3.2' | '3.3' | '3.4' | '3.5' | '3.6'
  | '4.1' | '4.2' | '4.3' | '4.4' | '4.5' | '4.6'
  | '5.1' | '5.2' | '5.3' | '5.4' | '5.5' | '5.6';

export type ScenarioId =
  | 'support'      // Customer support resolution
  | 'codegen'      // Code generation with Claude Code
  | 'research'     // Multi-agent research
  | 'devprod'      // Developer productivity
  | 'ci'           // Continuous integration
  | 'extraction';  // Structured data extraction

/** Stable lesson section anchors. Deep links target one of these. */
export type LessonSection = 'concept' | 'example' | 'compare' | 'mistake' | 'exercise' | 'check' | 'review';

export interface LessonLink {
  lesson: ObjectiveId;
  section: LessonSection;
}

/** Markdown subset: paragraphs, ### headings, **bold**, *italic*, `code`, fenced ```lang code```,
 *  "- " bullets, "1. " numbered lists, "> " callouts, [text](url) links. No HTML, no tables. */
export type Md = string;

export interface QuestionOption {
  /** Stable option ID ('a'..'f'). Display letters are assigned after shuffling; never refer to letters in text. */
  id: string;
  text: string;
  correct: boolean;

  // ----- Required when correct === false (distractor) -----
  /** The assumption a learner who picks this option is relying on. */
  assumption?: string;
  /** The specific fact in the scenario/stem that makes that assumption wrong. */
  refutingFact?: string;
  /** The likely consequence of taking this action in the scenario. */
  consequence?: string;
  /** Optional: one realistic condition change under which this option would be reasonable. */
  wouldBeRightIf?: string;

  // ----- Required when correct === true -----
  /** How this option satisfies the scenario's requirements. */
  whyItWorks?: string;
  /** The clue in the scenario/stem that supports this option (shown if the learner eliminated it). */
  supportingClue?: string;
}

export interface Question {
  /** Stable question ID, e.g. 'support-refund-timeout-v1'. Never reuse or renumber. */
  id: string;
  /** Family ID. Close variants (same decision, failure mode, and constraint) share a family. */
  familyId: string;
  scenario: ScenarioId;
  objective: ObjectiveId;
  type: 'single' | 'multi';
  /** 1 for single; 2 or 3 for multi. Stem must say "Select ONE", "Select TWO" or "Select THREE". */
  selectCount: 1 | 2 | 3;
  stem: Md;
  options: QuestionOption[];
  /** The single detail in the stem that decides the item. Shown after submission. */
  decidingClue: string;
  /** Short overall explanation (post-submission). */
  explanation: string;
  /** Where to study this decision. */
  remediation: LessonLink;
  /** IDs from src/content/sources.ts */
  sources: string[];
}

export interface KnowledgeCheckItem {
  id: string;
  stem: string;
  options: { id: string; text: string }[];
  correct: string; // option id
  why: string;
}

export interface Lesson {
  id: ObjectiveId;
  title: string;
  /** One sentence, concrete: what the learner can do after the lesson. */
  outcome: string;
  minutes: number;
  terms: { term: string; definition: string }[];
  /** App-authored sub-objectives. Pending verification against the guide's Knowledge/Skills bullets. */
  learningPoints: string[];
  concept: Md;
  example: {
    intro: Md;
    artifacts: { lang: string; code: string; caption?: string }[];
    walkthrough: Md;
  };
  compare: {
    question: string;
    a: { title: string; body: Md; chooseWhen: string };
    b: { title: string; body: Md; chooseWhen: string };
    decidingDetail: Md;
  };
  mistake: {
    mistake: Md;
    whyTempting: Md;
    howToRecognize: Md;
    fix: Md;
  };
  exercise: {
    prompt: Md;
    /** Sample inputs (may include fenced code / data). */
    inputs: Md;
    /** Labels the learner assigns to each item, e.g. ['Formatting error', 'Absent in source']. */
    labels: string[];
    items: { id: string; text: string; answer: string; why: string }[];
    solution: Md;
  };
  check: KnowledgeCheckItem[];
  review: { front: string; back: string }[];
  sources: string[];
  /** Dated notes where current product behavior may differ from the exam guide. */
  notes?: { date: string; text: Md }[];
}

export interface CaseDecision {
  id: string;
  prompt: Md;
  options: { id: string; text: string; consequence: string }[];
  best: string; // option id
  walkthrough: Md;
}

export interface CaseStudy {
  scenario: ScenarioId;
  title: string;
  brief: Md;
  constraints: string[];
  decisions: CaseDecision[];
  wrapUp: Md;
  lessons: ObjectiveId[];
}

/** How one official guide bullet (e.g. '1.1.K2') is taught and assessed. */
export interface BulletCoverage {
  /** Lesson sections of the bullet's task-statement lesson that teach it. */
  sections: LessonSection[];
  /** One or two sentences: what the lesson actually says/does for this bullet (reviewed against content). */
  how: string;
  /** Bank question IDs that assess this bullet (may be empty only if `gap` explains why). */
  questions: string[];
  /** Set when coverage is partial; explains what is missing. */
  gap?: string;
}

/** Companion lesson for a Developer Foundations objective that no Architect lesson teaches. Same teaching sequence as Lesson. */
export interface DevLesson extends Omit<Lesson, 'id'> {
  id: string;        // e.g. 'dev-tokens-context'
  module: number;    // Developer Foundations course number (1-5)
  /** True when the topic is listed as out of scope for CCAR-F in the exam guide (still useful for CCDV-F). */
  outOfScopeForCCARF?: boolean;
}
