/**
 * Checks for course translations (src/content/locales/<language>/…), run as
 * part of `npm run validate:content`.
 *
 * A translation may only address what exists (lessons, steps, choices,
 * modules, glossary terms), only with fields that fit the step, and may never
 * change code: a fenced code block in the English text must appear unchanged.
 * A translated `predict` step is run, and must print what it says it prints.
 */
import * as esbuild from 'esbuild-wasm';
import { MODULES } from '../src/content/curriculum';
import { FULL_COURSE } from '../src/content/fullCourse';
import { CHEATSHEET } from '../src/content/cheatsheet';
import { DECODER } from '../src/content/decoder';
import { GLOSSARY_BY_ID } from '../src/content/glossary';
import type { CheatsheetOverlay, CourseOverlay, DecoderOverlay, GlossaryOverlay, LessonOverlay, LocListOverlay, LocOverlay, ModuleOverlay, StepOverlay } from '../src/content/overlay';
import type { Engine, Lesson, Loc, LocList, Step } from '../src/content/schema';
import { matchesOutput } from '../src/content/text';
import { isSupportedLanguage, PSEUDO_LANGUAGE } from '../src/i18n/languages';
import { compileForSandbox } from '../src/runner/transform';
import { runSandboxInNode } from './sandboxNode';
import { typeCheckInNode } from './typecheckNode';

export interface TranslationIssue {
  where: string;
  message: string;
}

const FILES = import.meta.glob<Record<string, unknown>>('../src/content/locales/*/*.ts', { eager: true });

const FENCE = /```[\s\S]*?```/g;

