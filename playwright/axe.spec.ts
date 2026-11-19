import { requiredSteps } from '../src/content/schema';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { completed, firstCodeStep, learner, lesson, seed, start, typeCode } from './helpers';

/**
 * Automated accessibility audit (axe-core) of the main screens and the states
 * learners actually see — answered exercises, result panels, dialogs, earned
 * badges — in both themes. Any serious or critical violation fails the test.
 * Contrast, names and ARIA are covered; keyboard and screen-reader use still
 * need the manual checklist in docs/offline.md.
 */

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// The strict CSP (correctly) blocks injected scripts; the audit needs axe.
test.use({ serviceWorkers: 'block', bypassCSP: true, actionTimeout: 10_000 });

interface Finding {
  id: string;
  impact: string | null;
  where: string;
  example: string;
}

async function audit(page: Page, where: string, findings: Finding[]): Promise<void> {
  await page.waitForTimeout(250); // let transitions settle before measuring contrast
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document) => Promise<{ violations: { id: string; impact: string | null; nodes: { target: string[]; failureSummary?: string }[] }[] }> } }).axe;
    return (await axe.run(document)).violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      example: `${violation.nodes[0]?.target.join(' ')} — ${violation.nodes[0]?.failureSummary?.split('\n')[1]?.trim() ?? ''}`,
    }));
  });
  for (const violation of violations) findings.push({ ...violation, where });
}

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true });

