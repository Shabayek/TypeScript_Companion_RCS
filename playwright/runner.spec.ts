import { expect, test, type Page } from '@playwright/test';
import { firstCodeStep, learner, lesson, seed, start, typeCode } from './helpers';

test.use({ serviceWorkers: 'block' });

const output = (page: Page) => page.locator('.result-logs pre');
const panel = (page: Page) => page.locator('.result-panel');

async function run(page: Page, code: string, button = 'Run') {
  await typeCode(page, code);
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(page.getByRole('button', { name: button, exact: true })).toBeEnabled({ timeout: 30_000 });
}

test('a graded exercise accepts its reference solution (B5)', async ({ page }) => {
  const { lessonIndex, stepIndex, step } = firstCodeStep();
  const target = lesson(lessonIndex);
  await seed(page, learner(lessonIndex));
  await start(page, `#/learn/${target.id}`);
  for (let i = 0; i < stepIndex; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();

  await run(page, step.solution, 'Run checks');

  await expect(panel(page)).toContainText('✓');
  await expect(panel(page)).not.toContainText('is not defined');
  for (const check of step.tests) await expect(panel(page)).toContainText(check.name);
});

test.describe('playground', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, learner());
    await start(page, '#/playground');
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('caps a flood of output instead of freezing (B8)', async ({ page }) => {
    const started = Date.now();
    await run(page, 'for (let i = 0; i < 300000; i++) console.log("line " + i);');
    expect(Date.now() - started).toBeLessThan(6000);
    await expect(panel(page)).toContainText('cut off after 1,000 lines');
    expect((await output(page).innerText()).split('\n')).toHaveLength(1000);
  });

  test('stops a loop that never ends and shows what it printed (B8)', async ({ page }) => {
    await run(page, 'let i = 0;\nwhile (true) { console.log("count", i); }');
    await expect(panel(page)).toContainText('Stopped after 2 seconds');
    await expect(output(page)).toContainText('count 0');
  });

  test('shows asynchronous output in the order JavaScript runs it (B15)', async ({ page }) => {
    await run(
      page,
      'console.log("one");\nPromise.resolve("three").then(v => console.log(v));\nconsole.log("two");\nsetTimeout(() => console.log("four"), 50);',
    );
    await expect(output(page)).toHaveText('one\ntwo\nthree\nfour');
  });

  test('runs export and top-level await, and explains what it cannot run (B15)', async ({ page }) => {
    await run(page, 'export const x = 1;\nconsole.log("x is", x);');
    await expect(output(page)).toHaveText('x is 1');

    await run(page, 'const y = await Promise.resolve(2);\nconsole.log("y is", y);');
    await expect(output(page)).toHaveText('y is 2');

    await run(page, 'import { readFile } from "fs";\nreadFile("a");');
    await expect(panel(page)).toContainText('"fs" cannot be imported here');

    await run(page, 'export const z = await Promise.resolve(3);');
    await expect(panel(page)).toContainText('cannot be mixed here');
  });

  test('does not blame the code when the compiler cannot load, and recovers (B6)', async ({ page, context }) => {
    await context.route(/\.wasm$/, (route) => route.abort());
    await run(page, 'console.log("Hello");');
    await expect(panel(page)).toContainText('not a problem with your code');
    await expect(panel(page)).not.toContainText('syntax');

    await context.unroute(/\.wasm$/);
    await run(page, 'console.log("Hello");');
    await expect(output(page)).toHaveText('Hello');
  });
});

