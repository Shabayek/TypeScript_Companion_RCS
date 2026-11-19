/**
 * The shape of every lesson in the course.
 *
 * Content is typed data, never HTML. Prose is Markdown, rendered with
 * `html: false` so lesson text can never inject markup.
 */

export type AgeMode = 'story' | 'explorer' | 'pro';

export const AGE_MODES: readonly AgeMode[] = ['story', 'explorer', 'pro'];

/**
 * A line of prose with per-mode variants.
 *
 * Fallback chain: story -> explorer -> base, explorer -> base, pro -> base.
 * A missing variant always degrades to the shared wording instead of breaking
 * the lesson, which is what lets the course grow one mode at a time.
 */
export interface Loc {
  base: string;
  story?: string;
  explorer?: string;
  pro?: string;
}

export interface LocList {
  base: readonly string[];
  story?: readonly string[];
  explorer?: readonly string[];
  pro?: readonly string[];
}

export const FIGURE_IDS = [
  'first-code',
  'type-check',
  'let-const',
  'branch',
  'array',
  'object',
  'function',
  'union',
  'narrow',
  'promise',
  'journey',
  'venn-union',
  'venn-intersection',
  'mapped',
  'conditional',
  'event-loop',
] as const;

export type FigureId = (typeof FIGURE_IDS)[number];

/**
 * A reading step's diagram: one for everyone, or one per reading mode (same
 * fallback as text: story → explorer → base, pro → base). Pro readers can get
 * the precise diagram while Story keeps the friendly one.
 */
export type FigureChoice = FigureId | { base: FigureId; story?: FigureId; explorer?: FigureId; pro?: FigureId };

export interface Callout {
  tone: 'tip' | 'warn' | 'gotcha' | 'why';
  title: string;
  body: Loc;
}

/** One automated check against the learner's code. */
export interface TestCase {
  /** Shown in the results list, e.g. "adds two numbers". */
  name: string;
  /** An expression evaluated inside the sandbox, e.g. `add(2, 3)`. */
  call: string;
  /** Expected value as text, compared with a canonical stringifier. */
  expect: string;
}

/**
 * Stricter compiler options a step can switch on (or, to show what they
 * catch, off). Everything else stays as the app always checks: `strict`.
 */
export interface CompilerFlags {
  noUncheckedIndexedAccess?: boolean;
  exactOptionalPropertyTypes?: boolean;
  noImplicitReturns?: boolean;
  noPropertyAccessFromIndexSignature?: boolean;
  noImplicitOverride?: boolean;
  noFallthroughCasesInSwitch?: boolean;
  strictNullChecks?: boolean;
  noImplicitAny?: boolean;
}

export type CompilerFlag = keyof CompilerFlags;

export const COMPILER_FLAGS: readonly CompilerFlag[] = [
  'noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes',
  'noImplicitReturns',
  'noPropertyAccessFromIndexSignature',
  'noImplicitOverride',
  'noFallthroughCasesInSwitch',
  'strictNullChecks',
  'noImplicitAny',
];

/**
 * Which JavaScript a device runs (see docs/android.md):
 * - `classic`: older Android WebViews, JavaScript up to ES2021;
 * - `modern`: also ES2022 and ES2023 (`.at()`, `Object.hasOwn`,
 *   `structuredClone`, `toSorted`, `findLast`, …).
 */
export type Engine = 'modern' | 'classic';

/** `Omit` applied to each member of a union. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * What a `runtime: 'modern'` step shows on a Classic device: any step kind
 * that teaches the same idea without running the new feature. It keeps the
 * original's id, so progress is the same on either kind of device.
 */
export type ClassicAlternative = DistributiveOmit<Step, 'id' | 'runtime' | 'classic' | 'bonus'>;

