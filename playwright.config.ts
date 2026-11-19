import { defineConfig, devices } from '@playwright/test';

/**
 * Browser regression suite for the production bundle (service worker, strict
 * CSP, real workers). Build first: `npm run build && npm run test:e2e`.
 *
 * Uses Playwright's own Chromium (`npx playwright install chromium`). Where
 * that download is not possible, point CHROMIUM_PATH at any recent Chromium or
 * Chrome binary instead.
 */
const chromiumPath = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: './playwright',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 7'],
        ...(chromiumPath
          ? { launchOptions: { executablePath: chromiumPath, args: ['--no-sandbox', '--no-zygote'] } }
          : {}),
      },
    },
  ],
  webServer: {
    // Run `npm run build` first: the suite is about the production bundle,
    // including the service worker and the strict CSP.
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