test('learner code cannot reach the runner to fake a passing grade (R1)', async ({ page }) => {
  const { lessonIndex, stepIndex, step } = firstCodeStep();
  await seed(page, learner(lessonIndex));
  await start(page, `#/learn/${lesson(lessonIndex).id}`);
  for (let i = 0; i < stepIndex; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();

  const fake = '{ type: "done", results: [{ name: "x", pass: true, got: "", expected: "" }], error: null, notes: [] }';
  for (const attempt of [
    `postMessage(${fake});`,
    `__tscPost(${fake});`,
    '__tscSame = () => true;',
    'self.__tscBoot(() => async () => ({ __tscChecks: [] }));',
  ]) {
    await run(page, `${attempt}\n${step.solution}`, 'Run checks');
    await expect(panel(page), attempt).toContainText(/ReferenceError|TypeError/);
    await expect(panel(page), attempt).not.toContainText('✓');
  }
});

test('the runner works under the shipped CSP, which no longer allows eval (R6)', async ({ page }) => {
  const cspReports: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) cspReports.push(message.text());
  });
  await seed(page, learner());
  await start(page, '#/playground');
  await expect(page.locator('.cm-content')).toBeVisible();

  await run(page, 'const n: number = 21;\nconsole.log(n * 2);');
  await expect(output(page)).toHaveText('42');
  expect(cspReports).toEqual([]);

  // Learner code that calls eval gets a clear error, not a silent failure.
  await run(page, 'console.log(eval("1 + 1"));');
  await expect(panel(page)).toContainText('EvalError');
});

test('the learner’s code survives Back, Next and a reload (E8)', async ({ page }) => {
  const { lessonIndex, stepIndex } = firstCodeStep();
  await seed(page, learner(lessonIndex));
  await start(page, `#/learn/${lesson(lessonIndex).id}`);
  for (let i = 0; i < stepIndex; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();

  await typeCode(page, 'const mine = "half done";');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.cm-content')).toHaveText('const mine = "half done";');

  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.locator('.cm-content')).toHaveText('const mine = "half done";');
  await expect(page.getByText(/Your code from last time is back/)).toBeVisible();
});

test('curly quotes from a phone keyboard still run, with an explanation (E2)', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/playground');
  await expect(page.locator('.cm-content')).toBeVisible();
  await run(page, 'console.log(“hello”);');
  await expect(output(page)).toHaveText('hello');
  await expect(panel(page)).toContainText('curly quotes');
});

test('the first mistake gets plain words, with the exact message underneath (E1)', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/playground');
  await expect(page.locator('.cm-content')).toBeVisible();
  await run(page, 'const greeting = Hello, world;\nconsole.log(greeting);');
  await expect(panel(page)).toContainText('put the whole text in quotes');
  await expect(panel(page)).toContainText('The compiler said: The constant "world" must be initialized');
});

test('TypeScript checks types: passing checks with a type mistake is not solved (type checking)', async ({ page }) => {
  const { FULL_COURSE: ALL_LESSONS } = await import('../src/content/fullCourse');
  const index = ALL_LESSONS.findIndex((item) => item.steps.some((step) => step.id === 'fix-type'));
  const target = lesson(index);
  const stepIndex = target.steps.findIndex((step) => step.id === 'fix-type');
  await seed(page, learner(index));
  await start(page, `#/learn/${target.id}`);
  for (let i = 0; i < stepIndex; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.getByRole('button', { name: 'Run checks' }).click();
  await expect(page.getByRole('button', { name: 'Run checks' })).toBeEnabled({ timeout: 30_000 });
  await expect(panel(page)).toContainText('The checks pass, but TypeScript found a type problem.');
  await expect(panel(page)).toContainText("Type 'string' is not assignable to type 'number'.");

  await run(page, 'const age: number = 36;\nconsole.log(age);', 'Run checks');
  await expect(panel(page)).toContainText('✓');
  await expect(panel(page)).not.toContainText('TypeScript');
});

test('the Playground runs the code and reports what TypeScript noticed (type checking)', async ({ page }) => {
  await seed(page, learner());
  await start(page, '#/playground');
  await expect(page.locator('.cm-content')).toBeVisible();
  await run(page, 'function add(a: number, b: number) { return a + b; }\nconsole.log(add(2, "3"));');
  await expect(output(page)).toHaveText('23');
  await expect(panel(page)).toContainText('It ran — but TypeScript found a type problem.');
  await expect(panel(page)).toContainText('The value passed in is string, but the function expects number. (line 2)');
});
