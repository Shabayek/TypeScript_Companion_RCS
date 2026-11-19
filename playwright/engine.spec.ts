import { expect, test, type Page } from '@playwright/test';
import { FULL_COURSE } from '../src/content/fullCourse';
import { requiredSteps } from '../src/content/schema';
import { learner, seed, start, startedAt, typeCode } from './helpers';

test.use({ serviceWorkers: 'block' });

/*
 * Phase 4 in a real browser: the Modern and Classic device modes, the new
 * exercise kinds graded by TypeScript's checker in its worker, bonus steps,
 * and tap-to-see-type.
 */

const position = (id: string) => FULL_COURSE.findIndex((lesson) => lesson.id === id);
const lessonById = (id: string) => FULL_COURSE[position(id)]!;
const stepIndex = (id: string, stepId: string) => lessonById(id).steps.findIndex((step) => step.id === stepId);

async function openStep(page: Page, lessonId: string, stepId: string, engine: 'auto' | 'classic' = 'auto') {
  await seed(
    page,
    learner(position(lessonId), (state) => {
      state.settings.engine = engine;
      state.lessons[lessonId] = startedAt(stepIndex(lessonId, stepId));
    }),
  );
  await start(page, `#/learn/${lessonId}`);
}

const panel = (page: Page) => page.locator('.result-panel');

test.describe('Modern (this browser)', () => {
  test('a step for newer phones runs as written, tagged', async ({ page }) => {
    await openStep(page, 'm03-l01-arrays', 'last');
    await expect(page.getByText('Newer phones', { exact: true })).toBeVisible();
    await expect(page.locator('pre').first()).toContainText('queue.at(-1)');
    await page.getByLabel('What will this print?').fill('Ada\nCy');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByText('Exactly right')).toBeVisible();
  });

  test('predict the type is judged by the real checker: any spelling of the same type', async ({ page }) => {
    await openStep(page, 'm05-l02-unions-narrowing', 'narrowed');
    const input = page.getByLabel('The type of rest:');
    await input.fill('boolean');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByText('That is a different type.', { exact: false })).toBeVisible({ timeout: 30_000 });
    await input.fill('number|string');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByText('Exactly right')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('TypeScript writes it as')).toBeVisible();
  });

  test('tap a name to see its type', async ({ page }) => {
    await openStep(page, 'm05-l02-unions-narrowing', 'predict');
    const block = page.locator('.codeblock').first();
    await block.getByRole('button', { name: 'See types' }).click();
    await expect(block.getByRole('status')).toHaveText('Tap a name in the code to see its type.', { timeout: 30_000 });
    await block.locator('button.codeblock__name', { hasText: /^value$/ }).first().click();
    await expect(block.getByRole('status')).toHaveText('(parameter) value: string | number');
  });

  test('a finished lesson offers its bonus type challenge, graded by type tests', async ({ page }) => {
    const lesson = lessonById('m05-l04-generics');
    const recap = requiredSteps(lesson.steps).length - 1;
    await seed(page, learner(position(lesson.id), (state) => {
      state.lessons[lesson.id] = startedAt(recap);
    }));
    await start(page, `#/learn/${lesson.id}`);
    await page.getByRole('button', { name: 'Finish lesson' }).click();
    await page.getByRole('button', { name: 'Try the bonus step' }).click();
    await expect(page.getByText('Go further · optional')).toBeVisible();
    await expect(page.getByText('Bonus 1 of 1')).toBeVisible();

    await page.getByRole('button', { name: 'Check my types' }).click();
    await expect(panel(page)).toContainText('“a box of numbers holds a number”: the type is not the one this check expects yet.', {
      timeout: 30_000,
    });
    const box = lesson.steps.find((step) => step.id === 'box');
    if (box?.kind !== 'types') throw new Error('no type challenge');
    await typeCode(page, box.solution);
    await page.getByRole('button', { name: 'Check my types' }).click();
    await expect(panel(page)).toContainText('✓ a box is never empty', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('button', { name: 'Try the bonus step' })).toBeVisible();
  });

  test('compiler flags for a step are shown and used', async ({ page }) => {
    const lesson = lessonById('m05-l03-optional-unknown');
    await seed(page, learner(position(lesson.id), (state) => {
      state.lessons[lesson.id] = startedAt(requiredSteps(lesson.steps).length - 1);
    }));
    await start(page, `#/learn/${lesson.id}`);
    await page.getByRole('button', { name: 'Finish lesson' }).click();
    await page.getByRole('button', { name: 'Try the bonus step' }).click();
    await expect(page.getByTestId('compiler-flags')).toContainText('noUncheckedIndexedAccess: true');
    // The starter compiles without the flag; with it, TypeScript objects.
    await page.getByRole('button', { name: 'Run checks' }).click();
    await expect(panel(page)).toContainText("'first' is possibly 'undefined'", { timeout: 30_000 });
  });
});

test.describe('Classic (forced in Settings)', () => {
  test('Settings offers the choice, and lessons show the Classic alternative', async ({ page }) => {
    await seed(page, learner(position('m03-l01-arrays'), (state) => {
      state.lessons['m03-l01-arrays'] = startedAt(stepIndex('m03-l01-arrays', 'last'));
    }));
    await start(page, '#/settings');
    const group = page.getByRole('radiogroup', { name: 'Device engine' });
    await expect(page.getByTestId('engine-status')).toContainText('This device runs modern JavaScript');
    await group.getByRole('radio', { name: 'Classic' }).click();
    await expect(page.getByTestId('engine-status')).toContainText('Classic is on');

    await page.goto('/#/learn/m03-l01-arrays');
    await expect(page.getByText('Classic version for this device')).toBeVisible();
    await expect(page.locator('pre').first()).toContainText('queue[queue.length - 1]');
    await expect(page.locator('pre').first()).not.toContainText('.at(');
    await page.getByLabel('What will this print?').fill('Ada\nCy');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByText('Exactly right')).toBeVisible();
  });

  test('the Playground runs like an older phone, and says why a new feature is missing', async ({ page }) => {
    await seed(page, learner(0, (state) => {
      state.settings.engine = 'classic';
    }));
    await start(page, '#/playground');
    await expect(page.locator('.cm-content')).toBeVisible();
    await typeCode(page, 'const xs = [1, 2, 3];\nconsole.log(xs.at(-1));');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(panel(page)).toContainText('"at" is newer JavaScript than this device mode runs', { timeout: 30_000 });
    await expect(panel(page)).toContainText('The classic way: items[items.length - 1]');
  });
});
