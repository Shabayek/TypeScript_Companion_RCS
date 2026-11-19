import { expect, test } from '@playwright/test';
import { fullLesson as getLesson } from '../src/content/fullCourse';
import type { PlayStep } from '../src/content/schema';
import { DRAFTS_KEY } from '../src/storage/types';
import { learner, seed, start } from './helpers';

/**
 * Studio projects end in a game that runs the learner's own code, compiled
 * and sandboxed like any other run.
 */
test.use({ serviceWorkers: 'block' });

const quiz = getLesson('m07-l01-quiz-game');
if (!quiz) throw new Error('no quiz lesson');
const playIndex = quiz.steps.findIndex((step) => step.kind === 'play');
const play = quiz.steps[playIndex] as PlayStep;

test("the quiz game is scored by the learner's own scoreAnswer", async ({ page }) => {
  // The learner's (solved) version gives 5 points instead of 10.
  const mine = 'function scoreAnswer(isCorrect: boolean, current: number): number {\n  return isCorrect ? current + 5 : current;\n}';
  await seed(page, learner(0, (state) => {
    state.lessons[quiz.id] = {
      status: 'started',
      stepIndex: playIndex,
      timeMs: 1,
      steps: { score: { solved: true, practiced: false, attempts: 1, revealed: false } },
    };
  }));
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [DRAFTS_KEY, JSON.stringify({ [`${quiz.id}:score`]: mine })] as const);
  await start(page, `#/learn/${quiz.id}`);

  await expect(page.getByText(/This game runs your code from step 2/)).toBeVisible();
  if (play.game.type !== 'quiz') throw new Error('not a quiz');
  for (const question of play.game.questions) {
    const right = (question.choices[question.answer] ?? '').replace(/`/g, '');
    await page.getByRole('button', { name: right, exact: true }).click();
    await page.getByRole('button', { name: /Next question|See my score/ }).click();
  }
  const screen = page.locator('output[aria-label="Your score"]');
  await expect(screen).toContainText('Final score: 20 points, 100%', { timeout: 30_000 });
  await page.getByText('See the code that runs the game').click();
  await expect(page.getByText('current + 5').first()).toBeVisible();
});

test('the budget tracker updates as expenses are added', async ({ page }) => {
  const budget = getLesson('m07-l02-budget');
  if (!budget) throw new Error('no budget lesson');
  await seed(page, learner(0, (state) => {
    state.lessons[budget.id] = { status: 'started', stepIndex: budget.steps.findIndex((step) => step.kind === 'play'), timeMs: 1, steps: {} };
  }));
  await start(page, `#/learn/${budget.id}`);
  const screen = page.locator('output[aria-label="Your budget"]');
  await expect(screen).toContainText('Left to spend: 20', { timeout: 30_000 });
  await page.getByRole('button', { name: '+ book (8)' }).click();
  await page.getByLabel('Bought').fill('cinema');
  await page.getByLabel('Cost').fill('15');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(screen).toContainText('Over budget by 3!');
});

test('the robot maze runs the planned moves through the learner’s step and isOpen', async ({ page }) => {
  const maze = getLesson('m07-l04-robot-maze');
  if (!maze) throw new Error('no maze lesson');
  await seed(page, learner(0, (state) => {
    state.lessons[maze.id] = { status: 'started', stepIndex: maze.steps.findIndex((step) => step.kind === 'play'), timeMs: 1, steps: {} };
  }));
  await start(page, `#/learn/${maze.id}`);
  await expect(page.getByRole('img', { name: 'The maze. The robot is in column 2, row 2.' })).toBeVisible();
  await page.getByRole('button', { name: 'Up', exact: true }).click();
  for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: 'Right', exact: true }).click();
  await page.getByRole('button', { name: 'Run the robot' }).click();
  const report = page.locator('output[aria-label="What the robot reports"]');
  await expect(report).toContainText('Bump! There is a wall up.', { timeout: 30_000 });
  await expect(report).toContainText('Star reached in 5 moves!');
  await expect(page.getByRole('img', { name: 'The maze. The robot is in column 6, row 2.' })).toBeVisible();
});

