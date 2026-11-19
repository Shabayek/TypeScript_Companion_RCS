import { pseudo } from '../i18n/pseudo';
import type { CourseOverlay, GlossaryOverlay, LessonOverlay, LocListOverlay, LocOverlay, ModuleOverlay, StepOverlay } from './overlay';
import type { GlossaryEntry } from './glossary';
import type { CourseModule, Lesson, LessonMeta, Loc, LocList, Step } from './schema';

/**
 * The test pseudo-language for course content: every prose field of the
 * English source, pseudo-localised, as an ordinary overlay. It exercises the
 * same loading, merging and language-switch path a real translation takes.
 * Code and answers are left alone, so every exercise still grades.
 */
const loc = (value: Loc | undefined): LocOverlay | undefined =>
  value
    ? {
        base: pseudo(value.base),
        ...(value.story ? { story: pseudo(value.story) } : {}),
        ...(value.explorer ? { explorer: pseudo(value.explorer) } : {}),
        ...(value.pro ? { pro: pseudo(value.pro) } : {}),
      }
    : undefined;

const list = (value: LocList | undefined): LocListOverlay | undefined =>
  value
    ? {
        base: value.base.map(pseudo),
        ...(value.story ? { story: value.story.map(pseudo) } : {}),
        ...(value.explorer ? { explorer: value.explorer.map(pseudo) } : {}),
        ...(value.pro ? { pro: value.pro.map(pseudo) } : {}),
      }
    : undefined;

/** Drops the fields that are `undefined` (the source had nothing there). */
function defined<T extends object>(value: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

function stepOverlay(step: Step): StepOverlay {
  const own = ownOverlay(step);
  return step.classic ? { ...own, classic: ownOverlay({ ...step.classic, id: step.id } as Step) } : own;
}

function ownOverlay(step: Step): StepOverlay {
  const shared: StepOverlay = defined({
    prompt: loc(step.prompt),
    hint: loc(step.hint),
    strongHint: loc(step.strongHint),
    explain: loc(step.explain),
  });
  switch (step.kind) {
    case 'read':
      return defined({
        ...shared,
        body: loc(step.body),
        callout: step.callout ? defined({ title: pseudo(step.callout.title), body: loc(step.callout.body) }) : undefined,
      });
    case 'compare':
      return defined({
        ...shared,
        body: loc(step.body),
        left: defined({ title: pseudo(step.left.title), caption: loc(step.left.caption) }),
        right: defined({ title: pseudo(step.right.title), caption: loc(step.right.caption) }),
      });
    case 'check':
      return {
        ...shared,
        choices: Object.fromEntries(
          step.choices.map((choice) => [choice.id, defined({ text: loc(choice.text), feedback: loc(choice.feedback) })]),
        ),
      };
    case 'fix':
    case 'write':
      return { ...shared, testNames: step.tests.map((test) => pseudo(test.name)) };
    case 'types':
      return defined({
        ...shared,
        typeTestNames: step.typeTests.map((test) => pseudo(test.name)),
        testNames: step.tests?.map((test) => pseudo(test.name)),
      });
    case 'play':
      return step.game.type === 'quiz'
        ? { ...shared, questions: step.game.questions.map((question) => loc(question.question)) }
        : shared;
    case 'recap':
      return defined({ ...shared, points: list(step.points) });
    default:
      return shared;
  }
}

export function pseudoModule(lessons: readonly Lesson[]): ModuleOverlay {
  return Object.fromEntries(
    lessons.map((lesson): [string, LessonOverlay] => [
      lesson.id,
      defined({
        objectives: list(lesson.objectives),
        recap: list(lesson.recap),
        steps: Object.fromEntries(lesson.steps.map((step) => [step.id, stepOverlay(step)])),
      }),
    ]),
  );
}

export function pseudoCourse(modules: readonly CourseModule[], lessons: readonly LessonMeta[]): CourseOverlay {
  return {
    modules: Object.fromEntries(modules.map((module) => [module.id, { title: pseudo(module.title), tagline: pseudo(module.tagline) }])),
    lessons: Object.fromEntries(
      lessons.map((lesson) => [
        lesson.id,
        { title: { story: pseudo(lesson.title.story), explorer: pseudo(lesson.title.explorer), pro: pseudo(lesson.title.pro) } },
      ]),
    ),
  };
}

export function pseudoGlossary(entries: readonly GlossaryEntry[]): GlossaryOverlay {
  return Object.fromEntries(
    entries.map((entry) => [entry.id, { term: pseudo(entry.term), short: pseudo(entry.short), detail: pseudo(entry.detail) }]),
  );
}
