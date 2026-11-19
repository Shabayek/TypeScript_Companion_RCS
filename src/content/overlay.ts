import type { CheatSection } from './cheatsheet';
import type { DecoderEntry } from './decoder';
import type { AgeMode, Callout, CourseModule, Lesson, Loc, LocList, Step } from './schema';

/* ------------------------------------------------------------------ *
 * Translations of course content, as overlays on the English source.
 *
 * Files live in `content/locales/<language>/`:
 *   course.ts   — module titles and taglines, lesson titles  (COURSE)
 *   glossary.ts — terms                                      (GLOSSARY)
 *   mNN.ts      — one module's lesson text                   (LESSONS)
 *   cheatsheet.ts, decoder.ts — the reference pages  (CHEATSHEET, DECODER)
 *
 * Everything is keyed by id (lesson, step, choice), never by position, and
 * anything missing falls back to English. Code is not translated, with one
 * exception: a `predict` step may give its own `code` *with* the `answer` it
 * prints (for translated string literals); the content check runs it.
 * ------------------------------------------------------------------ */

/** Per-mode wording; any mode left out falls back (story → explorer → base → English). */
export type LocOverlay = Partial<Loc>;
export type LocListOverlay = Partial<LocList>;

export interface StepOverlay {
  prompt?: LocOverlay;
  hint?: LocOverlay;
  strongHint?: LocOverlay;
  explain?: LocOverlay;
  /** read and compare steps. */
  body?: LocOverlay;
  callout?: { title?: string; body?: LocOverlay };
  /** check steps, by choice id. */
  choices?: Readonly<Record<string, { text?: LocOverlay; feedback?: LocOverlay }>>;
  /** compare steps. */
  left?: { title?: string; caption?: LocOverlay };
  right?: { title?: string; caption?: LocOverlay };
  /** recap steps. */
  points?: LocListOverlay;
  /** Graded code steps: check names shown in results, by position in `tests`. */
  testNames?: readonly (string | undefined)[];
  /** Type challenges: type test names, by position in `typeTests`. */
  typeTestNames?: readonly (string | undefined)[];
  /** play steps with a quiz: the questions, by position. */
  questions?: readonly (LocOverlay | undefined)[];
  /** predict steps: translated string literals, always together with what the code prints. */
  predict?: { code: string; answer: string; alsoAccept?: readonly string[] };
  /** A modern step's Classic alternative, translated like any step. */
  classic?: StepOverlay;
}

export interface LessonOverlay {
  objectives?: LocListOverlay;
  recap?: LocListOverlay;
  steps?: Readonly<Record<string, StepOverlay>>;
}

/** One module file: lesson id → overlay. */
export type ModuleOverlay = Readonly<Record<string, LessonOverlay>>;

export interface CourseOverlay {
  modules?: Readonly<Record<string, { title?: string; tagline?: string }>>;
  lessons?: Readonly<Record<string, { title?: Partial<Record<AgeMode, string>> }>>;
}

export type GlossaryOverlay = Readonly<Record<string, { term?: string; short?: string; detail?: string }>>;

/** The cheatsheet, by section id; entries by position. Code is never translated. */
export type CheatsheetOverlay = Readonly<
  Record<string, { title?: string; entries?: readonly ({ title?: string; note?: string } | undefined | null)[] }>
>;

/** The error decoder, by entry id. The English match text stays (compiler messages are English). */
export type DecoderOverlay = Readonly<Record<string, { title?: string; plain?: string; fix?: string }>>;

/* ------------------------------ merging ------------------------------ */

/**
 * A translated Loc. Each mode takes the translation's own wording first, then
 * the translation's fallbacks, and only then English: a Story reader of a
 * language without a Story variant reads that language, not English.
 */
export function mergeLoc(source: Loc, overlay: LocOverlay | undefined): Loc {
  if (!overlay) return source;
  const base = overlay.base ?? overlay.explorer ?? source.base;
  const explorer = overlay.explorer ?? overlay.base;
  const story = overlay.story ?? overlay.explorer ?? overlay.base;
  const pro = overlay.pro ?? overlay.base;
  return {
    base,
    ...(story !== undefined ? { story } : source.story !== undefined ? { story: source.story } : {}),
    ...(explorer !== undefined ? { explorer } : source.explorer !== undefined ? { explorer: source.explorer } : {}),
    ...(pro !== undefined ? { pro } : source.pro !== undefined ? { pro: source.pro } : {}),
  };
}

export function mergeLocList(source: LocList, overlay: LocListOverlay | undefined): LocList {
  if (!overlay) return source;
  const base = overlay.base ?? overlay.explorer ?? source.base;
  const explorer = overlay.explorer ?? overlay.base;
  const story = overlay.story ?? overlay.explorer ?? overlay.base;
  const pro = overlay.pro ?? overlay.base;
  return {
    base,
    ...(story ? { story } : source.story ? { story: source.story } : {}),
    ...(explorer ? { explorer } : source.explorer ? { explorer: source.explorer } : {}),
    ...(pro ? { pro } : source.pro ? { pro: source.pro } : {}),
  };
}

function mergeOptional(source: Loc | undefined, overlay: LocOverlay | undefined): Loc | undefined {
  return source ? mergeLoc(source, overlay) : undefined;
}

function mergeCallout(source: Callout, overlay: StepOverlay['callout']): Callout {
  if (!overlay) return source;
  return { ...source, title: overlay.title ?? source.title, body: mergeLoc(source.body, overlay.body) };
}

