/**
 * Build-time content checks. Run through `npm run validate:content`.
 *
 * Graded exercises are checked with the app's *own* pipeline: esbuild compiles
 * the code exactly as the in-app compiler does (src/runner/transform.ts), and
 * the real sandbox program runs it (src/runner/sandbox.ts, hosted in Node by
 * scripts/sandboxNode.ts). Grading here with a different pipeline is how every
 * graded exercise once shipped unsolvable while this check stayed green. The
 * application itself never uses `eval` or `new Function`.
 */

import * as esbuild from 'esbuild-wasm';
import ts from 'typescript';
import { matchesOutput } from '../src/content/text';
import { inEnglish } from '../src/i18n/messages';
import { GAME_DATA_TAG, dataLines, parseData, playProgram, sampleInput, usedSteps } from '../src/content/play';
import { compileForSandbox } from '../src/runner/transform';
import { runSandboxInNode } from './sandboxNode';
import { nodeTypeChecker, typeCheckInNode } from './typecheckNode';
import type { CheckOptions } from '../src/runner/typecheckCore';

/**
 * How a step is checked: the device engine it must work on (Classic unless
 * it is marked `runtime: 'modern'`) and its compiler flags.
 */
type Context = CheckOptions & { engine: Engine };

const CLASSIC: Context = { engine: 'classic' };

function contextFor(step: { runtime?: 'modern'; compilerFlags?: CompilerFlags }, engine?: Engine): Context {
  return {
    engine: engine ?? (step.runtime === 'modern' ? 'modern' : 'classic'),
    ...(step.compilerFlags ? { flags: step.compilerFlags } : {}),
  };
}

/** TypeScript's verdict on some code, as the app shows it. */
function typeIssues(code: string, where: string, issues: ContentIssue[], context: Context = CLASSIC): void {
  for (const problem of typeCheckInNode(code, context)) {
    issues.push({ where, message: `type error (line ${problem.line}): ${problem.text}` });
  }
}
import {
  COMPILER_FLAGS,
  isGradedStep,
  requiredSteps,
  type ClassicAlternative,
  type CodeStep,
  type CompilerFlags,
  type Engine,
  type Lesson,
  type Loc,
  type LocList,
  type PlayStep,
  type PredictTypeStep,
  type Step,
  type TestCase,
  type TypesStep,
} from '../src/content/schema';
import { MODULES } from '../src/content/curriculum';
import { FULL_COURSE, fullLesson as getLesson } from '../src/content/fullCourse';
import { LESSONS } from '../src/content/lessons';
import { TRACKS } from '../src/content/schema';
import { CATALOG_PATH, renderCatalog } from './catalog';
import { readFileSync } from 'node:fs';
import { validateTranslations } from './validateTranslations';
import { GLOSSARY_BY_ID } from '../src/content/glossary';
import { ARENA, ARENA_LEVELS, type ArenaPuzzle } from '../src/content/arena';
import { GALLERY } from '../src/content/gallery';

export interface ContentIssue {
  where: string;
  message: string;
}

const VALID_STEP_KINDS = new Set<Step['kind']>([
  'read',
  'compare',
  'check',
  'predict',
  'fill',
  'reorder',
  'fix',
  'write',
  'types',
  'predictType',
  'tryIt',
  'play',
  'recap',
]);

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function checkLoc(
  where: string,
  loc: Loc | undefined,
  issues: ContentIssue[],
  required = true,
): void {
  if (!loc) {
    if (required) issues.push({ where, message: 'missing text' });
    return;
  }
  if (isBlank(loc.base)) issues.push({ where: `${where}.base`, message: 'empty base text' });
  for (const key of ['story', 'explorer', 'pro'] as const) {
    const variant = loc[key];
    if (variant !== undefined && isBlank(variant)) {
      issues.push({ where: `${where}.${key}`, message: `empty ${key} variant` });
    }
  }
}

/**
 * Story mode is for the youngest learners, so everything they read must have
 * a Story version — not just the main lesson text. (Choice texts are exempt:
 * they are mostly code, and the same for everyone.)
 */
function requireStory(where: string, text: Loc | LocList | undefined, issues: ContentIssue[]): void {
  if (text && text.story === undefined) issues.push({ where, message: 'needs a Story-mode version' });
}

/**
 * Pro mode is for people who already program. The texts that carry the
 * teaching (reading bodies, explanations, recaps) need their own Pro version,
 * so the mode is more than a different title.
 */
