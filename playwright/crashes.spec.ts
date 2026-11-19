import { expect, test } from '@playwright/test';
import { learner, seed, start, stored } from './helpers';

test.use({ serviceWorkers: 'block' });

const EDITOR_CHUNK = /(TryItPanel|CodeExercise)-[\w-]+\.js$/;

test('a failed editor download stays inside the panel, and Reload recovers (B2, B3)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await seed(page, learner(2));

  await page.route(EDITOR_CHUNK, (route) => route.abort());
  await start(page, '#/playground');

  await expect(page.getByText('The code editor didn’t load')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nothing here is graded' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByText('Something came loose here')).toHaveCount(0);

  await page.unroute(EDITOR_CHUNK);
  await page.getByRole('button', { name: 'Reload the app' }).click();
  await expect(page.locator('.cm-content')).toBeVisible();

  const saved = await stored(page);
  expect(saved.profile.onboarded).toBe(true);
  expect(Object.keys(saved.lessons)).toHaveLength(2);
  expect(errors).toEqual([]);
});

test("errors in the learner's own code are not reported as app errors (B3)", async ({ page }) => {
  await seed(page, learner());
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { seenErrors: string[] }).seenErrors = seen;
    window.addEventListener('error', (event) => seen.push(event.message));
  });
  await start(page, '#/playground');
  await expect(page.locator('.cm-content')).toBeVisible();

  for (const code of ['throw new Error("boom")', 'setTimeout(() => { throw new Error("late") }, 0);']) {
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(code);
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  }

  expect(await page.evaluate(() => (window as unknown as { seenErrors: string[] }).seenErrors)).toEqual([]);
  await expect(page.locator('.toast')).toHaveCount(0);
});
