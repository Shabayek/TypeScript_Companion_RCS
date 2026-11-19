import { requiredSteps } from '../src/content/schema';
import { expect, test } from '@playwright/test';

/**
 * The promise of this app, tested end to end: do a lesson, pull the network
 * cable, reload, and find every answer exactly where it was left.
 */
test('progress survives a reload with the network off', async ({ page, context }) => {
  const failed: string[] = [];
  page.on('requestfailed', (request) => {
    failed.push(`${request.method()} ${request.url()}`);
  });

  await page.goto('/');

  // First run: the onboarding gate appears before the journey.
  await page.getByRole('link', { name: 'Set up the course' }).click();
  await page.getByRole('button', { name: /Let.s start/ }).click();
  await page.getByRole('button', { name: /That.s me/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Name (optional)').fill('Offline tester');
  await page.getByRole('button', { name: 'Start learning' }).click();

  await expect(page.getByRole('heading', { name: /One small step at a time/ })).toBeVisible();
  await page.getByRole('link', { name: 'Start lesson 1' }).click();

  // Walk the whole first lesson. The player deliberately never blocks the
  // Next button: an attempt is enough to keep moving.
  const finish = page.getByRole('button', { name: 'Finish lesson' });
  let finished = false;
  for (let step = 0; step < 12; step += 1) {
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      finished = true;
      break;
    }
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  expect(finished).toBe(true);
  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible();

  // Wait until the service worker controls the page and has precached the
  // production assets. After this point the network is optional.
  // `ready` resolves once a worker has installed (precache complete) and is
  // active. The old check was an async predicate, which waitForFunction
  // treats as truthy at once (a Promise is an object), so it only worked
  // while the install happened to be quick.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  // Reload while still on the lesson page. This used to queue a save of the
  // empty default state that overwrote the real progress a moment later.
  await page.reload();
  await page.goto('/#/progress');
  // Start the app again so the checks below read what is actually on disk,
  // not what the previous run still held in memory.
  await page.reload();

  await expect(page.getByRole('heading', { name: 'The road so far' })).toBeVisible();
  // Every badge is listed on the shelf; this one must be marked as earned.
  await expect(page.locator('[data-earned="true"]', { hasText: 'First steps' })).toBeVisible();
  // The stat renders as "1" followed by "/32" (the lesson count) in one element.
  await expect(page.getByText(/^1\/\d+$/).first()).toBeVisible();

  await page.goto('/#/');
  await expect(page.getByText(/1 of \d+ lessons/).first()).toBeVisible();

  expect(failed).toEqual([]);
});

/**
 * Lesson content is split per module and downloaded when a lesson opens. The
 * service worker must have precached every module, so a lesson from a module
 * this device has never opened still works with the network off.
 */
test('a lesson from a module never opened before still opens offline', async ({ page, context }) => {
  const failed: string[] = [];
  page.on('requestfailed', (request) => {
    failed.push(`${request.method()} ${request.url()}`);
  });

  const { FULL_COURSE } = await import('../src/content/fullCourse');
  const { learner, seed } = await import('./helpers');
  // Everything but the last lesson is done, so Home warms only the last
  // module. The target is a finished lesson in a different, unopened module.
  const last = FULL_COURSE[FULL_COURSE.length - 1]!;
  const target = FULL_COURSE.find((item) => item.moduleId !== last.moduleId && item.moduleId !== FULL_COURSE[0]!.moduleId)!;
  await seed(page, learner(FULL_COURSE.length - 1));
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  await page.reload();
  await page.goto(`/#/learn/${target.id}`);
  await expect(page.getByRole('heading', { level: 1, name: target.title.explorer })).toBeVisible();
  await expect(page.getByText(`Step 1 of ${requiredSteps(target.steps).length}`)).toBeVisible();

  expect(failed).toEqual([]);
});