function requirePro(where: string, text: Loc | LocList | undefined, issues: ContentIssue[]): void {
  if (text && text.pro === undefined) issues.push({ where, message: 'needs a Pro-mode version' });
}

function checkLocList(where: string, list: LocList | undefined, issues: ContentIssue[]): void {
  if (!list) {
    issues.push({ where, message: 'missing list' });
    return;
  }
  if (list.base.length === 0) issues.push({ where: `${where}.base`, message: 'empty list' });
  for (const key of ['base', 'story', 'explorer', 'pro'] as const) {
    const variant = list[key];
    if (!variant) continue;
    variant.forEach((entry, index) => {
      if (isBlank(entry)) {
        issues.push({ where: `${where}.${key}[${index}]`, message: 'empty entry' });
      }
    });
  }
}

function syntaxProblems(code: string, label: string): ContentIssue[] {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      strict: true,
    },
    reportDiagnostics: true,
    fileName: `${label}.ts`,
  });

  const issues: ContentIssue[] = [];
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    const line =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1
        : undefined;
    issues.push({
      where: label,
      message: line ? `${message} (line ${line})` : message,
    });
  }
  return issues;
}

/**
 * Compiles and runs code the way the app does; null when it does not compile.
 * On the Classic engine, the ES2022+ built-ins are removed first, as on an
 * older phone.
 */
async function runLikeTheApp(code: string, tests: readonly TestCase[], context: Context = CLASSIC) {
  let js: string;
  try {
    js = await compileForSandbox(esbuild.transform, code);
  } catch {
    return null;
  }
  return runSandboxInNode(js, tests, 2000, context.engine);
}

async function checkGrading(
  step: { kind: CodeStep['kind'] | 'types'; solution: string; starter: string; tests: readonly TestCase[] },
  where: string,
  issues: ContentIssue[],
  context: Context,
): Promise<void> {
  const outcome = await runLikeTheApp(step.solution, step.tests, context);
  if (!outcome) {
    issues.push({ where: `${where} solution`, message: 'does not compile with the in-app compiler' });
    return;
  }
  if (outcome.timedOut) {
    issues.push({ where: `${where} solution`, message: 'did not finish within the time limit' });
    return;
  }
  const stopped = outcome.loadError ?? outcome.error;
  if (stopped) {
    issues.push({ where: `${where} solution`, message: `threw while running: ${inEnglish(stopped)}` });
    return;
  }
  for (const result of outcome.results) {
    if (!result.pass) {
      issues.push({
        where: `${where} test “${result.name}”`,
        message: `expected ${JSON.stringify(result.expected)}, solution produced ${JSON.stringify(result.got)}`,
      });
    }
  }
  if (outcome.results.length !== step.tests.length) {
    issues.push({ where, message: `ran ${outcome.results.length} of ${step.tests.length} checks` });
  }
  // The app grades types too: the reference answer must be type-correct.
  typeIssues(step.solution, `${where} solution`, issues, context);
  // A "write" step starts from a clean skeleton; a "fix" step may start with
  // a (type) error — that is the exercise.
  if (step.kind === 'write') typeIssues(step.starter, `${where} starter`, issues, context);
  // A type challenge grades its own way (checkTypes); here only its code runs.
  if (step.kind === 'types') return;

  // The starter must not already pass: otherwise the exercise asks nothing.
  const starter = await runLikeTheApp(step.starter, step.tests, context);
  const starterPasses =
    starter !== null &&
    !starter.timedOut &&
    !starter.loadError &&
    !starter.error &&
    starter.results.length === step.tests.length &&
    starter.results.every((result) => result.pass) &&
    typeCheckInNode(step.starter, context).length === 0;
  if (starterPasses) issues.push({ where: `${where} starter`, message: 'already passes every check' });
}

/** Step kinds that run or type-check code, the only ones an engine matters for. */
const CODE_KINDS = new Set<Step['kind']>(['predict', 'fix', 'write', 'types', 'predictType', 'tryIt', 'play']);

/** The code a step runs or checks, to confirm a `runtime: 'modern'` tag is needed. */
function codeOf(step: Step): string | null {
  switch (step.kind) {
    case 'predict':
    case 'predictType':
    case 'tryIt':
      return step.code;
    case 'fix':
    case 'write':
    case 'types':
      return step.solution;
    default:
      return null;
  }
}

/**
 * A step written for newer phones: it must need them (its code does not
 * type-check on Classic), and it must come with a Classic alternative that is
 * graded exactly when it is, checked like any step on the Classic engine.
 */