interface StepBase {
  id: string;
  /**
   * A "Go further" step: offered after the lesson is finished, never needed
   * to finish it. Bonus steps come after every required step.
   */
  bonus?: true;
  /** The step runs ES2022+ features; `classic` is required with it. */
  runtime?: 'modern';
  /** Shown instead of this step on Classic devices. */
  classic?: ClassicAlternative;
  /** Compiler options for this step's type checks (code, type and predict steps). */
  compilerFlags?: CompilerFlags;
  /** The instruction at the top of the screen. */
  prompt: Loc;
  /** Gentle nudge, revealed on request. */
  hint?: Loc;
  /** Stronger nudge. */
  strongHint?: Loc;
  /** Shown after the learner answers, always in a friendly voice. */
  explain?: Loc;
}

export interface ReadStep extends StepBase {
  kind: 'read';
  body: Loc;
  figure?: FigureChoice;
  callout?: Callout;
}

export interface CompareStep extends StepBase {
  kind: 'compare';
  body?: Loc;
  left: { title: string; code: string; caption?: Loc };
  right: { title: string; code: string; caption?: Loc };
}

export interface CheckChoice {
  id: string;
  text: Loc;
  correct: boolean;
  /** Shown only when this particular choice is picked. */
  feedback?: Loc;
}

export interface CheckStep extends StepBase {
  kind: 'check';
  choices: readonly CheckChoice[];
  multi?: boolean;
}

export interface PredictStep extends StepBase {
  kind: 'predict';
  code: string;
  /** Expected output, whitespace-normalised before comparison. */
  answer: string;
  /** Alternative acceptable answers (case-insensitive). */
  alsoAccept?: readonly string[];
  /**
   * Set when the code breaks a type rule on purpose (e.g. to show what
   * `==` does with mixed types). Otherwise content validation requires it to
   * type-check.
   */
  typeErrors?: 'intended';
}

export interface FillStep extends StepBase {
  kind: 'fill';
  /** Code with each blank written as `___`. */
  template: string;
  /** Tokens offered to the learner, including the correct ones. */
  bank: readonly string[];
  /** Correct token per blank, in order. */
  answers: readonly string[];
}

export interface ReorderStep extends StepBase {
  kind: 'reorder';
  /** Lines in their correct order; the player shuffles them. */
  lines: readonly string[];
}

export interface CodeStep extends StepBase {
  kind: 'fix' | 'write';
  starter: string;
  /** Reference solution. Used by content validation and the reveal button. */
  solution: string;
  entry?: string;
  tests: readonly TestCase[];
}

/** One compile-time check in a `types` step. */
export interface TypeTest {
  /** Shown in the results list, e.g. "keeps the key's type". */
  name: string;
  /**
   * One or more TypeScript statements placed after the learner's code, e.g.
   * `type T1 = Expect<Equal<Pick2<User, "id">, { id: number }>>;`.
   * `Equal`, `Expect`, `NotEqual` and `ExpectFalse` are always available.
   */
  code: string;
  /**
   * `ok` (the default): the statements type-check. `error`: the last line
   * must be rejected (checked with `// @ts-expect-error`); lines before it
   * set things up and must compile.
   */
  expect?: 'ok' | 'error';
}

/**
 * A type challenge: the learner writes types (and maybe code) until every
 * type test passes. Graded by TypeScript's checker; `tests`, when given, also
 * run the code.
 */
export interface TypesStep extends StepBase {
  kind: 'types';
  starter: string;
  solution: string;
  typeTests: readonly TypeTest[];
  tests?: readonly TestCase[];
}

/**
 * "What type does TypeScript give this?" The learner writes a type; it is
 * right when it is *identical* to the type of `target` (a value or a type
 * declared in `code`), so `number | string` counts for `string | number`.
 */
export interface PredictTypeStep extends StepBase {
  kind: 'predictType';
  code: string;
  /** A name declared in `code`: a variable, parameter, function or type. */
  target: string;
  /** The model answer, shown on reveal. */
  answer: string;
  /** Other spellings to accept without asking the checker. */
  alsoAccept?: readonly string[];
}

