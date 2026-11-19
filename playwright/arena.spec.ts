import { expect, test } from '@playwright/test';
import { ARENA } from '../src/content/arena';
import { learner, seed, start, stored, typeCode } from './helpers';

test.use({ serviceWorkers: 'block' });

test('the arena lists puzzles by level, and a solved puzzle is remembered', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/arena');
  await expect(page.getByRole('heading', { name: 'Type Challenges', level: 1 })).toBeVisible();
  await expect(page.getByTestId('arena-count')).toHaveText(`Solved: 0 of ${ARENA.length}`);
  for (const level of ['Warm-up', 'Medium', 'Hard', 'Extreme']) {
    await expect(page.getByRole('heading', { name: level, level: 2 })).toBeVisible();
  }

  const pick = ARENA.find((puzzle) => puzzle.id === 'pick')!;
  await page.getByRole('link', { name: /Pick/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Pick', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Check my types' }).click();
  await expect(page.locator('.result-panel')).toContainText('“one key”', { timeout: 30_000 });
  await typeCode(page, pick.solution);
  await page.getByRole('button', { name: 'Check my types' }).click();
  await expect(page.locator('.result-panel')).toContainText('✓ unknown keys are refused', { timeout: 30_000 });
  // Saved after a short pause.
  await expect.poll(async () => (await stored(page)).arena.pick?.solved).toBe(true);

  await page.getByRole('link', { name: 'Type Challenges' }).click();
  await expect(page.getByTestId('arena-count')).toHaveText(`Solved: 1 of ${ARENA.length}`);
});

test('the Playground has a gallery, compiler flags and types on tap', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/playground');
  await page.getByLabel('Gallery').selectOption({ label: 'A generic stack' });
  await expect(page.locator('.cm-content')).toContainText('class Stack<T>');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.result-logs pre')).toHaveText('red 1', { timeout: 30_000 });

  await page.getByLabel('Gallery').selectOption({ label: 'Word counter' });
  await page.getByText('Compiler flags').click();
  await page.getByRole('checkbox', { name: /noUncheckedIndexedAccess/ }).check();
  await expect(page.getByText('Compiler flags · 1 on')).toBeVisible();
  await typeCode(page, 'const scores: number[] = [1];\nconst first: number = scores[0];\nconsole.log(first);');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.locator('.result-panel')).toContainText("Type 'number | undefined' is not assignable to type 'number'", { timeout: 30_000 });

  await page.getByText('See the types in your code').click();
  const block = page.locator('details .codeblock');
  await block.getByRole('button', { name: 'See types' }).click();
  await block.locator('button.codeblock__name', { hasText: /^scores$/ }).first().click();
  await expect(block.getByRole('status')).toHaveText('const scores: number[]', { timeout: 30_000 });
});
