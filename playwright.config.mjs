import { defineConfig, devices } from '@playwright/test'

/** GP monorepo UI smoke tests — requires demo hub + Vite apps (or reuseExistingServer). */
export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.mjs',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'qa-logs/playwright-report.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'gp-service', testMatch: /service\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:5173' } },
    { name: 'gp-partner', testMatch: /partner\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:5174' } },
    { name: 'gp-admin', testMatch: /admin\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:5175' } },
    { name: 'gp-flows', testMatch: /flows\.spec\.mjs/, use: { baseURL: 'http://127.0.0.1:5173' } },
  ],
  webServer: {
    command: 'npm run qa:e2e:servers',
    url: 'http://127.0.0.1:5175/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
