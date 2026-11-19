import { requiredSteps } from '../src/content/schema';
import { expect, test } from '@playwright/test';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { learner, lesson, seed, start } from './helpers';

test.use({ serviceWorkers: 'block' });

test('RESET can be typed in the reset dialog (B7)', async ({ page }) => {
  await seed(page, learner(2));
  await start(page, '#/settings');
  await page.getByRole('button', { name: 'Reset all progress' }).click();

  const box = page.getByLabel('Type RESET');
  await box.click();
  await page.keyboard.type('RESET', { delay: 30 });

  await expect(box).toHaveValue('RESET');
  await expect(box).toBeFocused();
  await page.getByRole('button', { name: 'Reset everything' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the skip link moves to the content without leaving the page (B13)', async ({ page }) => {
  const first = lesson(0);
  await seed(page, learner());
  await start(page, `#/learn/${first.id}`);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  await expect(page.locator('#main')).toBeFocused();
  expect(new URL(page.url()).hash).toBe(`#/learn/${first.id}`);
  await expect(page.getByText(`Step 1 of ${requiredSteps(first.steps).length}`)).toBeVisible();
});

test('back: home quietly, hint once, then leave (B14)', async ({ page }) => {
  const first = lesson(0);
  await seed(page, learner());
  await start(page, '#/');
  await page.getByRole('link', { name: 'Start lesson 1' }).click();
  await expect(page).toHaveURL(new RegExp(`#/learn/${first.id}$`));

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'One small step at a time.' })).toBeVisible();
  await expect(page.locator('.toast')).toHaveCount(0);

  await page.goBack();
  await expect(page.locator('.toast')).toContainText('Press back again to leave');

  await page.goBack();
  expect(new URL(page.url()).hash).not.toBe('#/');
});

test('reorder lines from the keyboard; focus follows the line (B16d)', async ({ page }) => {
  // The first lesson in the course with a reorder step.
  const index = ALL_LESSONS.findIndex((item) => item.steps.some((step) => step.kind === 'reorder'));
  const target = lesson(index);
  const stepIndex = target.steps.findIndex((step) => step.kind === 'reorder');
  await seed(page, learner(index));
  await start(page, `#/learn/${target.id}`);
  for (let i = 0; i < stepIndex; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();

  const lines = page.locator('ol[aria-label^="Lines of code"] > li');
  const moving = (await lines.nth(0).locator('code').innerText()).trim();
  await lines.nth(0).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');

  await expect(lines.nth(2).locator('code')).toHaveText(moving);
  await expect(lines.nth(2)).toBeFocused();
});

test('toasts sit above the bottom navigation and never block it (R5)', async ({ page, context }) => {
  await seed(page, learner());
  await start(page, '#/');
  await context.setOffline(true); // shows "You are offline…"
  const toast = page.locator('.toast');
  await expect(toast).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Main' });
  const toastBox = await toast.boundingBox();
  const navBox = await nav.boundingBox();
  expect(toastBox && navBox && toastBox.y + toastBox.height).toBeLessThanOrEqual(navBox?.y ?? 0);

  // A tap in the middle of the bar reaches the button under it.
  await nav.getByRole('link', { name: 'Progress' }).click({ timeout: 3000 });
  await expect(page.getByRole('heading', { name: 'The road so far' })).toBeVisible();
  await context.setOffline(false);
});
