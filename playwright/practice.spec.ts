import { expect, test } from '@playwright/test';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import type { CheckStep } from '../src/content/schema';
import { completed, learner, seed, start, stored } from './helpers';

/**
 * Spaced practice, end to end on a phone: answering in a lesson makes a card,
 * a due card shows on Home, and practising it moves it along and is saved.
 */
test.use({ serviceWorkers: 'block' });

const first = ALL_LESSONS[0];
if (!first) throw new Error('no lessons');
const checkIndex = first.steps.findIndex((step) => step.kind === 'check' && !step.multi);
const check = first.steps[checkIndex] as CheckStep;
const right = check.choices.find((choice) => choice.correct);
if (!right) throw new Error('no right choice');
const rightText = right.text.base.replace(/[`*]/g, '');

test('answering in a lesson schedules the step for practice', async ({ page }) => {
  await seed(page, learner());
  await start(page, `#/learn/${first.id}`);
  for (let i = 0; i < checkIndex; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: rightText }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('That’s right')).toBeVisible();

  await expect.poll(async () => (await stored(page)).reviews?.[`${first.id}:${check.id}`]?.box).toBe(2);
});

test('a due step shows on Home, and practising it is saved', async ({ page }) => {
  await seed(page, learner(1, (state) => {
    state.lessons[first.id] = completed();
    state.reviews[`${first.id}:${check.id}`] = { box: 1, due: 1, reviews: 0, lapses: 0 };
  }));
  await start(page, '#/');
  await expect(page.getByRole('heading', { name: '1 step ready to practise' })).toBeVisible();
  await page.getByRole('link', { name: 'Practise now' }).click();

  await expect(page.getByRole('heading', { level: 1, name: '1 step ready to practise' })).toBeVisible();
  // A focused screen, like a lesson: no bottom navigation.
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start practice' }).click();

  await page.getByRole('button', { name: rightText }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText(/^Remembered\./)).toBeVisible();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice done' })).toBeVisible();

  await expect.poll(async () => (await stored(page)).reviews?.[`${first.id}:${check.id}`]?.box).toBe(2);
  const card = (await stored(page)).reviews[`${first.id}:${check.id}`];
  expect(card?.due).toBeGreaterThan(Date.now());

  await page.getByRole('link', { name: 'Back to the journey' }).click();
  await expect(page.getByRole('heading', { name: '1 step ready to practise' })).toHaveCount(0);
});
