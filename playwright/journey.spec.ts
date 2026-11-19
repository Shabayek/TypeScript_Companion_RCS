import { requiredSteps } from '../src/content/schema';
import { expect, test } from '@playwright/test';
import { MODULES } from '../src/content/curriculum';
import { FULL_COURSE } from '../src/content/fullCourse';
import { learner, seed, start, stored } from './helpers';

test.use({ serviceWorkers: 'block' });

/**
 * "Unlock all lessons", end to end: ask once, open anything, see what a lesson
 * builds on, keep going — and turning it off keeps what was started.
 */
test('unlocking every lesson, jumping ahead, and locking the path again', async ({ page }) => {
  await seed(page, learner(2));
  await start(page, '#/settings');

  await page.getByRole('switch', { name: 'Unlock all lessons' }).click();
  const dialog = page.getByRole('dialog', { name: 'Unlock every lesson?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Unlock all lessons' }).click();
  await expect(page.getByRole('switch', { name: 'Unlock all lessons' })).toHaveAttribute('aria-checked', 'true');

  // A module far ahead: its page offers to start it.
  const target = MODULES[5]!;
  await page.goto(`/#/module/${target.id}`);
  await page.getByRole('link', { name: 'Start the module' }).click();
  const lesson = FULL_COURSE.find((item) => item.id === target.lessonIds[0])!;
  await expect(page.getByRole('heading', { level: 1, name: lesson.title.explorer })).toBeVisible();
  await expect(page.getByText('This lesson builds on')).toBeVisible();
  await page.getByRole('button', { name: 'Continue anyway' }).click();
  await expect(page.getByText('This lesson builds on')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText(`Step 2 of ${requiredSteps(lesson.steps).length}`)).toBeVisible();

  // Home: the lesson in progress is what Continue opens.
  await page.goto('/#/');
  await expect(page.getByText('All lessons unlocked')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: lesson.title.explorer })).toBeVisible();

  // Lock the path again: the started lesson stays open, the rest locks.
  await page.goto('/#/settings');
  await page.getByRole('switch', { name: 'Unlock all lessons' }).click();
  await expect.poll(async () => (await stored(page)).settings.unlockAll).toBe(false);
  await page.goto(`/#/learn/${lesson.id}`);
  await expect(page.getByRole('heading', { level: 1, name: lesson.title.explorer })).toBeVisible();
  const other = FULL_COURSE.find((item) => item.id === target.lessonIds[1])!;
  await page.goto(`/#/learn/${other.id}`);
  await expect(page.getByRole('heading', { name: 'This one opens after the last one' })).toBeVisible();
});

for (const mode of ['story', 'explorer', 'pro'] as const) {
  test(`the journey and module pages fit a phone at every text size (${mode})`, async ({ page }) => {
    test.setTimeout(120_000);
    const viewport = page.viewportSize()!;
    const problems: string[] = [];
    for (const textSize of [3, 5] as const) {
      await seed(page, learner(6, (state) => {
        state.settings.mode = mode;
        state.settings.textSize = textSize;
        state.settings.unlockAll = true;
      }));
      for (const route of ['#/', ...MODULES.map((module) => `#/module/${module.id}`)]) {
        await start(page, route);
        // Open every module on the map, the longest the page can get.
        if (route === '#/') {
          const closed = page.locator('button[aria-expanded="false"]');
          while ((await closed.count()) > 0) await closed.first().click();
        }
        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        if (width > viewport.width + 1) problems.push(`${route} (text ${textSize}): ${width}px wide`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}