export interface TryItStep extends StepBase {
  kind: 'tryIt';
  code: string;
}

/** One question in a Studio quiz game. */
export interface QuizQuestion {
  question: Loc;
  choices: readonly string[];
  /** Index of the right choice. */
  answer: number;
}

/**
 * The interface a `play` step puts in front of the learner's code. Each game
 * hands the driver a JSON `input` (see content/play.ts):
 * - quiz: `{ answers: boolean[] }`, one per question, true when right;
 * - budget: `{ budget: number, expenses: { label: string, amount: number }[] }`;
 * - spinner: `{ spins: number[] }`, one random whole number per wheel;
 * - maze: `{ level, maze: string[], moves: ("up" | "down" | "left" | "right")[] }`;
 *   the driver prints `@grid row/row/…` for every frame;
 * - pet: `{ name, actions: ("feed" | "play" | "rest" | "wait")[] }`; the driver
 *   prints `@pet {"hunger":…,"energy":…,"fun":…,"mood":"…"}` after each action;
 * - todo: `{ actions: TodoAction[] }`; the driver prints `@todos [{ id, text, done }]`;
 * - battle: `{ moves: string[], seed: number }`; the driver prints
 *   `@hp {"hero":…,"rival":…,"max":…}` after each turn;
 * - adventure: `{ commands: string[] }`; the driver prints what happens.
 *
 * A line that starts with `@tag ` is data for the game's screen; every other
 * line is shown as text.
 */
export type PlayGame =
  | { type: 'quiz'; questions: readonly QuizQuestion[] }
  | { type: 'budget'; budget: number; suggestions: readonly { label: string; amount: number }[] }
  | { type: 'spinner'; wheels: readonly string[] }
  | {
      type: 'maze';
      /** Each level is rows of `#` wall, `.` floor, `R` the robot's start and `*` the star. */
      levels: readonly (readonly string[])[];
    }
  | { type: 'pet'; name: string }
  | { type: 'todo'; suggestions: readonly string[] }
  | {
      type: 'battle';
      /** Move names, shown as buttons (code words, e.g. "fire"). */
      moves: readonly string[];
    }
  | { type: 'adventure'; suggestions: readonly string[] };

export const MAZE_MOVES = ['up', 'down', 'left', 'right'] as const;
export type MazeMove = (typeof MAZE_MOVES)[number];
export const PET_ACTIONS = ['feed', 'play', 'rest', 'wait'] as const;
export type PetAction = (typeof PET_ACTIONS)[number];

/** What the to-do game sends, one per thing the player does. */
export type TodoAction =
  | { type: 'add'; text: string }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number }
  | { type: 'clearDone' };

/**
 * Not graded: the learner plays the project they just built. The program is
 * the learner's code from the `uses` steps (the reference solution for a step
 * not solved yet), then `const input = …;`, then `driver`, whose console
 * output is the game's screen.
 */
export interface PlayStep extends StepBase {
  kind: 'play';
  /** Ids of earlier `write`/`fix` steps in the same lesson, in program order. */
  uses: readonly string[];
  game: PlayGame;
  driver: string;
}

export interface RecapStep extends StepBase {
  kind: 'recap';
  points: LocList;
}

export type Step =
  | ReadStep
  | CompareStep
  | CheckStep
  | PredictStep
  | FillStep
  | ReorderStep
  | CodeStep
  | TypesStep
  | PredictTypeStep
  | TryItStep
  | PlayStep
  | RecapStep;

export type StepKind = Step['kind'];

