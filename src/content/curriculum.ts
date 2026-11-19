import type { CourseModule, Experience, LessonMeta, Track } from './schema';
import { LESSON_CATALOG } from './generated/catalog';
import type { ProgressState } from '../storage/types';

export const MODULES: readonly CourseModule[] = [
  {
    id: 'm00',
    number: 0,
    track: 'foundations',
    title: 'First Contact',
    tagline: 'What code is, and why TypeScript is worth the labels.',
    accent: 'teal',
    lessonIds: [
      'm00-l01-code-is-instructions',
      'm00-l02-why-typescript',
      'm00-l03-first-program',
      'm00-l04-reading-errors',
    ],
  },
  {
    id: 'm01',
    number: 1,
    track: 'foundations',
    title: 'Values & Names',
    tagline: 'Text, numbers, and the difference between const and let.',
    accent: 'indigo',
    lessonIds: [
      'm01-l01-strings',
      'm01-l02-numbers',
      'm01-l03-let-and-const',
      'm01-l04-template-literals',
      'm01-l05-string-methods',
    ],
  },
  {
    id: 'm02',
    number: 2,
    track: 'foundations',
    title: 'Decisions',
    tagline: 'Comparisons, branches, and choosing between paths.',
    accent: 'amber',
    lessonIds: [
      'm02-l01-comparing',
      'm02-l02-if-else',
      'm02-l03-truthiness',
      'm02-l04-switch-and-guards',
    ],
  },
  {
    id: 'm03',
    number: 3,
    track: 'foundations',
    title: 'Collections',
    tagline: 'Arrays, objects, and the three methods that do most of the work.',
    accent: 'moss',
    lessonIds: [
      'm03-l01-arrays',
      // Added later, so its id does not follow the numbering: lesson ids are
      // the keys saved progress is stored under, and never change.
      'm03-l05-loops',
      'm03-l02-objects',
      'm03-l03-destructuring-spread',
      'm03-l04-map-filter-find',
      'm03-l06-array-toolkit',
      'm03-l07-map-and-set',
    ],
  },
  {
    id: 'm04',
    number: 4,
    track: 'foundations',
    title: 'Functions',
    tagline: 'Reusable recipes, arrow functions, and callbacks.',
    accent: 'sky',
    lessonIds: [
      'm04-l01-functions',
      'm04-l02-arrow-functions',
      'm04-l03-defaults-rest',
      'm04-l04-callbacks',
    ],
  },
  {
    id: 'm05',
    number: 5,
    track: 'foundations',
    title: 'Types That Talk',
    tagline: 'Shapes, unions, narrowing, and one honest generic.',
    accent: 'plum',
    // Someone who already writes JavaScript knows modules 1–4; the types start here.
    entryFor: ['javascript'],
    lessonIds: [
      'm05-l01-type-vs-interface',
      'm05-l02-unions-narrowing',
      'm05-l03-optional-unknown',
      'm05-l04-generics',
    ],
  },
  {
    id: 'm06',
    number: 6,
    track: 'foundations',
    title: 'Programs That Grow',
    tagline: 'Modules, failures, promises, and classes with judgement.',
    accent: 'clay',
    lessonIds: [
      'm06-l01-modules',
      'm06-l02-errors',
      'm06-l03-promises',
      'm06-l04-classes',
    ],
  },
  {
    id: 'm07',
    number: 7,
    track: 'foundations',
    title: 'Studio',
    tagline: 'Five small projects, built from everything before.',
    accent: 'rose',
    lessonIds: [
      'm07-l01-quiz-game',
      'm07-l02-budget',
      'm07-l03-story-generator',
      'm07-l04-robot-maze',
      'm07-l05-pet-keeper',
    ],
  },
  {
    id: 'm08',
    number: 8,
    track: 'intermediate',
    title: 'Functions with Types',
    tagline: 'Function types, overloads, and checks that teach TypeScript.',
    accent: 'indigo',
    // Someone who already writes TypeScript starts at the intermediate track.
    entryFor: ['typescript'],
    lessonIds: [
      'm08-l01-function-types',
      'm08-l02-overloads',
      'm08-l03-type-predicates',
      'm08-l04-assertion-functions',
    ],
  },
  {
    id: 'm09',
    number: 9,
    track: 'intermediate',
    title: 'Shapes in Depth',
    tagline: 'Tuples, exact values, dictionaries, intersections and satisfies.',
    accent: 'teal',
    lessonIds: [
      'm09-l01-tuples-readonly',
      'm09-l02-as-const',
      'm09-l03-index-signatures-record',
      'm09-l04-intersections',
      'm09-l05-satisfies',
    ],
  },
  {
    id: 'm10',
    number: 10,
    track: 'intermediate',
    title: 'Modelling with Unions',
    tagline: 'Tagged unions, exhaustive checks, results and state machines.',
    accent: 'amber',
    lessonIds: [
      'm10-l01-discriminated-unions',
      'm10-l02-exhaustive-never',
      'm10-l03-enums-vs-unions',
      'm10-l04-result-type',
      'm10-l05-state-machines',
    ],
  },
  {
    id: 'm11',
    number: 11,
    track: 'intermediate',
    title: 'Generics in Depth',
    tagline: 'Constraints, keyof, generic classes and how inference works.',
    accent: 'plum',
    lessonIds: [
      'm11-l01-constraints',
      'm11-l02-keyof-indexed',
      'm11-l03-generic-classes',
      'm11-l04-defaults-multiple',
      'm11-l05-inference',
    ],
  },
  {
    id: 'm12',
    number: 12,
    track: 'intermediate',
    title: 'The Type Toolbox',
    tagline: 'Utility types that build new types from the ones you have.',
    accent: 'sky',
    lessonIds: [
      'm12-l01-partial-required-readonly',
      'm12-l02-pick-omit',
      'm12-l03-returntype-parameters',
      'm12-l04-exclude-extract',
      'm12-l05-combining-utilities',
    ],
  },
  {
    id: 'm13',
    number: 13,
    track: 'intermediate',
    title: 'Data & Async',
    tagline: 'Folding, immutable updates, generators, promises and untrusted data.',
    accent: 'moss',
    lessonIds: [
      'm13-l01-reduce-properly',
      'm13-l02-immutable-updates',
      'm13-l03-iterators-generators',
      'm13-l04-promise-combinators',
      'm13-l05-async-errors',
      'm13-l06-parsing-unknown',
    ],
  },
  {
    id: 'm14',
    number: 14,
    track: 'intermediate',
    title: 'Classes & Structure',
    tagline: 'Privacy, accessors, contracts, and building with parts.',
    accent: 'clay',
    lessonIds: [
      'm14-l01-access-modifiers',
      'm14-l02-properties-getters-static',
      'm14-l03-abstract-implements',
      'm14-l04-composition',
    ],
  },
  {
    id: 'm15',
    number: 15,
    track: 'intermediate',
    title: 'Intermediate Studio',
    tagline: 'A to-do app, a shop and a battle game, typed end to end.',
    accent: 'rose',
    lessonIds: ['m15-l01-todo-reducer', 'm15-l02-shop-inventory', 'm15-l03-battle'],
  },
  {
    id: 'm16',
    number: 16,
    track: 'advanced',
    title: 'Type-Level Thinking',
    tagline: 'Conditional, mapped and template literal types: programs that run on types.',
    accent: 'indigo',
    lessonIds: [
      'm16-l01-conditional-types',
      'm16-l02-infer',
      'm16-l03-distributive',
      'm16-l04-mapped-types',
      'm16-l05-key-remapping',
      'm16-l06-template-literal-types',
    ],
  },
  {
    id: 'm17',
    number: 17,
    track: 'advanced',
    title: 'Advanced Type Patterns',
    tagline: 'Recursion, brands, variance, inference control and typed events.',
    accent: 'plum',
    lessonIds: [
      'm17-l01-recursive-types',
      'm17-l02-branded-types',
      'm17-l03-variance',
      'm17-l04-noinfer-const',
      'm17-l05-return-strategies',
      'm17-l06-event-emitter',
    ],
  },
  {
    id: 'm18',
    number: 18,
    track: 'advanced',
    title: 'Strictness & Tooling',
    tagline: 'Compiler flags, declarations, modules, validation and escape hatches.',
    accent: 'teal',
    lessonIds: [
      'm18-l01-strict-flags',
      'm18-l02-declaration-files',
      'm18-l03-modules-imports',
      'm18-l04-runtime-validation',
      'm18-l05-escape-hatches',
    ],
  },
  {
    id: 'm19',
    number: 19,
    track: 'advanced',
    title: 'Advanced Studio',
    tagline: 'A schema library, a typed router, a state machine engine and an adventure.',
    accent: 'rose',
    lessonIds: [
      'm19-l01-validation-library',
      'm19-l02-typed-router',
      'm19-l03-state-machine-engine',
      'm19-l04-text-adventure',
    ],
  },
];