for (const theme of ['light', 'dark'] as const) {
  test(`no serious accessibility violations (${theme} theme)`, async ({ page }) => {
    test.setTimeout(480_000);
    const findings: Finding[] = [];
    const withTheme = (state: ReturnType<typeof learner>) => {
      state.settings.theme = theme;
      return state;
    };

    // First run: onboarding, and the gate.
    const fresh = learner();
    fresh.profile.onboarded = false;
    await seed(page, withTheme(fresh));
    await start(page, '#/');
    await audit(page, 'onboarding gate', findings);
    await start(page, '#/onboarding');
    await audit(page, 'onboarding: welcome', findings);
    await page.getByRole('button', { name: /Let.s start/ }).click();
    await audit(page, 'onboarding: mode', findings);
    await page.getByRole('button', { name: /That.s me/ }).click();
    await audit(page, 'onboarding: experience', findings);
    await page.getByRole('radio', { name: /some JavaScript/ }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await audit(page, 'onboarding: name and starting point', findings);

    // A learner part-way through: locked lessons, earned badges.
    await seed(page, withTheme(learner(6)));
    for (const route of ['#/', '#/progress', '#/settings', '#/glossary', '#/cheatsheet', '#/decoder', '#/about', '#/playground', '#/arena', '#/arena/pick', '#/no-such-page']) {
      await start(page, route);
      await audit(page, route, findings);
    }
    await start(page, `#/learn/${lesson(10).id}`);
    await audit(page, 'locked lesson', findings);
    await start(page, '#/module/m01');
    await audit(page, 'module page', findings);
    await start(page, '#/module/m04');
    await audit(page, 'module page (locked)', findings);

    // The journey in each reading mode, and with every lesson unlocked.
    for (const mode of ['story', 'pro'] as const) {
      await seed(page, withTheme(learner(6, (state) => {
        state.settings.mode = mode;
      })));
      await start(page, '#/');
      await audit(page, `home (${mode})`, findings);
    }
    await seed(page, withTheme(learner(6, (state) => {
      state.settings.unlockAll = true;
    })));
    await start(page, '#/');
    await page.getByRole('button', { name: 'Collections', exact: true }).click();
    await audit(page, 'home, all unlocked, a second module open', findings);
    await start(page, `#/learn/${lesson(12).id}`);
    await audit(page, 'lesson ahead of the path (builds-on note)', findings);
    await start(page, '#/settings');
    await page.getByRole('switch', { name: 'Unlock all lessons' }).click();
    await page.getByRole('switch', { name: 'Unlock all lessons' }).click();
    await audit(page, 'unlock dialog', findings);
    await seed(page, withTheme(learner(6)));

    // Practice: the Home card, the overview, a session and an answer.
    const practised = lesson(0);
    const practiceStep = practised.steps.find((step) => step.kind === 'check');
    await seed(page, withTheme(learner(1, (state) => {
      if (practiceStep) state.reviews[`${practised.id}:${practiceStep.id}`] = { box: 1, due: 1, reviews: 0, lapses: 0 };
    })));
    await start(page, '#/');
    await audit(page, 'home with practice due', findings);
    await start(page, '#/practice');
    await audit(page, 'practice overview', findings);
    await page.getByRole('button', { name: 'Start practice' }).click();
    await audit(page, 'practice session', findings);
    await page.locator('button.option').first().click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await audit(page, 'practice answered', findings);

    // Dialogs and expanded reference entries.
    await start(page, '#/settings');
    await page.getByRole('button', { name: 'Reset all progress' }).click();
    await audit(page, 'reset dialog', findings);
    await start(page, '#/');
    await page.getByRole('button', { name: 'Jump to…' }).click();
    await page.getByRole('combobox').fill('array');
    await audit(page, 'command palette', findings);
    await start(page, '#/glossary');
    await page.locator('details summary').first().click();
    await audit(page, 'glossary entry open', findings);
    await start(page, '#/decoder');
    await page.getByRole('button', { name: 'Try one' }).first().click();
    await audit(page, 'decoder match', findings);
    await start(page, '#/progress');
    await page.getByText('Or paste the JSON instead').click();
    await page.getByLabel('Progress JSON').fill(JSON.stringify({ data: learner(2) }));
    await page.getByRole('button', { name: 'Restore this progress' }).click();
    await audit(page, 'import preview dialog', findings);

    // Exercises: answered wrong, then right, and the lesson-complete screen.
    const first = lesson(0);
    await seed(page, withTheme(learner()));
    await start(page, `#/learn/${first.id}`);
    const check = page.getByRole('button', { name: 'Check answer' });
    while (!(await check.isVisible())) await next(page).click();
    const options = page.locator('button.option');
    for (let i = 0; i < (await options.count()); i += 1) {
      await options.nth(i).click();
      await check.click();
      await audit(page, `check exercise answered (option ${i + 1})`, findings);
      const retry = page.getByRole('button', { name: 'Try again' });
      if (!(await retry.isVisible())) break;
      await retry.click();
    }
    const hint = page.getByRole('button', { name: 'Hint', exact: true });
    if (await hint.isVisible()) {
      await hint.click();
      await audit(page, 'hint panel', findings);
    }
    while (await next(page).isVisible()) await next(page).click();
    await page.getByRole('button', { name: 'Finish lesson' }).click();
    await audit(page, 'lesson complete', findings);

    // Motivation: the rhythm on Progress with a week of learning, a badge
    // celebrated in a toast, Quiet mode, and the Pro shortcuts list.
    await seed(page, withTheme(learner(4, (state) => {
      const today = new Date();
      for (let back = 0; back < 6; back += 1) {
        const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back, 12);
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        state.activity[key] = { ms: (4 + back * 3) * 60_000, steps: 2 };
      }
      state.counters.glossaryOpens = 6;
    })));
    await start(page, '#/progress');
    await audit(page, 'progress: rhythm, week and badge shelf', findings);
    await start(page, '#/');
    await audit(page, 'home with the Today card', findings);
    await start(page, '#/playground');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText('Badge earned: Tinkerer')).toBeVisible({ timeout: 30_000 });
    await audit(page, 'celebration toast', findings);
    await seed(page, withTheme(learner(4, (state) => {
      state.settings.quiet = true;
      state.settings.mode = 'pro';
    })));
    await start(page, '#/');
    await audit(page, 'home in Quiet mode', findings);
    await start(page, `#/learn/${lesson(4).id}`);
    await expect(page.getByText(`Step 1 of ${requiredSteps(lesson(4).steps).length}`)).toBeVisible();
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await audit(page, 'keyboard shortcuts dialog', findings);

    // A code exercise with a failing, then a passing, result.
    const code = firstCodeStep();
    await seed(page, withTheme(learner(code.lessonIndex)));
    await start(page, `#/learn/${lesson(code.lessonIndex).id}`);
    for (let i = 0; i < code.stepIndex; i += 1) await next(page).click();
    await page.getByRole('button', { name: 'Run checks' }).click();
    await expect(page.getByRole('button', { name: 'Run checks' })).toBeEnabled({ timeout: 30_000 });
    await audit(page, 'code exercise: failing result', findings);
    await typeCode(page, code.step.solution);
    await page.getByRole('button', { name: 'Run checks' }).click();
    await expect(page.getByRole('button', { name: 'Run checks' })).toBeEnabled({ timeout: 30_000 });
    await audit(page, 'code exercise: passing result', findings);

    // Phase 4: predict-the-type answered, "See types" on, a bonus type
    // challenge with its type tests and compiler flags, a Classic alternative.
    const at = (id: string) => ALL_LESSONS.findIndex((item) => item.id === id);
    const stepAt = (id: string, stepId: string) => ALL_LESSONS[at(id)]!.steps.findIndex((step) => step.id === stepId);
    await seed(page, withTheme(learner(at('m05-l02-unions-narrowing'), (state) => {
      state.lessons['m05-l02-unions-narrowing'] = { status: 'started', stepIndex: stepAt('m05-l02-unions-narrowing', 'narrowed'), timeMs: 1, steps: {} };
    })));
    await start(page, '#/learn/m05-l02-unions-narrowing');
    await page.getByLabel('The type of rest:').fill('number | string');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(page.getByText('Exactly right')).toBeVisible({ timeout: 30_000 });
    const typed = page.locator('.codeblock').first();
    await typed.getByRole('button', { name: 'See types' }).click();
    await typed.locator('button.codeblock__name').first().click();
    await expect(typed.getByRole('status')).toContainText(':', { timeout: 30_000 });
    await audit(page, 'predict the type, answered, with types shown', findings);
    for (const id of ['m05-l04-generics', 'm05-l03-optional-unknown']) {
      const withBonus = ALL_LESSONS[at(id)]!;
      await seed(page, withTheme(learner(at(id), (state) => {
        state.lessons[id] = { status: 'started', stepIndex: requiredSteps(withBonus.steps).length - 1, timeMs: 1, steps: {} };
      })));
      await start(page, `#/learn/${id}`);
      await page.getByRole('button', { name: 'Finish lesson' }).click();
      await audit(page, `lesson summary offering a bonus (${id})`, findings);
      await page.getByRole('button', { name: 'Try the bonus step' }).click();
      await expect(page.locator('.cm-content')).toBeVisible({ timeout: 30_000 });
      await audit(page, `bonus step (${id})`, findings);
    }
    await seed(page, withTheme(learner(at('m03-l01-arrays'), (state) => {
      state.settings.engine = 'classic';
      state.lessons['m03-l01-arrays'] = { status: 'started', stepIndex: stepAt('m03-l01-arrays', 'last'), timeMs: 1, steps: {} };
    })));
    await start(page, '#/learn/m03-l01-arrays');
    await expect(page.getByText('Classic version for this device')).toBeVisible();
    await audit(page, 'classic alternative', findings);

    // Studio games: a quiz question answered, and the budget tracker with an entry.
    for (const id of ['m07-l01-quiz-game', 'm07-l02-budget', 'm07-l04-robot-maze', 'm07-l05-pet-keeper', 'm15-l01-todo-reducer', 'm15-l03-battle', 'm19-l04-text-adventure']) {
      const project = ALL_LESSONS.find((item) => item.id === id);
      if (!project) continue;
      await seed(page, withTheme(learner(0, (state) => {
        state.lessons[project.id] = { status: 'started', stepIndex: project.steps.findIndex((step) => step.kind === 'play'), timeMs: 1, steps: {} };
      })));
      await start(page, `#/learn/${project.id}`);
      if (id === 'm07-l01-quiz-game') await page.locator('button.option').first().click();
      else if (id === 'm07-l04-robot-maze') {
        await page.getByRole('button', { name: 'Right', exact: true }).click();
        await page.getByRole('button', { name: 'Run the robot' }).click();
        await expect(page.locator('output[aria-label="What the robot reports"]')).toContainText('robot', { timeout: 30_000 });
      } else if (id === 'm07-l05-pet-keeper') {
        await page.getByRole('button', { name: 'Feed' }).click();
        await expect(page.locator('output[aria-label="Pet diary"]')).toContainText('apple', { timeout: 30_000 });
      } else if (id === 'm15-l01-todo-reducer') {
        await page.getByRole('button', { name: '+ Water the plants' }).click();
        await expect(page.getByRole('checkbox', { name: 'Water the plants' })).toBeVisible({ timeout: 30_000 });
        // The list is what the reducer returns, so the tick appears after the program ran.
        await page.getByRole('checkbox', { name: 'Water the plants' }).click();
        await expect(page.getByRole('checkbox', { name: 'Water the plants' })).toBeChecked({ timeout: 30_000 });
      } else if (id === 'm15-l03-battle') {
        await page.getByRole('button', { name: 'water', exact: true }).click();
        await expect(page.locator('output[aria-label="Battle log"]')).toContainText('You use water', { timeout: 30_000 });
      } else if (id === 'm19-l04-text-adventure') {
        await page.getByRole('button', { name: 'go north', exact: true }).click();
        await expect(page.getByLabel('The story so far')).toContainText('Library', { timeout: 30_000 });
      } else {
        await page.getByRole('button', { name: /^\+ / }).first().click();
        await expect(page.locator('output').first()).toContainText('Spent', { timeout: 30_000 });
      }
      await audit(page, `game ${id}`, findings);
    }

    // Course complete: the certificate.
    await seed(
      page,
      withTheme(
        learner(0, (state) => {
          for (const item of ALL_LESSONS) state.lessons[item.id] = completed();
          state.badges = ['first-steps', 'course-complete'];
        }),
      ),
    );
    await start(page, '#/progress');
    await audit(page, 'certificate', findings);

    const serious = findings.filter((finding) => finding.impact === 'serious' || finding.impact === 'critical');
    const report = serious.map((finding) => `${finding.where}: ${finding.id} (${finding.impact}) at ${finding.example}`);
    expect(report, report.join('\n')).toEqual([]);
  });
}