async function checkEngine(lesson: Lesson, step: Step, where: string, issues: ContentIssue[]): Promise<void> {
  if (step.runtime === undefined) {
    if (step.classic) issues.push({ where, message: 'has a classic alternative but is not marked runtime: "modern"' });
    return;
  }
  if (step.runtime !== 'modern') issues.push({ where, message: `unknown runtime “${String(step.runtime)}”` });
  if (!CODE_KINDS.has(step.kind)) {
    issues.push({ where, message: `a ${step.kind} step runs no code, so it cannot need a modern engine` });
  }
  const code = codeOf(step);
  if (code !== null && typeCheckInNode(code, { ...contextFor(step), engine: 'classic' }).length === 0) {
    issues.push({ where, message: 'is marked runtime: "modern", but its code also works on Classic' });
  }
  if (!step.classic) {
    issues.push({ where, message: 'a runtime: "modern" step needs a classic alternative' });
    return;
  }
  const alternative = { ...(step.classic as ClassicAlternative), id: step.id } as Step;
  const nested = alternative as { runtime?: unknown; classic?: unknown; bonus?: unknown };
  if (nested.runtime !== undefined || nested.classic !== undefined || nested.bonus !== undefined) {
    issues.push({ where: `${where}.classic`, message: 'a classic alternative cannot set runtime, classic or bonus' });
  }
  if (isGradedStep(alternative) !== isGradedStep(step)) {
    issues.push({ where: `${where}.classic`, message: 'must be graded exactly when the step it replaces is' });
  }
  await checkStep(lesson, alternative, issues, { where: `${where}.classic`, engine: 'classic' });
}

function checkFlags(step: Step, where: string, issues: ContentIssue[]): void {
  if (!step.compilerFlags) return;
  for (const [name, value] of Object.entries(step.compilerFlags)) {
    if (!COMPILER_FLAGS.includes(name as keyof CompilerFlags)) {
      issues.push({ where, message: `unknown compiler flag “${name}”` });
    } else if (typeof value !== 'boolean') {
      issues.push({ where, message: `compiler flag “${name}” must be true or false` });
    }
  }
  if (!CODE_KINDS.has(step.kind) && step.kind !== 'read') {
    issues.push({ where, message: `compiler flags do nothing on a ${step.kind} step` });
  }
}

/** A type challenge: the solution passes every type test, the starter does not. */
async function checkTypes(step: TypesStep, where: string, issues: ContentIssue[], context: Context): Promise<void> {
  issues.push(...syntaxProblems(step.starter, `${where}.starter`));
  issues.push(...syntaxProblems(step.solution, `${where}.solution`));
  if (step.typeTests.length === 0) issues.push({ where, message: 'a type challenge has no type tests' });
  for (const test of step.typeTests) {
    if (!test.name.trim()) issues.push({ where, message: 'a type test has no name' });
    if (!test.code.trim()) issues.push({ where, message: `type test “${test.name}” has no code` });
  }
  const checker = nodeTypeChecker();
  const solved = checker.typeTests(step.solution, step.typeTests, context);
  for (const problem of solved.problems) {
    issues.push({ where: `${where} solution`, message: `type error (line ${problem.line}): ${problem.text}` });
  }
  for (const result of solved.results) {
    if (!result.pass) {
      issues.push({ where: `${where} solution`, message: `fails type test “${result.name}”: ${result.detail ?? ''}` });
    }
  }
  const started = checker.typeTests(step.starter, step.typeTests, context);
  if (started.problems.length === 0 && started.results.every((result) => result.pass)) {
    issues.push({ where: `${where} starter`, message: 'already passes every type test' });
  }
  if (step.tests && step.tests.length > 0) {
    await checkGrading({ kind: 'types', solution: step.solution, starter: step.starter, tests: step.tests }, where, issues, context);
  }
}

/** Predict-the-type: the name exists, and the answer (and every accepted spelling) is its type. */
function checkPredictType(step: PredictTypeStep, where: string, issues: ContentIssue[], context: Context): void {
  if (isBlank(step.code)) issues.push({ where, message: 'empty code' });
  if (isBlank(step.answer)) issues.push({ where, message: 'empty answer' });
  issues.push(...syntaxProblems(step.code, `${where}.code`));
  typeIssues(step.code, `${where}.code`, issues, context);
  const checker = nodeTypeChecker();
  const found = checker.typeOf(step.code, step.target, context);
  if (!found) {
    issues.push({ where, message: `“${step.target}” is not declared in the code` });
    return;
  }
  for (const answer of [step.answer, ...(step.alsoAccept ?? [])]) {
    const verdict = checker.matchType(step.code, step.target, answer, context);
    if (!verdict.correct) {
      issues.push({
        where,
        message: `“${answer}” is not the type of ${step.target} (TypeScript: ${found.text})${verdict.answerProblem ? `: ${verdict.answerProblem}` : ''}`,
      });
    }
  }
}