/**
 * Every lesson in course order, as catalog entries (no step content: that is
 * loaded when a lesson opens, see loader.ts).
 */
export const ALL_LESSONS: readonly LessonMeta[] = (() => {
  const byId = new Map(LESSON_CATALOG.map((lesson) => [lesson.id, lesson]));
  const ordered: LessonMeta[] = [];
  for (const module of MODULES) {
    for (const id of module.lessonIds) {
      const lesson = byId.get(id);
      if (lesson) ordered.push(lesson);
    }
  }
  return ordered;
})();

const LESSON_BY_ID = new Map(ALL_LESSONS.map((lesson) => [lesson.id, lesson]));
const MODULE_BY_ID = new Map(MODULES.map((module) => [module.id, module]));
const INDEX_BY_ID = new Map(ALL_LESSONS.map((lesson, index) => [lesson.id, index]));

export const COURSE_LENGTH = ALL_LESSONS.length;

/** A lesson's catalog entry. Load its steps with `loadLesson` (loader.ts). */
export function getLessonMeta(id: string): LessonMeta | undefined {
  return LESSON_BY_ID.get(id);
}

export function moduleOfLesson(lessonId: string): CourseModule | undefined {
  const lesson = LESSON_BY_ID.get(lessonId);
  return lesson ? MODULE_BY_ID.get(lesson.moduleId) : undefined;
}

