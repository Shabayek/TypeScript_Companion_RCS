import { requiredSteps } from '../src/content/schema';
import { expect, test } from '@playwright/test';
import { FULL_COURSE } from '../src/content/fullCourse';
import { firstCodeStep, learner, lesson, seed, start, stored, typeCode } from './helpers';

test.use({ serviceWorkers: 'block' });

const next = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Next', exact: true });

/**
 * A lesson, start to finish, with sounds on: answers are counted as learning
 * today, the summary shows the points, and nothing errors along the way.
 */
test('a lesson counts towards today, and ends with its points', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await seed(page, learner(0, (state) => {
    state.settings.sound = true;
  }));
  const first = lesson(0);
  await start(page, `#/learn/${first.id}`);
  await expect(page.getByRole('region', { name: 'In this lesson' })).toBeVisible();

  const check = page.getByRole('button', { name: 'Check answer' });
  while (!(await check.isVisible())) await next(page).click();
  const options = page.locator('button.option');
  for (let i = 0; i < (await options.count()); i += 1) {
    await options.nth(i).click();
    await check.click();
    const retry = page.getByRole('button', { name: 'Try again' });
    if (!(await retry.isVisible())) break;
    await retry.click();
  }
  while (await next(page).isVisible()) await next(page).click();
  await page.getByRole('button', { name: 'Finish lesson' }).click();

  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible();
  await expect(page.getByText(/^\+\d+ XP$/)).toBeVisible();
  await expect.poll(async () => Object.values((await stored(page)).activity).reduce((sum, day) => sum + day.steps, 0)).toBeGreaterThan(0);
  expect((await stored(page)).badges).toContain('first-steps');
  expect(errors).toEqual([]);
});

test('Ctrl+Enter runs the checks from inside the code editor', async ({ page }) => {
  const code = firstCodeStep();
  await seed(page, learner(code.lessonIndex, (state) => {
    state.lessons[lesson(code.lessonIndex).id] = { status: 'started', stepIndex: code.stepIndex, steps: {}, timeMs: 1 };
  }));
  await start(page, `#/learn/${lesson(code.lessonIndex).id}`);
  await typeCode(page, code.step.solution);
  const lines = await page.locator('.cm-line').count();
  await page.keyboard.press('Control+Enter');
  // The checks ran (the result appears), and no blank line was added.
  await expect(page.getByRole('button', { name: 'Checking…' })).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText('That works. Every check agrees.')).toBeVisible({ timeout: 30_000 });
  expect(await page.locator('.cm-line').count()).toBe(lines);
});

test('Pro shortcuts move through a lesson, but never while typing', async ({ page }) => {
  const target = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'predict'))!;
  const index = FULL_COURSE.indexOf(target);
  const predictAt = target.steps.findIndex((step) => step.kind === 'predict');
  await seed(page, learner(index, (state) => {
    state.settings.mode = 'pro';
  }));
  await start(page, `#/learn/${target.id}`);
  await expect(page.getByText(`Step 1 of ${requiredSteps(target.steps).length}`)).toBeVisible();
  for (let i = 0; i < predictAt; i += 1) {
    await page.keyboard.press('j');
    await expect(page.getByText(`Step ${i + 2} of ${requiredSteps(target.steps).length}`)).toBeVisible();
  }
  await expect(page.getByText(`Step ${predictAt + 1} of ${requiredSteps(target.steps).length}`)).toBeVisible();
  // Typing "j" into the answer box types it, and stays on the step.
  const box = page.getByRole('textbox').first();
  await box.click();
  await page.keyboard.type('jk');
  await expect(box).toHaveValue(/jk/);
  await expect(page.getByText(`Step ${predictAt + 1} of ${requiredSteps(target.steps).length}`)).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('k');
  await expect(page.getByText(`Step ${predictAt} of ${requiredSteps(target.steps).length}`)).toBeVisible();
});