async function checkStep(
  lesson: Lesson,
  step: Step,
  issues: ContentIssue[],
  /** For a classic alternative: where it is, and that it runs on Classic. */
  as?: { where: string; engine: Engine },
): Promise<void> {
  const lessonId = lesson.id;
  const where = as?.where ?? `${lessonId}/${step.id}`;
  const context = contextFor(step, as?.engine);
  checkFlags(step, where, issues);
  if (!as) await checkEngine(lesson, step, where, issues);
  if (!VALID_STEP_KINDS.has(step.kind)) {
    issues.push({ where, message: `unknown step kind ${String(step.kind)}` });
  }
  checkLoc(`${where}.prompt`, step.prompt, issues);
  checkLoc(`${where}.hint`, step.hint, issues, false);
  checkLoc(`${where}.strongHint`, step.strongHint, issues, false);
  checkLoc(`${where}.explain`, step.explain, issues, false);
  for (const field of ['prompt', 'hint', 'strongHint', 'explain'] as const) {
    requireStory(`${where}.${field}`, step[field], issues);
  }
  requirePro(`${where}.explain`, step.explain, issues);
  // Every graded step offers a nudge before "Show me the answer".
  if (isGradedStep(step) && !step.hint) issues.push({ where, message: 'graded step has no hint' });

  switch (step.kind) {
    case 'read': {
      checkLoc(`${where}.body`, step.body, issues);
      requireStory(`${where}.body`, step.body, issues);
      requirePro(`${where}.body`, step.body, issues);
      requireStory(`${where}.callout.body`, step.callout?.body, issues);
      if (step.callout) {
        if (!step.callout.title.trim()) issues.push({ where: `${where}.callout`, message: 'empty title' });
        checkLoc(`${where}.callout.body`, step.callout.body, issues);
      }
      break;
    }
    case 'compare': {
      checkLoc(`${where}.body`, step.body, issues, false);
      requireStory(`${where}.body`, step.body, issues);
      for (const side of ['left', 'right'] as const) {
        const panel = step[side];
        if (!panel.title.trim()) issues.push({ where: `${where}.${side}`, message: 'empty title' });
        if (isBlank(panel.code)) issues.push({ where: `${where}.${side}`, message: 'empty code' });
        // Compare panels may deliberately show prose, pseudo-code, or broken
        // code (the "reading errors" lesson does exactly that). Syntax checking
        // here would punish the lesson for teaching.
        checkLoc(`${where}.${side}.caption`, panel.caption, issues, false);
        requireStory(`${where}.${side}.caption`, panel.caption, issues);
      }
      break;
    }
    case 'check': {
      if (step.choices.length < 2) {
        issues.push({ where, message: 'needs at least two choices' });
      }
      if (!step.choices.some((choice) => choice.correct)) {
        issues.push({ where, message: 'has no correct choice' });
      }
      const ids = new Set<string>();
      for (const choice of step.choices) {
        if (ids.has(choice.id)) issues.push({ where, message: `duplicate choice id ${choice.id}` });
        ids.add(choice.id);
        checkLoc(`${where}.choice.${choice.id}`, choice.text, issues);
        checkLoc(`${where}.choice.${choice.id}.feedback`, choice.feedback, issues, false);
        requireStory(`${where}.choice.${choice.id}.feedback`, choice.feedback, issues);
      }
      break;
    }
    case 'predict': {
      if (isBlank(step.code)) issues.push({ where, message: 'empty code' });
      if (isBlank(step.answer)) issues.push({ where, message: 'empty answer' });
      issues.push(...syntaxProblems(step.code, `${where}.code`));
      if (step.typeErrors !== 'intended') typeIssues(step.code, `${where}.code`, issues, context);
      else if (typeCheckInNode(step.code, context).length === 0) {
        issues.push({ where, message: 'says its type errors are intended, but the code type-checks' });
      }
      // The stated answer must be what the code really prints: a learner who
      // types the true output must not be told they are wrong.
      const outcome = await runLikeTheApp(step.code, [], context);
      if (!outcome) {
        issues.push({ where, message: 'code does not compile with the in-app compiler' });
      } else if (outcome.timedOut || outcome.error || outcome.loadError) {
        issues.push({ where, message: `code does not run cleanly: ${inEnglish(outcome.error ?? outcome.loadError ?? 'timed out')}` });
      } else if (!matchesOutput(outcome.logs.join('\n'), step.answer, step.alsoAccept ?? [])) {
        issues.push({
          where,
          message: `answer ${JSON.stringify(step.answer)} is not what the code prints: ${JSON.stringify(outcome.logs.join('\n'))}`,
        });
      }
      break;
    }
    case 'fill': {
      const blanks = step.template.split('___').length - 1;
      if (blanks === 0) issues.push({ where, message: 'template has no blanks' });
      if (blanks !== step.answers.length) {
        issues.push({
          where,
          message: `template has ${blanks} blanks but ${step.answers.length} answers`,
        });
      }
      if (step.bank.length < step.answers.length) {
        issues.push({ where, message: 'token bank is smaller than the answer list' });
      }
      for (const answer of step.answers) {
        if (!step.bank.includes(answer)) {
          issues.push({ where, message: `answer “${answer}” is not in the bank` });
        }
      }
      let index = 0;
      const assembled = step.template.replace(/___/g, () => step.answers[index++] ?? '');
      issues.push(...syntaxProblems(assembled, `${where}.template`));
      break;
    }
    case 'reorder': {
      if (step.lines.length < 2) issues.push({ where, message: 'needs at least two lines' });
      step.lines.forEach((line, index) => {
        if (isBlank(line)) issues.push({ where: `${where}.lines[${index}]`, message: 'empty line' });
      });
      break;
    }
    case 'fix':
    case 'write': {
      if (step.kind === 'write') issues.push(...syntaxProblems(step.starter, `${where}.starter`));
      issues.push(...syntaxProblems(step.solution, `${where}.solution`));
      if (step.tests.length === 0) {
        issues.push({ where, message: 'graded step has no tests' });
      }
      for (const test of step.tests) {
        if (!test.name.trim()) issues.push({ where, message: 'a test has no name' });
        if (!test.call.trim()) issues.push({ where, message: `test “${test.name}” has no call` });
        if (test.expect === undefined) {
          issues.push({ where, message: `test “${test.name}” has no expectation` });
        }
      }
      if (step.tests.length > 0) await checkGrading(step, where, issues, context);
      break;
    }
    case 'types': {
      await checkTypes(step, where, issues, context);
      break;
    }
    case 'predictType': {
      checkPredictType(step, where, issues, context);
      break;
    }
    case 'tryIt': {
      if (isBlank(step.code)) issues.push({ where, message: 'empty code' });
      issues.push(...syntaxProblems(step.code, `${where}.code`));
      typeIssues(step.code, `${where}.code`, issues, context);
      // A "try it" snippet must run cleanly as given.
      const outcome = await runLikeTheApp(step.code, [], context);
      if (!outcome) issues.push({ where, message: 'code does not compile with the in-app compiler' });
      else if (outcome.timedOut || outcome.error || outcome.loadError) {
        issues.push({ where, message: `code does not run cleanly: ${inEnglish(outcome.error ?? outcome.loadError ?? 'timed out')}` });
      }
      break;
    }
    case 'play': {
      await checkPlay(lesson, step, where, issues, context);
      break;
    }
    case 'recap': {
      checkLocList(`${where}.points`, step.points, issues);
      requireStory(`${where}.points`, step.points, issues);
      requirePro(`${where}.points`, step.points, issues);
      break;
    }
    default: {
      break;
    }
  }
}