export function lessonIndex(lessonId: string): number {
  return INDEX_BY_ID.get(lessonId) ?? -1;
}

export function previousLessonId(lessonId: string): string | undefined {
  const index = lessonIndex(lessonId);
  if (index <= 0) return undefined;
  return ALL_LESSONS[index - 1]?.id;
}

export function nextLessonId(lessonId: string): string | undefined {
  const index = lessonIndex(lessonId);
  if (index < 0) return undefined;
  return ALL_LESSONS[index + 1]?.id;
}

export function isLessonCompleted(lessonId: string, state: ProgressState): boolean {
  return state.lessons[lessonId]?.status === 'completed';
}

/**
 * The guided path: the first lesson is open, and each next one opens when the
 * one before it is finished. Explicit prerequisites are also honoured, so a
 * lesson can be reordered later without breaking access.
 */
export function isOnPath(lessonId: string, state: ProgressState): boolean {
  const index = lessonIndex(lessonId);
  if (index < 0) return false;
  if (index === 0) return true;
  // A lesson the learner has already worked in stays open, even when the
  // course later gains a new lesson in front of it (as loops did), or after
  // "Unlock all lessons" is turned off again. Merely opening a locked lesson
  // used to create an entry, so that alone does not count.
  const own = state.lessons[lessonId];
  if (own && (own.status === 'completed' || own.stepIndex > 0 || Object.keys(own.steps).length > 0)) return true;

  const lesson = ALL_LESSONS[index];
  const prerequisites = lesson?.prereqs ?? [];
  if (prerequisites.length > 0 && !prerequisites.every((id) => isLessonCompleted(id, state))) {
    return false;
  }

  const previous = ALL_LESSONS[index - 1];
  return previous ? isLessonCompleted(previous.id, state) : true;
}

/**
 * Whether a lesson can be opened: on the guided path, or anywhere when the
 * learner turned on Settings → "Unlock all lessons". Every screen asks this.
 */
export function isLessonUnlocked(lessonId: string, state: ProgressState): boolean {
  if (lessonIndex(lessonId) < 0) return false;
  return state.settings.unlockAll || isOnPath(lessonId, state);
}

/** Open only because every lesson is unlocked: shown as "ahead of your path". */
export function isAheadOfPath(lessonId: string, state: ProgressState): boolean {
  return isLessonUnlocked(lessonId, state) && !isOnPath(lessonId, state);
}

/** The lesson that is blocking this one, for the "finish X first" message. */
export function blockingLesson(lessonId: string, state: ProgressState): LessonMeta | undefined {
  const index = lessonIndex(lessonId);
  if (index <= 0) return undefined;
  const lesson = ALL_LESSONS[index];
  const missingPrereq = (lesson?.prereqs ?? []).find((id) => !isLessonCompleted(id, state));
  if (missingPrereq) return LESSON_BY_ID.get(missingPrereq);
  const previous = ALL_LESSONS[index - 1];
  return previous && !isLessonCompleted(previous.id, state) ? previous : undefined;
}

/**
 * What a lesson builds on, nearest first: its explicit prerequisites and the
 * earlier lessons of its module; the first lesson of a module builds on the
 * last lesson of the module before.
 */