/** Fenced code in the English wording must survive translation unchanged. */
function checkText(where: string, english: string | undefined, translated: string | undefined, issues: TranslationIssue[]): void {
  if (translated === undefined) return;
  if (translated.trim() === '') {
    issues.push({ where, message: 'is empty' });
    return;
  }
  const fences = (english ?? '').match(FENCE) ?? [];
  for (const fence of fences) {
    if (!translated.includes(fence)) issues.push({ where, message: 'changes or drops a code block (code is never translated)' });
  }
  const backticks = (translated.match(/`/g) ?? []).length;
  if (backticks % 2 !== 0) issues.push({ where, message: 'has an unclosed ` code span' });
}

function checkLoc(where: string, english: Loc | undefined, overlay: LocOverlay | undefined, issues: TranslationIssue[]): void {
  if (!overlay) return;
  if (!english) {
    issues.push({ where, message: 'translates a text the English step does not have' });
    return;
  }
  for (const mode of ['base', 'story', 'explorer', 'pro'] as const) {
    checkText(`${where}.${mode}`, english[mode] ?? english.base, overlay[mode], issues);
  }
}

function checkLocList(where: string, english: LocList | undefined, overlay: LocListOverlay | undefined, issues: TranslationIssue[]): void {
  if (!overlay) return;
  if (!english) {
    issues.push({ where, message: 'translates a list the English lesson does not have' });
    return;
  }
  for (const mode of ['base', 'story', 'explorer', 'pro'] as const) {
    const list = overlay[mode];
    if (!list) continue;
    const source = english[mode] ?? english.base;
    if (list.length !== source.length) issues.push({ where: `${where}.${mode}`, message: `has ${list.length} points; English has ${source.length}` });
    list.forEach((item, index) => checkText(`${where}.${mode}[${index}]`, source[index], item, issues));
  }
}

async function checkPredict(
  where: string,
  step: Step,
  patch: NonNullable<StepOverlay['predict']>,
  issues: TranslationIssue[],
  engine: Engine,
): Promise<void> {
  if (step.kind !== 'predict') {
    issues.push({ where, message: 'gives predict code to a step that is not a predict step' });
    return;
  }
  try {
    const outcome = await runSandboxInNode(await compileForSandbox(esbuild.transform, patch.code), [], 2000, engine);
    const printed = outcome.logs.join('\n');
    if (!matchesOutput(printed, patch.answer, patch.alsoAccept ?? [])) {
      issues.push({ where, message: `its code prints ${JSON.stringify(printed)}, not the answer ${JSON.stringify(patch.answer)}` });
    }
  } catch (error) {
    issues.push({ where, message: `its code does not compile: ${String(error)}` });
  }
  if (step.typeErrors !== 'intended') {
    for (const problem of typeCheckInNode(patch.code, { engine, ...(step.compilerFlags ? { flags: step.compilerFlags } : {}) })) {
      issues.push({ where, message: `type error (line ${problem.line}): ${problem.text}` });
    }
  }
}

async function checkStep(
  where: string,
  step: Step,
  patch: StepOverlay,
  issues: TranslationIssue[],
  /** A classic alternative runs on Classic; anything else as it is marked. */
  engine: Engine = step.runtime === 'modern' ? 'modern' : 'classic',
): Promise<void> {
  checkLoc(`${where}.prompt`, step.prompt, patch.prompt, issues);
  checkLoc(`${where}.hint`, step.hint, patch.hint, issues);
  checkLoc(`${where}.strongHint`, step.strongHint, patch.strongHint, issues);
  checkLoc(`${where}.explain`, step.explain, patch.explain, issues);
  const body = step.kind === 'read' || step.kind === 'compare' ? step.body : undefined;
  checkLoc(`${where}.body`, body, patch.body, issues);
  if (patch.callout) {
    if (step.kind !== 'read' || !step.callout) issues.push({ where: `${where}.callout`, message: 'the English step has no callout' });
    else {
      checkText(`${where}.callout.title`, step.callout.title, patch.callout.title, issues);
      checkLoc(`${where}.callout.body`, step.callout.body, patch.callout.body, issues);
    }
  }
  if (patch.choices) {
    if (step.kind !== 'check') issues.push({ where: `${where}.choices`, message: 'only check steps have choices' });
    else {
      for (const [id, choice] of Object.entries(patch.choices)) {
        const source = step.choices.find((item) => item.id === id);
        if (!source) issues.push({ where: `${where}.choices.${id}`, message: 'no such choice' });
        else {
          checkLoc(`${where}.choices.${id}.text`, source.text, choice.text, issues);
          checkLoc(`${where}.choices.${id}.feedback`, source.feedback, choice.feedback, issues);
        }
      }
    }
  }
  for (const side of ['left', 'right'] as const) {
    const panel = patch[side];
    if (!panel) continue;
    if (step.kind !== 'compare') issues.push({ where: `${where}.${side}`, message: 'only compare steps have panels' });
    else {
      checkText(`${where}.${side}.title`, step[side].title, panel.title, issues);
      checkLoc(`${where}.${side}.caption`, step[side].caption, panel.caption, issues);
    }
  }
  if (patch.points) {
    if (step.kind !== 'recap') issues.push({ where: `${where}.points`, message: 'only recap steps have points' });
    else checkLocList(`${where}.points`, step.points, patch.points, issues);
  }
  if (patch.testNames) {
    const tests = step.kind === 'fix' || step.kind === 'write' ? step.tests : step.kind === 'types' ? (step.tests ?? []) : null;
    if (!tests) issues.push({ where: `${where}.testNames`, message: 'only code steps have checks' });
    else if (patch.testNames.length > tests.length) issues.push({ where: `${where}.testNames`, message: 'names more checks than the step has' });
  }
  if (patch.typeTestNames) {
    if (step.kind !== 'types') issues.push({ where: `${where}.typeTestNames`, message: 'only type challenges have type tests' });
    else if (patch.typeTestNames.length > step.typeTests.length) {
      issues.push({ where: `${where}.typeTestNames`, message: 'names more type tests than the step has' });
    }
  }
  if (patch.classic) {
    if (!step.classic) issues.push({ where: `${where}.classic`, message: 'the English step has no classic alternative' });
    else await checkStep(`${where}.classic`, { ...step.classic, id: step.id } as Step, patch.classic, issues, 'classic');
  }
  if (patch.questions) {
    if (step.kind !== 'play' || step.game.type !== 'quiz') issues.push({ where: `${where}.questions`, message: 'only quiz games have questions' });
    else if (patch.questions.length > step.game.questions.length) issues.push({ where: `${where}.questions`, message: 'has more questions than the quiz' });
  }
  if (patch.predict) await checkPredict(`${where}.predict`, step, patch.predict, issues, engine);
}

async function checkLesson(where: string, lesson: Lesson, patch: LessonOverlay, issues: TranslationIssue[]): Promise<void> {
  checkLocList(`${where}.objectives`, lesson.objectives, patch.objectives, issues);
  checkLocList(`${where}.recap`, lesson.recap, patch.recap, issues);
  for (const [stepId, stepPatch] of Object.entries(patch.steps ?? {})) {
    const step = lesson.steps.find((item) => item.id === stepId);
    if (!step) issues.push({ where: `${where}.${stepId}`, message: 'no such step' });
    else await checkStep(`${where}.${stepId}`, step, stepPatch, issues);
  }
}

/** One module file of one language. Exported for tests. */
export async function checkModuleOverlay(language: string, moduleId: string, overlay: ModuleOverlay): Promise<TranslationIssue[]> {
  const issues: TranslationIssue[] = [];
  const module = MODULES.find((item) => item.id === moduleId);
  if (!module) return [{ where: `${language}/${moduleId}`, message: 'no such module' }];
  for (const [lessonId, patch] of Object.entries(overlay)) {
    const lesson = FULL_COURSE.find((item) => item.id === lessonId);
    if (!lesson || !module.lessonIds.includes(lessonId)) issues.push({ where: `${language}/${moduleId}/${lessonId}`, message: `no such lesson in ${moduleId}` });
    else await checkLesson(`${language}/${lessonId}`, lesson, patch, issues);
  }
  return issues;
}

export function checkCourseOverlay(language: string, course: CourseOverlay): TranslationIssue[] {
  const issues: TranslationIssue[] = [];
  for (const [moduleId, patch] of Object.entries(course.modules ?? {})) {
    const module = MODULES.find((item) => item.id === moduleId);
    if (!module) issues.push({ where: `${language}/course.modules.${moduleId}`, message: 'no such module' });
    else {
      checkText(`${language}/course.modules.${moduleId}.title`, module.title, patch.title, issues);
      checkText(`${language}/course.modules.${moduleId}.tagline`, module.tagline, patch.tagline, issues);
    }
  }
  for (const [lessonId, patch] of Object.entries(course.lessons ?? {})) {
    const lesson = FULL_COURSE.find((item) => item.id === lessonId);
    if (!lesson) issues.push({ where: `${language}/course.lessons.${lessonId}`, message: 'no such lesson' });
    else for (const mode of ['story', 'explorer', 'pro'] as const) checkText(`${language}/course.lessons.${lessonId}.${mode}`, lesson.title[mode], patch.title?.[mode], issues);
  }
  return issues;
}

export function checkGlossaryOverlay(language: string, glossary: GlossaryOverlay): TranslationIssue[] {
  const issues: TranslationIssue[] = [];
  for (const [id, patch] of Object.entries(glossary)) {
    const entry = GLOSSARY_BY_ID.get(id);
    if (!entry) issues.push({ where: `${language}/glossary.${id}`, message: 'no such term' });
    else {
      checkText(`${language}/glossary.${id}.term`, entry.term, patch.term, issues);
      checkText(`${language}/glossary.${id}.short`, entry.short, patch.short, issues);
      checkText(`${language}/glossary.${id}.detail`, entry.detail, patch.detail, issues);
    }
  }
  return issues;
}

export function checkCheatsheetOverlay(language: string, cheatsheet: CheatsheetOverlay): TranslationIssue[] {
  const issues: TranslationIssue[] = [];
  for (const [id, patch] of Object.entries(cheatsheet)) {
    const section = CHEATSHEET.find((item) => item.id === id);
    if (!section) {
      issues.push({ where: `${language}/cheatsheet.${id}`, message: 'no such section' });
      continue;
    }
    checkText(`${language}/cheatsheet.${id}.title`, section.title, patch.title, issues);
    const entries = patch.entries ?? [];
    if (entries.length > section.entries.length) issues.push({ where: `${language}/cheatsheet.${id}`, message: 'has more entries than the section' });
    entries.forEach((item, index) => {
      const entry = section.entries[index];
      if (!item || !entry) return;
      checkText(`${language}/cheatsheet.${id}[${index}].title`, entry.title, item.title, issues);
      if (item.note !== undefined && entry.note === undefined) issues.push({ where: `${language}/cheatsheet.${id}[${index}].note`, message: 'the English entry has no note' });
      else checkText(`${language}/cheatsheet.${id}[${index}].note`, entry.note, item.note, issues);
    });
  }
  return issues;
}

export function checkDecoderOverlay(language: string, decoder: DecoderOverlay): TranslationIssue[] {
  const issues: TranslationIssue[] = [];
  for (const [id, patch] of Object.entries(decoder)) {
    const entry = DECODER.find((item) => item.id === id);
    if (!entry) issues.push({ where: `${language}/decoder.${id}`, message: 'no such entry' });
    else {
      checkText(`${language}/decoder.${id}.title`, entry.title, patch.title, issues);
      checkText(`${language}/decoder.${id}.plain`, entry.plain, patch.plain, issues);
      checkText(`${language}/decoder.${id}.fix`, entry.fix, patch.fix, issues);
    }
  }
  return issues;
}

/** Every translation file in the repository. */
export async function validateTranslations(): Promise<TranslationIssue[]> {
  const issues: TranslationIssue[] = [];
  for (const [path, file] of Object.entries(FILES)) {
    const match = path.match(/locales\/([^/]+)\/([^/]+)\.ts$/);
    if (!match) continue;
    const [, language = '', name = ''] = match;
    const where = `content/locales/${language}/${name}.ts`;
    if (!isSupportedLanguage(language) || language === PSEUDO_LANGUAGE || language === 'en') {
      issues.push({ where, message: `“${language}” is not a translation language` });
      continue;
    }
    if (name === 'course') {
      if (!file.COURSE) issues.push({ where, message: 'must export COURSE' });
      else issues.push(...checkCourseOverlay(language, file.COURSE as CourseOverlay));
    } else if (name === 'glossary') {
      if (!file.GLOSSARY) issues.push({ where, message: 'must export GLOSSARY' });
      else issues.push(...checkGlossaryOverlay(language, file.GLOSSARY as GlossaryOverlay));
    } else if (name === 'cheatsheet') {
      if (!file.CHEATSHEET) issues.push({ where, message: 'must export CHEATSHEET' });
      else issues.push(...checkCheatsheetOverlay(language, file.CHEATSHEET as CheatsheetOverlay));
    } else if (name === 'decoder') {
      if (!file.DECODER) issues.push({ where, message: 'must export DECODER' });
      else issues.push(...checkDecoderOverlay(language, file.DECODER as DecoderOverlay));
    } else if (/^m\d\d$/.test(name)) {
      if (!file.LESSONS) issues.push({ where, message: 'must export LESSONS' });
      else issues.push(...(await checkModuleOverlay(language, name, file.LESSONS as ModuleOverlay)));
    } else {
      issues.push({ where, message: 'unexpected file: use course.ts, glossary.ts, cheatsheet.ts, decoder.ts or mNN.ts' });
    }
  }
  return issues;
}

/* ------------------------------ coverage ------------------------------ */

export interface Coverage {
  language: string;
  /** Prose fields in the English course (each Loc counts once). */
  total: number;
  translated: number;
}

function countLesson(lesson: Lesson, patch: LessonOverlay | undefined): { total: number; translated: number } {
  let total = 0;
  let translated = 0;
  const tally = (has: boolean, present: unknown) => {
    if (!has) return;
    total += 1;
    if (present !== undefined) translated += 1;
  };
  tally(true, patch?.recap);
  tally(Boolean(lesson.objectives), patch?.objectives);
  for (const step of lesson.steps) {
    const sp = patch?.steps?.[step.id];
    tally(true, sp?.prompt);
    tally(Boolean(step.hint), sp?.hint);
    tally(Boolean(step.explain), sp?.explain);
    if (step.kind === 'read') tally(true, sp?.body);
    if (step.kind === 'check') for (const choice of step.choices) tally(true, sp?.choices?.[choice.id]?.text);
    if (step.kind === 'recap') tally(true, sp?.points);
  }
  return { total, translated };
}

/** How much of the lesson prose each language translates (for the report and the picker). */
export function translationCoverage(): Coverage[] {
  const byLanguage = new Map<string, Map<string, ModuleOverlay>>();
  for (const [path, file] of Object.entries(FILES)) {
    const match = path.match(/locales\/([^/]+)\/(m\d\d)\.ts$/);
    if (!match || !file.LESSONS) continue;
    const [, language = '', moduleId = ''] = match;
    if (!byLanguage.has(language)) byLanguage.set(language, new Map());
    byLanguage.get(language)?.set(moduleId, file.LESSONS as ModuleOverlay);
  }
  return [...byLanguage.entries()].map(([language, modules]) => {
    let total = 0;
    let translated = 0;
    for (const lesson of FULL_COURSE) {
      const counts = countLesson(lesson, modules.get(lesson.moduleId)?.[lesson.id]);
      total += counts.total;
      translated += counts.translated;
    }
    return { language, total, translated };
  });
}
