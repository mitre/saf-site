import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for real-browser checks.
 *
 * Unlike the vitest + axe component tests (which run in happy-dom), these load
 * the site in real headless browsers, for two reasons:
 *
 * - Chromium, to inspect the *accessibility tree* — the roles, names, and
 *   landmark structure that a screen reader navigates.
 * - WebKit, because Safari-only rendering bugs are invisible to Chromium by
 *   construction. saf-site-vitepress-ckg was exactly that: VitePress sets
 *   `overflow-x: clip` on .VPNav, WebKit applies the clip to both axes, and the
 *   navbar dropdowns were unreachable in Safari while CI stayed green. WebKit
 *   here is what makes e2e/navbar-dropdown.spec.ts able to catch that class of
 *   bug rather than merely describe it.
 *
 * Run with `pnpm test:e2e` (the dev server is started automatically, or reused
 * if one is already running on :5173), or a single engine with
 * `pnpm exec playwright test --project=webkit`.
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
    {
      // The engine that actually exhibits Safari rendering bugs. No launch
      // args: WebKit has no equivalent sandbox flags, and needs none on CI
      // runners. Note it cannot be run from the local dev sandbox — WebKit
      // launches but its WebContent XPC helper is blocked, so page creation
      // dies. CI is where this project earns its keep.
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    // --strictPort so the server fails fast instead of silently moving to
    // another port (which would no longer match baseURL).
    command: 'pnpm exec vitepress dev docs --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
