import { expect, test } from '@playwright/test';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { MODULES } from '../src/content/curriculum';
import { TRACKS } from '../src/content/schema';
import { requiredSteps } from '../src/content/schema';
import { completed, learner, seed, start } from './helpers';

/**
 * Every step of every lesson, in every reading mode, on a phone (the
 * project's default device): the Next button is on screen and clickable
 * without scrolling, no code sample is cut off on the right, and the page is
 * never wider than the screen.
 */
test.use({ serviceWorkers: 'block' });

const trackOf = (moduleId: string) => MODULES.find((module) => module.id === moduleId)?.track;

for (const mode of ['explorer', 'story', 'pro'] as const) for (const track of TRACKS) {
  const lessons = ALL_LESSONS.filter((lesson) => trackOf(lesson.moduleId) === track);
  if (lessons.length === 0) continue;
  test(`on phones, Next is always reachable and nothing is cut off, in every lesson (${mode}, ${track})`, async ({ page }) => {
    test.setTimeout(300_000);
    await seed(page, learner(0, (state) => {
      state.settings.mode = mode;
      for (const lesson of ALL_LESSONS) state.lessons[lesson.id] = completed();
    }));
    const viewport = page.viewportSize();
    const problems: string[] = [];

    for (const lesson of lessons) {
      await start(page, `#/learn/${lesson.id}`);
      await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
      // The required steps, then (from the summary) any "Go further" steps.
      const required = requiredSteps(lesson.steps).length;
      for (let step = 0; step < lesson.steps.length; step += 1) {
        const where = `${lesson.id} step ${step + 1} (${lesson.steps[step]?.kind})`;
        await page.evaluate(() => window.scrollTo(0, 0));
        const next = page.locator('footer button.btn--primary');
        const box = await next.boundingBox();
        const onTop = await next.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('button') === button;
        });
        if (!box || !viewport || box.y + box.height > viewport.height || !onTop) problems.push(`${where}: Next not visible on first view`);

        const clipped = await page.locator('.codeblock pre').evaluateAll((blocks) =>
          blocks.filter((block) => block.scrollWidth > block.clientWidth + 1).length,
        );
        if (clipped > 0) problems.push(`${where}: ${clipped} code block(s) cut off`);

        // Nothing may make the page wider than the phone: the browser then
        // zooms the whole lesson out (fenced code in reading steps used to).
        const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        if (viewport && pageWidth > viewport.width + 1) problems.push(`${where}: page is ${pageWidth}px wide on a ${viewport.width}px screen`);

        if (step === required - 1 && lesson.steps.length > required) {
          await next.click();
          await page.getByRole('button', { name: /^Try (the bonus step|\d+ bonus steps)$/ }).click();
          await expect(page.getByText(/^Bonus 1 of \d+$/)).toBeVisible();
        } else if (step < lesson.steps.length - 1) await next.click();
      }
    }

    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('the bottom navigation is back outside lessons', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});