/**
 * A game must run: every step it uses is an earlier code step of the same
 * lesson, and the program built from their reference solutions, a typical
 * input and the driver type-checks, runs cleanly and prints something.
 */
async function checkPlay(
  lesson: Lesson,
  step: PlayStep,
  where: string,
  issues: ContentIssue[],
  context: Context,
): Promise<void> {
  const position = lesson.steps.indexOf(step);
  if (step.uses.length === 0) issues.push({ where, message: 'a game uses no code steps' });
  for (const id of step.uses) {
    const at = lesson.steps.findIndex((item) => item.id === id);
    const used = lesson.steps[at];
    if (!used) issues.push({ where, message: `uses “${id}”, which is not a step of this lesson` });
    else if (used.kind !== 'write' && used.kind !== 'fix') issues.push({ where, message: `uses “${id}”, which is not a code step` });
    else if (at > position) issues.push({ where, message: `uses “${id}”, which comes after the game` });
  }
  if (isBlank(step.driver)) issues.push({ where, message: 'empty driver' });

  const game = step.game;
  if (game.type === 'quiz') {
    if (game.questions.length < 2) issues.push({ where, message: 'a quiz needs at least two questions' });
    game.questions.forEach((question, index) => {
      const at = `${where}.questions[${index}]`;
      checkLoc(at, question.question, issues);
      requireStory(at, question.question, issues);
      if (question.choices.length < 2) issues.push({ where: at, message: 'needs at least two choices' });
      if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) {
        issues.push({ where: at, message: 'the answer is not one of the choices' });
      }
    });
  } else if (game.type === 'budget') {
    if (game.suggestions.length === 0) issues.push({ where, message: 'a budget game needs suggestions' });
  } else if (game.type === 'spinner') {
    if (game.wheels.length === 0) issues.push({ where, message: 'a spinner needs at least one wheel' });
  } else if (game.type === 'maze') {
    if (game.levels.length === 0) issues.push({ where, message: 'a maze needs at least one level' });
    game.levels.forEach((rows, index) => {
      const at = `${where}.levels[${index}]`;
      const map = rows.join('\n');
      if (rows.some((row) => row.length !== rows[0]?.length)) issues.push({ where: at, message: 'rows differ in length' });
      if (/[^#.R*\n]/.test(map)) issues.push({ where: at, message: 'only # . R * may be used' });
      if ((map.match(/R/g) ?? []).length !== 1 || (map.match(/\*/g) ?? []).length !== 1) {
        issues.push({ where: at, message: 'needs exactly one R (robot) and one * (star)' });
      } else if (!mazeSolvable(rows)) {
        issues.push({ where: at, message: 'the star cannot be reached from the robot' });
      }
    });
  } else if (game.type === 'battle') {
    if (game.moves.length < 2) issues.push({ where, message: 'a battle needs at least two moves' });
  } else if (game.type === 'todo' || game.type === 'adventure') {
    if (game.suggestions.length === 0) issues.push({ where, message: `a ${game.type} game needs suggestions` });
  }

  const program = playProgram(usedSteps(lesson, step).map((used) => used.solution), sampleInput(game), step.driver);
  typeIssues(program, `${where} game program`, issues, context);
  const outcome = await runLikeTheApp(program, [], context);
  if (!outcome) issues.push({ where, message: 'the game program does not compile with the in-app compiler' });
  else if (outcome.timedOut || outcome.error || outcome.loadError) {
    issues.push({ where, message: `the game program does not run cleanly: ${inEnglish(outcome.error ?? outcome.loadError ?? 'timed out')}` });
  } else if (outcome.logs.length === 0) {
    issues.push({ where, message: 'the game program prints nothing' });
  } else {
    // The game's screen reads data lines: the driver must print them, as JSON
    // where the screen expects JSON.
    const tag = GAME_DATA_TAG[game.type];
    const data = tag ? dataLines(outcome.logs, tag) : [];
    if (tag && data.length === 0) issues.push({ where, message: `the game program prints no @${tag} lines for the screen` });
    if (tag && tag !== 'grid' && data.some((payload) => parseData(payload) === null)) {
      issues.push({ where, message: `an @${tag} line is not valid JSON` });
    }
  }
}

/** Whether the star can be reached from R through open cells (a breadth-first search). */
function mazeSolvable(rows: readonly string[]): boolean {
  const start = rows.findIndex((row) => row.includes('R'));
  if (start < 0) return false;
  const queue: [number, number][] = [[rows[start]!.indexOf('R'), start]];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const cell = rows[y]?.[x];
    if (cell === undefined || cell === '#' || seen.has(`${x},${y}`)) continue;
    if (cell === '*') return true;
    seen.add(`${x},${y}`);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return false;
}

function checkPrerequisiteCycles(issues: ContentIssue[]): void {
  const visiting = new Set<string>();
  const done = new Set<string>();

  const visit = (id: string, trail: string[]): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      issues.push({ where: id, message: `prerequisite cycle: ${[...trail, id].join(' → ')}` });
      return;
    }
    visiting.add(id);
    const lesson = getLesson(id);
    for (const prereq of lesson?.prereqs ?? []) {
      visit(prereq, [...trail, id]);
    }
    visiting.delete(id);
    done.add(id);
  };

  for (const lesson of FULL_COURSE) visit(lesson.id, []);
}