/**
 * The same audit in other languages: Arabic (right to left, its own font) and
 * German (the longest words), over the main screens, the language dialog and
 * an answered exercise.
 */
for (const language of ['ar', 'de'] as const) {
  test(`no serious accessibility violations in ${language}`, async ({ page }) => {
    test.setTimeout(180_000);
    const findings: Finding[] = [];
    await seed(page, learner(6, (state) => {
      state.settings.language = language;
      state.activity[new Date().toISOString().slice(0, 10)] = { ms: 300_000, steps: 3 };
    }));
    for (const route of ['#/', '#/progress', '#/settings', '#/practice', '#/module/m01', '#/playground', '#/glossary', '#/about']) {
      await start(page, route);
      await audit(page, `${language} ${route}`, findings);
    }
    await start(page, '#/');
    await page.locator('header button[aria-haspopup="dialog"]').last().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, `${language} language dialog`, findings);

    const first = lesson(0);
    await seed(page, learner(0, (state) => {
      state.settings.language = language;
    }));
    await start(page, `#/learn/${first.id}`);
    const check = page.locator('[data-shortcut="check"]').first();
    while (!(await check.isVisible())) await page.locator('footer button.btn--primary').click();
    await page.locator('button.option').first().click();
    await check.click();
    await audit(page, `${language} answered exercise`, findings);

    const serious = findings.filter((finding) => finding.impact === 'serious' || finding.impact === 'critical');
    const report = serious.map((finding) => `${finding.where}: ${finding.id} (${finding.impact}) at ${finding.example}`);
    expect(report, report.join('\n')).toEqual([]);
  });
}
