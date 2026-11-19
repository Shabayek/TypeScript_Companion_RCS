import { requiredSteps } from '../src/content/schema';
import { expect, test } from '@playwright/test';
import { learner, lesson, seed, start, startedAt, stored } from './helpers';

test.use({ serviceWorkers: 'block' });

test('reloading on a lesson page keeps all progress and the step (B1)', async ({ page }) => {
  const current = lesson(3);
  await seed(page, learner(3, (state) => (state.lessons[current.id] = startedAt(3))));

  await start(page, `#/learn/${current.id}`);
  await expect(page.getByText(`Step 4 of ${requiredSteps(current.steps).length}`)).toBeVisible();
  await page.waitForTimeout(600); // longer than the save debounce
  await page.reload();

  await expect(page.getByText(`Step 4 of ${requiredSteps(current.steps).length}`)).toBeVisible();
  const saved = await stored(page);
  expect(saved.profile).toMatchObject({ name: 'Ada', onboarded: true });
  expect(Object.keys(saved.lessons)).toHaveLength(4);
});

test('an answer given just before the app is closed is kept (B10)', async ({ page, context }) => {
  const first = lesson(0);
  await seed(page, learner(0));
  await start(page, `#/learn/${first.id}`);

  const check = page.getByRole('button', { name: 'Check answer' });
  for (let i = 0; i < first.steps.length && !(await check.isVisible()); i += 1) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.locator('button.option').first().click();
  await check.click();
  await page.close({ runBeforeUnload: true }); // well inside the save debounce

  const reopened = await context.newPage();
  await reopened.goto('/');
  const steps = (await stored(reopened)).lessons[first.id]?.steps ?? {};
  expect(Object.values(steps).some((step) => step.attempts > 0)).toBe(true);
});

test('a second tab picks up progress made in the first (B10)', async ({ page, context }) => {
  const first = lesson(0);
  await seed(page, learner(0));
  await start(page, '#/');
  await expect(page.getByText(/0 of \d+ lessons/).first()).toBeVisible();

  const other = await context.newPage();
  await other.goto(`/#/learn/${first.id}`);
  for (let i = 0; i < first.steps.length - 1; i += 1) {
    await other.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await other.getByRole('button', { name: 'Finish lesson' }).click();

  await expect(page.getByText(/1 of \d+ lessons/).first()).toBeVisible();
});

test('an exported file restores the same progress on another device (R4)', async ({ page, browser }) => {
  await seed(page, learner(3));
  await start(page, '#/progress');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save a file' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^typescript-companion-progress-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.getByRole('status').filter({ hasText: 'was asked to save' })).toBeVisible();
  const file = await download.path();

  // A brand-new device: onboard, then import the file.
  const other = await browser.newContext({ serviceWorkers: 'block' });
  const device = await other.newPage();
  await seed(device, learner(0));
  await start(device, '#/progress');
  await device.getByLabel('Import a progress file').setInputFiles(file);
  await device.getByRole('button', { name: 'Replace my progress' }).click();

  expect(Object.values((await stored(device)).lessons).filter((item) => item.status === 'completed')).toHaveLength(3);
  await other.close();
});

test('importing an older file warns first, and can be undone after a restart (R2)', async ({ page }) => {
  await seed(page, learner(4));
  await start(page, '#/progress');
  const older = JSON.stringify({ app: 'typescript-companion', schemaVersion: 2, exportedAt: '2026-01-01T00:00:00.000Z', data: learner(1) });

  await page.getByText('Or paste the JSON instead').click();
  await page.getByLabel('Progress JSON').fill(older);
  await page.getByRole('button', { name: 'Restore this progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Replace your progress?' });
  await expect(dialog.getByText(/less progress than this device/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Replace my progress' }).click();
  expect(Object.keys((await stored(page)).lessons)).toHaveLength(1);

  await page.reload();
  await page.getByRole('button', { name: 'Undo the last import' }).click();
  expect(Object.keys((await stored(page)).lessons)).toHaveLength(4);
});