/**
 * Every check that concerns one lesson on its own: texts, step counts, each
 * step (graded with the app's own pipeline), concepts and prerequisites.
 * Exported for tests.
 */
export async function checkLesson(lesson: Lesson): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = [];
  const where = lesson.id;

  if (!lesson.id.trim()) issues.push({ where, message: 'empty lesson id' });
  if (!MODULES.some((module) => module.id === lesson.moduleId)) {
    issues.push({ where, message: `unknown module ${lesson.moduleId}` });
  }
  if (lesson.difficulty !== undefined && ![1, 2, 3].includes(lesson.difficulty)) {
    issues.push({ where, message: 'difficulty must be 1, 2 or 3' });
  }
  if (lesson.objectives) {
    checkLocList(`${where}.objectives`, lesson.objectives, issues);
    requireStory(`${where}.objectives`, lesson.objectives, issues);
  }
  if (!Number.isFinite(lesson.estMinutes) || lesson.estMinutes < 1 || lesson.estMinutes > 45) {
    issues.push({ where, message: 'estimated minutes are out of range' });
  }
  for (const mode of ['story', 'explorer', 'pro'] as const) {
    if (!lesson.title[mode]?.trim()) {
      issues.push({ where: `${where}.title.${mode}`, message: 'empty title' });
    }
    // Titles are shown as plain text everywhere (maps, search, summaries).
    if (/[`*_]/.test(lesson.title[mode] ?? '')) {
      issues.push({ where: `${where}.title.${mode}`, message: 'titles are plain text: no Markdown (`, *, _)' });
    }
  }
  // Bonus ("Go further") steps are extra: the count is of the required ones,
  // and the bonus steps all come after them (the player offers them from
  // the lesson summary).
  const required = requiredSteps(lesson.steps).length;
  if (required < 4 || required > 7) {
    issues.push({
      where,
      message: `has ${required} required steps; the player is designed for 4–7`,
    });
  }
  if (lesson.steps.length - required > 3) {
    issues.push({ where, message: 'has more than 3 bonus steps' });
  }
  const firstBonus = lesson.steps.findIndex((step) => step.bonus);
  if (firstBonus >= 0 && lesson.steps.slice(firstBonus).some((step) => !step.bonus)) {
    issues.push({ where, message: 'bonus steps must come after every required step' });
  }
  if (lesson.steps[required - 1]?.kind !== 'recap' && lesson.steps.some((step) => step.kind === 'recap')) {
    issues.push({ where, message: 'the recap must be the last required step' });
  }
  for (const step of lesson.steps) {
    if (step.bonus && step.kind === 'recap') issues.push({ where, message: 'a recap cannot be a bonus step' });
  }
  checkLocList(`${where}.recap`, lesson.recap, issues);
  requireStory(`${where}.recap`, lesson.recap, issues);
  requirePro(`${where}.recap`, lesson.recap, issues);

  const stepIds = new Set<string>();
  for (const step of lesson.steps) {
    if (stepIds.has(step.id)) {
      issues.push({ where, message: `duplicate step id “${step.id}”` });
    }
    stepIds.add(step.id);
    await checkStep(lesson, step, issues);
  }

  for (const concept of lesson.concepts) {
    if (!GLOSSARY_BY_ID.has(concept)) {
      issues.push({ where, message: `unknown glossary concept “${concept}”` });
    }
  }

  for (const prereq of lesson.prereqs ?? []) {
    if (prereq === lesson.id) issues.push({ where, message: 'lists itself as a prerequisite' });
    else if (!getLesson(prereq)) {
      issues.push({ where, message: `prerequisite “${prereq}” does not exist` });
    }
  }
  return issues;
}

