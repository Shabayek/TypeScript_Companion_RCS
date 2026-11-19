// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import { MODULES } from '../src/content/curriculum';
import { FULL_COURSE } from '../src/content/fullCourse';
import { applyLessonOverlay, applyStepOverlay, mergeLoc } from '../src/content/overlay';
import { pseudoModule } from '../src/content/pseudoContent';
import type { CheckStep, PredictStep, ReadStep } from '../src/content/schema';
import { pseudo, pseudoCatalogue } from '../src/i18n/pseudo';
import { en } from '../src/i18n/locales/en';
import {
  checkCourseOverlay,
  checkGlossaryOverlay,
  checkModuleOverlay,
  translationCoverage,
  validateTranslations,
} from '../scripts/validateTranslations';

const firstModule = MODULES[0]!;
const firstLesson = FULL_COURSE.find((lesson) => lesson.id === firstModule.lessonIds[0])!;
const readStep = firstLesson.steps.find((step): step is ReadStep => step.kind === 'read')!;
const checkLesson = FULL_COURSE.find((lesson) => lesson.steps.some((step) => step.kind === 'check'))!;
const checkStep = checkLesson.steps.find((step): step is CheckStep => step.kind === 'check')!;
const predictLesson = FULL_COURSE.find((lesson) => lesson.steps.some((step) => step.kind === 'predict' && !step.typeErrors))!;
const predictStep = predictLesson.steps.find((step): step is PredictStep => step.kind === 'predict' && !step.typeErrors)!;

describe('merging a translation over the English', () => {
  it('prefers the translation in every mode before falling back to English', () => {
    const source = { base: 'Base', story: 'Story', explorer: 'Explorer', pro: 'Pro' };
    // Only a base translation: every reader gets the translated base.
    expect(mergeLoc(source, { base: 'Basis' })).toEqual({ base: 'Basis', story: 'Basis', explorer: 'Basis', pro: 'Basis' });
    // A Story translation is used for Story; Explorer falls back to the translated base.
    expect(mergeLoc(source, { base: 'Basis', story: 'Geschichte' })).toMatchObject({ story: 'Geschichte', explorer: 'Basis' });
    expect(mergeLoc(source, undefined)).toBe(source);
  });

  it('keeps ids, kinds, answers and code, and replaces only wording', () => {
    const translated = applyStepOverlay(checkStep, {
      prompt: { base: 'Traduit' },
      choices: { [checkStep.choices[0]!.id]: { text: { base: 'Choix traduit' } } },
    }) as CheckStep;
    expect(translated.id).toBe(checkStep.id);
    expect(translated.kind).toBe('check');
    expect(translated.prompt.base).toBe('Traduit');
    expect(translated.choices[0]!.text.base).toBe('Choix traduit');
    expect(translated.choices.map((choice) => [choice.id, choice.correct])).toEqual(
      checkStep.choices.map((choice) => [choice.id, choice.correct]),
    );
  });

  it('swaps a predict step’s code only together with its answer', () => {
    const translated = applyStepOverlay(predictStep, {
      predict: { code: 'console.log("Bonjour");', answer: 'Bonjour' },
    }) as PredictStep;
    expect(translated.code).toBe('console.log("Bonjour");');
    expect(translated.answer).toBe('Bonjour');
  });

  it('takes lesson titles from the course overlay', () => {
    const lesson = applyLessonOverlay(firstLesson, undefined, {
      lessons: { [firstLesson.id]: { title: { explorer: 'Titre' } } },
    });
    expect(lesson.title.explorer).toBe('Titre');
    expect(lesson.title.story).toBe(firstLesson.title.story);
  });
});

