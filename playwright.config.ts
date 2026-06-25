import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for real-browser accessibility checks.
 *
 * Unlike the vitest + axe component tests (which run in happy-dom), these load
 * the site in a real headless Chromium so we can inspect the *accessibility
 * tree* — the roles, names, and landmark structure that a screen reader
 * navigates. Run with `pnpm test:e2e` (the dev server is started automatically,
 * or reused if one is already running on :5173).
 *
 * Requires Pocketbase to be running, since the dev server's data loaders query
 * it at startup (see README "Development").
 */
const PORT = 5173
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium's own sandbox collides with restrictive outer sandboxes
        // (containers / seccomp). These keep it from crashing in those envs.
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        },
      },
    },
  ],
  webServer: {
    command: 'pnpm exec vitepress dev docs --port 5173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