export function buildsOn(lessonId: string): LessonMeta[] {
  const lesson = LESSON_BY_ID.get(lessonId);
  const module = lesson ? MODULE_BY_ID.get(lesson.moduleId) : undefined;
  if (!lesson || !module) return [];
  const ids = new Set<string>(lesson.prereqs);
  const position = module.lessonIds.indexOf(lessonId);
  if (position > 0) {
    for (const id of module.lessonIds.slice(0, position)) ids.add(id);
  } else {
    const previous = previousLessonId(lessonId);
    if (previous) ids.add(previous);
  }
  return [...ids]
    .map((id) => LESSON_BY_ID.get(id))
    .filter((item): item is LessonMeta => item !== undefined)
    .sort((a, b) => lessonIndex(b.id) - lessonIndex(a.id));
}

/**
 * The unfinished lessons this one builds on (at most `limit`, nearest first),
 * for the gentle "this builds on…" note when a learner jumps ahead.
 */
export function unfinishedBuildsOn(lessonId: string, state: ProgressState, limit = 3): LessonMeta[] {
  return buildsOn(lessonId)
    .filter((item) => !isLessonCompleted(item.id, state))
    .slice(0, limit);
}

/** The module a learner with this background is suggested to start in. */
export function entryModule(experience: Experience | null): CourseModule | undefined {
  if (!experience || experience === 'new') return MODULES[0];
  const claimed = MODULES.find((module) => module.entryFor?.includes(experience));
  if (claimed) return claimed;
  return experience === 'typescript' ? entryModule('javascript') : MODULES[0];
}

/** The first lesson of the suggested starting module. */
export function recommendedStart(experience: Experience | null): string {
  return entryModule(experience)?.lessonIds[0] ?? ALL_LESSONS[0]?.id ?? '';
}

/**
 * The lesson "Continue" opens.
 *
 * On the guided path it is the first unfinished lesson. With every lesson
 * unlocked the learner may be anywhere, so it is the lesson they were last in
 * (if unfinished), else the next unfinished lesson after it, else — before
 * anything was opened — the suggested start for their background.
 */
export function nextUpLessonId(state: ProgressState): string {
  const firstUnfinished = (from = 0): LessonMeta | undefined => {
    const after = ALL_LESSONS.slice(from).find((lesson) => !isLessonCompleted(lesson.id, state));
    return after ?? ALL_LESSONS.find((lesson) => !isLessonCompleted(lesson.id, state));
  };

  if (state.settings.unlockAll) {
    const last = state.lastLessonId;
    if (last && lessonIndex(last) >= 0) {
      if (!isLessonCompleted(last, state)) return last;
      const next = firstUnfinished(lessonIndex(last) + 1);
      if (next) return next.id;
    } else {
      const start = recommendedStart(state.profile.experience);
      if (start && !isLessonCompleted(start, state)) return start;
    }
  }

  return firstUnfinished()?.id ?? ALL_LESSONS[ALL_LESSONS.length - 1]?.id ?? '';
}

/** Tracks that have at least one module, in course order. */
export function tracksInCourse(): Track[] {
  const tracks: Track[] = [];
  for (const module of MODULES) if (!tracks.includes(module.track)) tracks.push(module.track);
  return tracks;
}

export function getModule(moduleId: string): CourseModule | undefined {
  return MODULE_BY_ID.get(moduleId);
}

/** Minutes of the module's lessons not finished yet. */
export function minutesLeft(moduleId: string, state: ProgressState): number {
  const module = MODULE_BY_ID.get(moduleId);
  if (!module) return 0;
  return module.lessonIds
    .filter((id) => !isLessonCompleted(id, state))
    .reduce((sum, id) => sum + (LESSON_BY_ID.get(id)?.estMinutes ?? 0), 0);
}

export function moduleStats(
  moduleId: string,
  state: ProgressState,
): { total: number; completed: number; ratio: number } {
  const lessons = MODULES.find((module) => module.id === moduleId)?.lessonIds ?? [];
  const total = lessons.length;
  const completed = lessons.filter((id) => isLessonCompleted(id, state)).length;
  return { total, completed, ratio: total === 0 ? 0 : completed / total };
}

export function courseStats(state: ProgressState): {
  completed: number;
  total: number;
  ratio: number;
  solved: number;
  practiced: number;
} {
  let completed = 0;
  let solved = 0;
  let practiced = 0;

  for (const lesson of ALL_LESSONS) {
    const progress = state.lessons[lesson.id];
    if (progress?.status === 'completed') completed += 1;
    for (const step of lesson.steps) {
      const record = progress?.steps[step.id];
      if (record?.solved) solved += 1;
      else if (record?.practiced) practiced += 1;
    }
  }

  return {
    completed,
    total: ALL_LESSONS.length,
    ratio: ALL_LESSONS.length === 0 ? 0 : completed / ALL_LESSONS.length,
    solved,
    practiced,
  };
}