/** How demanding a lesson is within its track: 1 gentle, 2 steady, 3 stretching. */
export type Difficulty = 1 | 2 | 3;

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  /** Short titles, written per mode because length and tone both differ. */
  title: Record<AgeMode, string>;
  /** Honest estimate, shown to the learner. */
  estMinutes: number;
  /** Defaults to 1 when left out. */
  difficulty?: Difficulty;
  prereqs?: readonly string[];
  /** Glossary ids this lesson introduces or leans on. */
  concepts: readonly string[];
  /** "You will be able to…" points, shown before the first step. */
  objectives?: LocList;
  steps: readonly Step[];
  recap: LocList;
  /**
   * Set by the loader, never written in a lesson file: the language the
   * lesson's text is in once translations are applied (absent = English).
   */
  textLanguage?: string;
}

/**
 * What the app knows about a lesson without loading it: everything the
 * journey map, search, progress and practice need. Step content lives in the
 * lesson's module file and is loaded when the lesson opens (content/loader.ts).
 *
 * Generated from the lesson files into `generated/catalog.ts` by
 * `npm run content:catalog`; a test fails when it is out of date.
 */
export interface LessonMeta {
  id: string;
  moduleId: string;
  order: number;
  title: Record<AgeMode, string>;
  estMinutes: number;
  difficulty: Difficulty;
  prereqs: readonly string[];
  concepts: readonly string[];
  /** `bonus`: a "Go further" step; `modern`: it has a Classic alternative. */
  steps: readonly StepMeta[];
}

export interface StepMeta {
  id: string;
  kind: StepKind;
  bonus?: true;
  modern?: true;
}

/** A learner's coding background, asked during onboarding. */
export type Experience = 'new' | 'javascript' | 'typescript';

export const EXPERIENCES: readonly Experience[] = ['new', 'javascript', 'typescript'];

/** The three stages of the course, in order. */
export type Track = 'foundations' | 'intermediate' | 'advanced';

export const TRACKS: readonly Track[] = ['foundations', 'intermediate', 'advanced'];

export interface CourseModule {
  id: string;
  number: number;
  /** Which stage of the course the module belongs to. */
  track: Track;
  title: string;
  tagline: string;
  /** CSS colour token used for the module's accent. */
  accent: 'teal' | 'indigo' | 'amber' | 'rose' | 'moss' | 'clay' | 'sky' | 'plum';
  lessonIds: readonly string[];
  /**
   * Where a learner with this background is suggested to start (its first
   * lesson). Each experience may be claimed by one module at most; anything
   * unclaimed starts at the very first lesson (or, for `typescript`, falls
   * back to the `javascript` entry).
   */
  entryFor?: readonly Experience[];
}

const GRADED_KINDS: ReadonlySet<StepKind> = new Set<StepKind>([
  'check',
  'predict',
  'fill',
  'reorder',
  'fix',
  'write',
  'types',
  'predictType',
]);

/** Whether a kind of step is graded (works on catalog entries too). */
export function isGradedKind(kind: StepKind): boolean {
  return GRADED_KINDS.has(kind);
}

/** Every step that can be graded, for the player's status bookkeeping. */
export function isGradedStep(step: Pick<Step, 'kind'>): boolean {
  return isGradedKind(step.kind);
}

/** The steps a learner must pass through to finish a lesson (bonus steps are extra). */
export function requiredSteps<T extends { bonus?: true }>(steps: readonly T[]): T[] {
  return steps.filter((step) => !step.bonus);
}

/** The "Go further" steps of a lesson. */
export function bonusSteps<T extends { bonus?: true }>(steps: readonly T[]): T[] {
  return steps.filter((step) => step.bonus === true);
}

/**
 * The step as this device shows it: a modern step's Classic alternative on a
 * Classic device, the step itself everywhere else. The id and bonus flag stay
 * the original's, so progress does not depend on the device.
 */
export function stepForEngine(step: Step, engine: Engine): Step {
  if (engine !== 'classic' || step.runtime !== 'modern' || !step.classic) return step;
  return {
    ...step.classic,
    id: step.id,
    ...(step.bonus ? { bonus: true as const } : {}),
  } as Step;
}