/**
 * The Type Challenges arena: each puzzle is graded like a `types` step, so the
 * same rules apply (the solution passes every type test, the starter does not).
 */
export async function checkArena(puzzles: readonly ArenaPuzzle[] = ARENA): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = [];
  const ids = new Set<string>();
  for (const puzzle of puzzles) {
    const where = `arena/${puzzle.id}`;
    if (ids.has(puzzle.id)) issues.push({ where, message: 'duplicate puzzle id' });
    ids.add(puzzle.id);
    if (!ARENA_LEVELS.includes(puzzle.level)) issues.push({ where, message: `unknown level “${puzzle.level}”` });
    if (!puzzle.title.trim()) issues.push({ where, message: 'empty title' });
    checkLoc(`${where}.prompt`, puzzle.prompt, issues);
    checkLoc(`${where}.hint`, puzzle.hint, issues);
    checkLoc(`${where}.explain`, puzzle.explain, issues);
    await checkTypes(
      {
        id: puzzle.id,
        kind: 'types',
        prompt: puzzle.prompt,
        starter: puzzle.starter,
        solution: puzzle.solution,
        typeTests: puzzle.typeTests,
      },
      where,
      issues,
      { engine: 'classic' },
    );
  }
  return issues;
}

/** Playground gallery examples type-check and run cleanly on the Classic engine. */
async function checkGallery(): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = [];
  const ids = new Set<string>();
  for (const example of GALLERY) {
    const where = `gallery/${example.id}`;
    if (ids.has(example.id)) issues.push({ where, message: 'duplicate example id' });
    ids.add(example.id);
    if (!TRACKS.includes(example.track)) issues.push({ where, message: `unknown track “${example.track}”` });
    typeIssues(example.code, where, issues);
    const outcome = await runLikeTheApp(example.code, []);
    if (!outcome) issues.push({ where, message: 'does not compile with the in-app compiler' });
    else if (outcome.timedOut || outcome.error || outcome.loadError) {
      issues.push({ where, message: `does not run cleanly: ${inEnglish(outcome.error ?? outcome.loadError ?? 'timed out')}` });
    } else if (outcome.logs.length === 0) issues.push({ where, message: 'prints nothing' });
  }
  return issues;
}

