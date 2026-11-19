import { expect, test } from '@playwright/test';
import { learner, seed, start } from './helpers';

/**
 * Phones hide { } ( ) ; = two keyboard pages deep. On touch screens a symbol
 * bar under the editor types them at the cursor, keeps the editor focused
 * (so the on-screen keyboard stays open) and sits at the bottom edge.
 */
test.use({ serviceWorkers: 'block' });

test('on a phone, the symbol bar types at the cursor and keeps the editor focused', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/playground');
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');

  const bar = page.getByRole('toolbar', { name: 'Symbols' });
  await expect(bar).toBeVisible();

  await page.keyboard.insertText('if (x > 1) ');
  await bar.getByRole('button', { name: 'Curly braces' }).tap();
  await bar.getByRole('button', { name: 'Round brackets' }).tap();
  await bar.getByRole('button', { name: 'Semicolon' }).tap();
  // Pairs put the cursor between them.
  await expect(editor).toHaveText('if (x > 1) {(;)}');
  await expect(editor).toBeFocused();

  // Cursor keys and undo work too.
  await bar.getByRole('button', { name: 'Move right' }).tap();
  await bar.getByRole('button', { name: 'Move right' }).tap();
  await bar.getByRole('button', { name: 'Semicolon' }).tap();
  await expect(editor).toHaveText('if (x > 1) {(;)};');
  await bar.getByRole('button', { name: 'Undo' }).tap();
  await expect(editor).toHaveText('if (x > 1) {(;)}');

  // While typing, the bar owns the bottom edge: nothing sits on top of it.
  const covered = await bar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return !element.contains(hit);
  });
  expect(covered).toBe(false);
});

test('there is no symbol bar with a mouse and a big screen', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, hasTouch: false, isMobile: false });
  const page = await context.newPage();
  await seed(page, learner());
  await start(page, '#/playground');
  await expect(page.locator('.cm-content')).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Symbols' })).toBeHidden();
  await context.close();
});
