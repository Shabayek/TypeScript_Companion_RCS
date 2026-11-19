import { requiredSteps } from '../src/content/schema';
import { expect, test } from '@playwright/test';
import { FULL_COURSE } from '../src/content/fullCourse';
import { learner, seed, start } from './helpers';

test.use({ serviceWorkers: 'block' });

const LANGUAGES = ['en', 'fr', 'de', 'lb', 'it', 'pt-PT', 'ar'] as const;

/**
 * The promise of Phase 3, in a real browser: switching language mid-exercise
 * keeps the page, the step and the answer being given.
 */
test('switching language from the top bar keeps the exercise exactly where it was', async ({ page }) => {
  const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'check' && !step.multi))!;
  const index = lesson.steps.findIndex((step) => step.kind === 'check' && !step.multi);
  const position = FULL_COURSE.indexOf(lesson);
  await seed(page, learner(position, (state) => {
    state.lessons[lesson.id] = { status: 'started', stepIndex: index, steps: {}, timeMs: 1 };
  }));
  await start(page, `#/learn/${lesson.id}`);
  await expect(page.getByText(`Step ${index + 1} of ${requiredSteps(lesson.steps).length}`)).toBeVisible();
  const option = page.locator('button.option').nth(1);
  await option.click();
  await expect(option).toHaveAttribute('aria-pressed', 'true');
  const url = page.url();

  await page.getByRole('button', { name: /Language:/ }).click();
  await page.getByRole('dialog', { name: 'Choose a language' }).getByRole('radio', { name: /^Français/ }).click();

  await expect(page.getByRole('button', { name: 'Vérifier la réponse' })).toBeVisible();
  await expect(page.getByText(`Étape ${index + 1} sur ${requiredSteps(lesson.steps).length}`)).toBeVisible();
  await expect(option).toHaveAttribute('aria-pressed', 'true');
  expect(page.url()).toBe(url);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  // The answer still checks, in the new language.
  await page.getByRole('button', { name: 'Vérifier la réponse' }).click();
  await expect(page.locator('.callout, [class*="feedback"]').first()).toBeVisible();
});

test('a French learner reads the lesson itself in French', async ({ page }) => {
  const lesson = FULL_COURSE[0]!;
  await seed(page, learner(0, (state) => {
    state.settings.language = 'fr';
    state.settings.mode = 'story';
  }));
  await start(page, `#/learn/${lesson.id}`);
  await expect(page.getByRole('heading', { level: 1, name: /C’est quoi, un programme/ })).toBeVisible();
  await expect(page.getByText(/comme une recette pour un robot/).first()).toBeVisible();
  // French text in a French screen: nothing is marked as another language.
  expect(await page.locator('main [lang="en"]').count()).toBe(0);

  // The reference pages follow the language too.
  await start(page, '#/cheatsheet');
  await expect(page.getByRole('heading', { name: 'Valeurs et noms' })).toBeVisible();
});

test('Arabic reads right to left, with code left to right and its own font', async ({ page }) => {
  const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'predict'))!;
  const index = lesson.steps.findIndex((step) => step.kind === 'predict');
  await seed(page, learner(FULL_COURSE.indexOf(lesson), (state) => {
    state.settings.language = 'ar';
    state.lessons[lesson.id] = { status: 'started', stepIndex: index, steps: {}, timeMs: 1 };
  }));
  await start(page, `#/learn/${lesson.id}`);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('button', { name: 'افحص' })).toBeVisible();

  // The page is mirrored, the code is not.
  expect(await page.evaluate(() => getComputedStyle(document.body).direction)).toBe('rtl');
  const codeDirections = await page.locator('pre').evaluateAll((blocks) => blocks.map((block) => getComputedStyle(block).direction));
  expect(codeDirections.length).toBeGreaterThan(0);
  expect(new Set(codeDirections)).toEqual(new Set(['ltr']));

  // Arabic text is drawn with the bundled Arabic font (no network, no system fallback).
  await page.evaluate(() => document.fonts.ready);
  const arabicFont = await page.evaluate(() => document.fonts.check('16px "Noto Sans Arabic Variable"', 'افحص'));
  expect(arabicFont).toBe(true);

  // Numbers stay Western, to match the code.
  await expect(page.getByText(new RegExp(`الخطوة ${index + 1} من ${requiredSteps(lesson.steps).length}`))).toBeVisible();
});

test.describe('device language', () => {
  test.use({ locale: 'fr-BE' });

  test('a Belgian French device is greeted in French on first launch', async ({ page }) => {
    await page.goto('/#/onboarding');
    await expect(page.getByRole('heading', { name: 'Bonjour. Je suis Tess.' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });
});

for (const language of LANGUAGES) {
  test(`every main screen fits a phone in ${language}, at normal and largest text`, async ({ page }) => {
    test.setTimeout(120_000);
    const viewport = page.viewportSize()!;
    const problems: string[] = [];
    const lesson = FULL_COURSE[5]!;
    for (const textSize of [3, 5] as const) {
      await seed(page, learner(6, (state) => {
        state.settings.language = language;
        state.settings.textSize = textSize;
        state.activity[new Date().toISOString().slice(0, 10)] = { ms: 300_000, steps: 3 };
      }));
      for (const route of ['#/', '#/settings', '#/progress', '#/practice', '#/module/m01', `#/learn/${lesson.id}`, '#/playground', '#/about']) {
        await start(page, route);
        await page.waitForTimeout(150);
        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        if (width > viewport.width + 1) problems.push(`${route} (text ${textSize}): ${width}px wide`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('the dyslexia-friendly font really applies', async ({ page }) => {
  await seed(page, learner(0, (state) => {
    state.settings.font = 'dyslexia';
  }));
  await start(page, '#/');
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/^"?Atkinson Hyperlegible/);
});