export async function validateContent(): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = [];
  const ids = new Set<string>();

  if (FULL_COURSE.length === 0) {
    issues.push({ where: 'curriculum', message: 'no lessons are registered' });
  }

  // Every lesson file entry, listed in a module or not (an unlisted one is
  // reported below as missing from its module).
  for (const lesson of LESSONS) {
    if (ids.has(lesson.id)) issues.push({ where: lesson.id, message: 'duplicate lesson id' });
    ids.add(lesson.id);
    issues.push(...(await checkLesson(lesson)));
  }

  for (const module of MODULES) {
    const moduleIds = new Set<string>();
    for (const lessonId of module.lessonIds) {
      if (moduleIds.has(lessonId)) {
        issues.push({ where: module.id, message: `lesson “${lessonId}” listed twice` });
      }
      moduleIds.add(lessonId);
      const lesson: Lesson | undefined = getLesson(lessonId);
      if (!lesson) {
        issues.push({ where: module.id, message: `lesson “${lessonId}” does not exist` });
      } else if (lesson.moduleId !== module.id) {
        issues.push({
          where: module.id,
          message: `lesson “${lessonId}” belongs to ${lesson.moduleId}`,
        });
      }
    }
    const orphan = LESSONS.filter(
      (lesson) => lesson.moduleId === module.id && !moduleIds.has(lesson.id),
    );
    for (const lesson of orphan) {
      issues.push({ where: module.id, message: `lesson “${lesson.id}” is missing from the module` });
    }
  }

  // Tracks run in order: no foundations module after an intermediate one.
  let lastTrack = 0;
  for (const module of MODULES) {
    const rank = TRACKS.indexOf(module.track);
    if (rank < 0) issues.push({ where: module.id, message: `unknown track “${module.track}”` });
    else if (rank < lastTrack) issues.push({ where: module.id, message: `${module.track} module after a later track` });
    else lastTrack = rank;
  }

  // Each background suggests one starting module at most.
  const claimed = new Map<string, string>();
  for (const module of MODULES) {
    for (const experience of module.entryFor ?? []) {
      const other = claimed.get(experience);
      if (other) issues.push({ where: module.id, message: `entry for “${experience}” is also claimed by ${other}` });
      else claimed.set(experience, module.id);
    }
  }

  // The app's lesson catalog must describe the lesson files as they are now.
  let committed = '';
  try {
    committed = readFileSync(CATALOG_PATH, 'utf8');
  } catch {
    // Reported just below.
  }
  if (committed !== renderCatalog()) {
    issues.push({
      where: 'src/content/generated/catalog.ts',
      message: 'out of date with the lesson files: run `npm run content:catalog`',
    });
  }

  checkPrerequisiteCycles(issues);
  issues.push(...(await checkArena()));
  issues.push(...(await checkGallery()));
  issues.push(...(await validateTranslations()));
  return issues;
}

if (process.argv[1]?.includes('validateContent')) {
  const issues = await validateContent();
  if (issues.length === 0) {
    console.log(`Content OK: ${FULL_COURSE.length} lessons across ${MODULES.length} modules.`);
  } else {
    for (const issue of issues) console.error(`${issue.where}: ${issue.message}`);
    console.error(`\n${issues.length} content problem(s).`);
    process.exitCode = 1;
  }
}