test('the pet reacts to care, through the learner’s care and mood', async ({ page }) => {
  const pet = getLesson('m07-l05-pet-keeper');
  if (!pet) throw new Error('no pet lesson');
  await seed(page, learner(0, (state) => {
    state.lessons[pet.id] = { status: 'started', stepIndex: pet.steps.findIndex((step) => step.kind === 'play'), timeMs: 1, steps: {} };
  }));
  await start(page, `#/learn/${pet.id}`);
  await expect(page.getByText('Pip · feels happy')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel('Hunger')).toHaveAttribute('value', '30');
  await page.getByRole('button', { name: 'Feed' }).click();
  await expect(page.getByLabel('Hunger')).toHaveAttribute('value', '0');
  await expect(page.locator('output[aria-label="Pet diary"]')).toContainText('Pip munches an apple and feels happy.');
  for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByText(/Pip · feels (sleepy|hungry)/)).toBeVisible();
});

async function openPlay(page: import('@playwright/test').Page, id: string) {
  const lesson = getLesson(id);
  if (!lesson) throw new Error(`no lesson ${id}`);
  await seed(page, learner(0, (state) => {
    state.lessons[lesson.id] = { status: 'started', stepIndex: lesson.steps.findIndex((step) => step.kind === 'play'), timeMs: 1, steps: {} };
  }));
  await start(page, `#/learn/${lesson.id}`);
}

test('the to-do list is whatever the learner’s reducer returns', async ({ page }) => {
  await openPlay(page, 'm15-l01-todo-reducer');
  await expect(page.locator('output[aria-label="Summary"]')).toContainText('Nothing to do!', { timeout: 30_000 });
  await page.getByRole('button', { name: '+ Water the plants' }).click();
  await page.getByLabel('New to-do').fill('Feed the cat');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Feed the cat' })).toBeVisible();
  // The list is what the reducer returns, so the tick appears once the program has run.
  await page.getByRole('checkbox', { name: 'Water the plants' }).click();
  await expect(page.getByRole('checkbox', { name: 'Water the plants' })).toBeChecked();
  await expect(page.locator('output[aria-label="Summary"]')).toContainText('1 of 2 done');
  await page.getByRole('button', { name: 'Clear finished' }).click();
  await expect(page.getByRole('checkbox', { name: 'Water the plants' })).toHaveCount(0);
  await expect(page.locator('output[aria-label="Summary"]')).toContainText('0 of 1 done');
});

test('the battle is fought with the learner’s effectiveness and attack', async ({ page }) => {
  await openPlay(page, 'm15-l03-battle');
  await expect(page.getByLabel('Rival')).toHaveAttribute('value', '60', { timeout: 30_000 });
  await page.getByRole('button', { name: 'fire', exact: true }).click();
  // Fire on leaf is super effective: 12 × 2 = 24 damage.
  await expect(page.getByLabel('Rival')).toHaveAttribute('value', '36');
  await expect(page.locator('output[aria-label="Battle log"]')).toContainText('You use fire! It is super effective!');
  for (let i = 0; i < 2; i += 1) await page.getByRole('button', { name: 'fire', exact: true }).click();
  await expect(page.locator('output[aria-label="Battle log"]')).toContainText('You win!');
  await expect(page.getByRole('button', { name: 'fire', exact: true })).toBeDisabled();
});

test('the adventure understands commands through the learner’s parse and go', async ({ page }) => {
  await openPlay(page, 'm19-l04-text-adventure');
  const story = page.getByLabel('The story so far');
  await expect(story).toContainText('A dusty hall', { timeout: 30_000 });
  await page.getByLabel('What do you do?').fill('go north');
  await page.getByRole('button', { name: 'Do it' }).click();
  await expect(story).toContainText('== Library ==');
  await page.getByRole('button', { name: 'take golden key' }).click();
  await expect(story).toContainText('You take the golden key.');
  await page.getByLabel('What do you do?').fill('dance');
  await page.getByRole('button', { name: 'Do it' }).click();
  await expect(story).toContainText('I do not understand that.');
  for (const command of ['go south', 'go east']) await page.getByRole('button', { name: command, exact: true }).click();
  await expect(story).toContainText('You found the treasure!');
});