/** A step with its translation applied. Ids, kinds, answers and code are kept. */
export function applyStepOverlay(step: Step, overlay: StepOverlay | undefined): Step {
  if (!overlay) return step;
  const translated = applyOwnOverlay(step, overlay);
  if (!step.classic || !overlay.classic) return translated;
  // The Classic alternative is a step of its own, sharing the original's id.
  const { id: _id, ...classic } = applyOwnOverlay({ ...step.classic, id: step.id } as Step, overlay.classic);
  return { ...translated, classic } as Step;
}

function applyOwnOverlay(step: Step, overlay: StepOverlay): Step {
  const shared = {
    prompt: mergeLoc(step.prompt, overlay.prompt),
    ...(step.hint ? { hint: mergeLoc(step.hint, overlay.hint) } : {}),
    ...(step.strongHint ? { strongHint: mergeLoc(step.strongHint, overlay.strongHint) } : {}),
    ...(step.explain ? { explain: mergeLoc(step.explain, overlay.explain) } : {}),
  };
  switch (step.kind) {
    case 'read':
      return {
        ...step,
        ...shared,
        body: mergeLoc(step.body, overlay.body),
        ...(step.callout ? { callout: mergeCallout(step.callout, overlay.callout) } : {}),
      };
    case 'compare': {
      const body = mergeOptional(step.body, overlay.body);
      const side = (panel: typeof step.left, patch: StepOverlay['left']) => ({
        ...panel,
        title: patch?.title ?? panel.title,
        ...(panel.caption ? { caption: mergeLoc(panel.caption, patch?.caption) } : {}),
      });
      return {
        ...step,
        ...shared,
        ...(body ? { body } : {}),
        left: side(step.left, overlay.left),
        right: side(step.right, overlay.right),
      };
    }
    case 'check':
      return {
        ...step,
        ...shared,
        choices: step.choices.map((choice) => {
          const patch = overlay.choices?.[choice.id];
          if (!patch) return choice;
          return {
            ...choice,
            text: mergeLoc(choice.text, patch.text),
            ...(choice.feedback ? { feedback: mergeLoc(choice.feedback, patch.feedback) } : {}),
          };
        }),
      };
    case 'predict':
      return overlay.predict
        ? {
            ...step,
            ...shared,
            code: overlay.predict.code,
            answer: overlay.predict.answer,
            ...(overlay.predict.alsoAccept ? { alsoAccept: overlay.predict.alsoAccept } : {}),
          }
        : { ...step, ...shared };
    case 'fix':
    case 'write':
      return {
        ...step,
        ...shared,
        tests: step.tests.map((test, index) => ({ ...test, name: overlay.testNames?.[index] ?? test.name })),
      };
    case 'types':
      return {
        ...step,
        ...shared,
        typeTests: step.typeTests.map((test, index) => ({ ...test, name: overlay.typeTestNames?.[index] ?? test.name })),
        ...(step.tests
          ? { tests: step.tests.map((test, index) => ({ ...test, name: overlay.testNames?.[index] ?? test.name })) }
          : {}),
      };
    case 'play':
      return step.game.type === 'quiz'
        ? {
            ...step,
            ...shared,
            game: {
              ...step.game,
              questions: step.game.questions.map((question, index) => ({
                ...question,
                question: mergeLoc(question.question, overlay.questions?.[index]),
              })),
            },
          }
        : { ...step, ...shared };
    case 'recap':
      return { ...step, ...shared, points: mergeLocList(step.points, overlay.points) };
    default:
      return { ...step, ...shared };
  }
}

/** A lesson with its translation applied (titles come from the course overlay). */
export function applyLessonOverlay(lesson: Lesson, overlay: LessonOverlay | undefined, course?: CourseOverlay): Lesson {
  const title = course?.lessons?.[lesson.id]?.title;
  if (!overlay && !title) return lesson;
  return {
    ...lesson,
    ...(title ? { title: { ...lesson.title, ...title } } : {}),
    ...(lesson.objectives ? { objectives: mergeLocList(lesson.objectives, overlay?.objectives) } : {}),
    recap: mergeLocList(lesson.recap, overlay?.recap),
    steps: lesson.steps.map((step) => applyStepOverlay(step, overlay?.steps?.[step.id])),
  };
}

export function moduleText(module: CourseModule, course: CourseOverlay | undefined): { title: string; tagline: string } {
  const patch = course?.modules?.[module.id];
  return { title: patch?.title ?? module.title, tagline: patch?.tagline ?? module.tagline };
}

/** The cheatsheet in a language: titles and notes translated, code as is. */
export function applyCheatsheetOverlay(sections: readonly CheatSection[], overlay: CheatsheetOverlay | undefined): readonly CheatSection[] {
  if (!overlay) return sections;
  return sections.map((section) => {
    const patch = overlay[section.id];
    if (!patch) return section;
    return {
      ...section,
      title: patch.title ?? section.title,
      entries: section.entries.map((entry, index) => {
        const item = patch.entries?.[index];
        if (!item) return entry;
        return {
          ...entry,
          title: item.title ?? entry.title,
          ...(entry.note !== undefined ? { note: item.note ?? entry.note } : {}),
        };
      }),
    };
  });
}

/** A decoder entry in a language. Its `match` stays English: compiler messages are English. */
export function applyDecoderOverlay(entry: DecoderEntry, overlay: DecoderOverlay | undefined): DecoderEntry {
  const patch = overlay?.[entry.id];
  if (!patch) return entry;
  return { ...entry, title: patch.title ?? entry.title, plain: patch.plain ?? entry.plain, fix: patch.fix ?? entry.fix };
}