describe('the content check for translations', () => {
  beforeAll(() => esbuild.transform('const warm = 1;', { loader: 'ts' }), 60_000);

  it('accepts a translation that addresses real lessons, steps and choices', async () => {
    const issues = await checkModuleOverlay('fr', firstModule.id, {
      [firstLesson.id]: { steps: { [readStep.id]: { prompt: { base: 'Bonjour' }, body: { base: translatedBody(readStep.body.base) } } } },
    });
    expect(issues).toEqual([]);
  });

  it('rejects what does not exist', async () => {
    const issues = await checkModuleOverlay('fr', firstModule.id, {
      'no-such-lesson': {},
      [firstLesson.id]: { steps: { 'no-such-step': { prompt: { base: 'x' } } } },
    });
    expect(issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([`no such lesson in ${firstModule.id}`, 'no such step']),
    );
    const choice = await checkModuleOverlay('fr', checkLesson.moduleId, {
      [checkLesson.id]: { steps: { [checkStep.id]: { choices: { nope: { text: { base: 'x' } } } } } },
    });
    expect(choice.map((issue) => issue.message)).toContain('no such choice');
    expect(checkCourseOverlay('fr', { modules: { m99: { title: 'x' } } })[0]?.message).toBe('no such module');
    expect(checkGlossaryOverlay('fr', { nope: { term: 'x' } })[0]?.message).toBe('no such term');
  });

  it('rejects fields that do not fit the step, empty text and broken code spans', async () => {
    const issues = await checkModuleOverlay('fr', firstModule.id, {
      [firstLesson.id]: { steps: { [readStep.id]: { choices: {}, points: { base: [] }, prompt: { base: ' ' }, hint: { base: 'oops `code' } } } },
    });
    const messages = issues.map((issue) => issue.message);
    expect(messages).toContain('only check steps have choices');
    expect(messages).toContain('only recap steps have points');
    expect(messages).toContain('is empty');
  });

  it('rejects a translation that changes code', async () => {
    const withFence = FULL_COURSE.flatMap((lesson) =>
      lesson.steps
        .filter((step): step is ReadStep => step.kind === 'read' && step.body.base.includes('```'))
        .map((step) => ({ lesson, step })),
    )[0]!;
    const issues = await checkModuleOverlay('fr', withFence.lesson.moduleId, {
      [withFence.lesson.id]: { steps: { [withFence.step.id]: { body: { base: 'Texte sans le code.' } } } },
    });
    expect(issues.map((issue) => issue.message)).toContain('changes or drops a code block (code is never translated)');
  });

  it('runs translated predict code, and needs it to print the answer', async () => {
    const good = await checkModuleOverlay('fr', predictLesson.moduleId, {
      [predictLesson.id]: { steps: { [predictStep.id]: { predict: { code: 'console.log("Bonjour");', answer: 'Bonjour' } } } },
    });
    expect(good).toEqual([]);
    const bad = await checkModuleOverlay('fr', predictLesson.moduleId, {
      [predictLesson.id]: { steps: { [predictStep.id]: { predict: { code: 'console.log("Bonjour");', answer: 'Salut' } } } },
    });
    expect(bad[0]?.message).toMatch(/prints "Bonjour", not the answer "Salut"/);
  }, 30_000);

  it('finds nothing wrong with the translations in the repository', async () => {
    expect(await validateTranslations()).toEqual([]);
  }, 60_000);

  it('reports coverage per language', () => {
    for (const coverage of translationCoverage()) {
      expect(coverage.translated).toBeLessThanOrEqual(coverage.total);
    }
  });
});

/** A "translation" of a body that keeps its code blocks, as a translator must. */
function translatedBody(english: string): string {
  const fences = english.match(/```[\s\S]*?```/g) ?? [];
  return ['Texte traduit.', ...fences].join('\n\n');
}

describe('the test pseudo-language', () => {
  it('is visibly different and longer, but keeps code, placeholders and Markdown', () => {
    const text = 'Use `let` for **values** that change, like {count} items:\n\n```ts\nlet total = 0;\n```';
    const result = pseudo(text);
    expect(result).not.toBe(text);
    expect(result.length).toBeGreaterThan(text.length);
    expect(result).toContain('`let`');
    expect(result).toContain('{count}');
    expect(result).toContain('**');
    expect(result).toContain('```ts\nlet total = 0;\n```');
  });

  it('transforms a whole catalogue, plural forms included, without losing a key', () => {
    const catalogue = pseudoCatalogue(en);
    expect(Object.keys(catalogue)).toEqual(Object.keys(en));
    expect(catalogue.practice.stepsReady.one).toContain('{count}');
    expect(catalogue.nav.journey).not.toBe(en.nav.journey);
  });

  it('makes an overlay that passes the same checks as a real translation', async () => {
    for (const module of MODULES) {
      const lessons = FULL_COURSE.filter((lesson) => lesson.moduleId === module.id);
      expect(await checkModuleOverlay('fr', module.id, pseudoModule(lessons))).toEqual([]);
    }
  }, 120_000);
});
