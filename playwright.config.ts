import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for real-browser checks.
 *
 * Unlike the vitest + axe component tests (which run in happy-dom), these load
 * the site in real headless browsers. Both engines run the whole suite:
 *
 * - Chromium, because it is the dominant engine our readers use. (It is not
 *   required by the accessibility specs — those pass under WebKit too; they use
 *   engine-agnostic role queries.)
 * - WebKit, because Safari-only bugs are invisible to Chromium by construction.
 *   saf-site-vitepress-ckg was exactly that: VitePress sets `overflow-x: clip`
 *   on .VPNav, WebKit applies the clip to both axes, and the navbar dropdowns
 *   were unreachable in Safari while CI stayed green.
 *
 * Running WebKit lets e2e/navbar-dropdown.spec.ts assert that bug's *computed
 * CSS* on the engine that has it. It does NOT make the suite able to catch
 * Safari painting bugs generally: those specs read computed style and layout
 * boxes, never pixels, so a WebKit-only paint regression with correct computed
 * CSS would still pass. Screenshot diffing would be a separate undertaking.
 *
 * Run with `pnpm test:e2e` (the dev server is started automatically, or reused
 * if one is already running on :5173). NOTE: WebKit cannot launch in some
 * sandboxed dev environments (see the webkit project below), where
 * `pnpm test:e2e` therefore exits non-zero even though nothing is wrong with
 * the code. For a local pass in that situation, run a single engine:
 * `pnpm exec playwright test --project=chromium`.
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
      // runners.
      //
      // Known limitation: in some sandboxed dev environments WebKit launches
      // but page creation then fails with "Target page, context or browser has
      // been closed". Observed alongside two distinct denials, neither of which
      // has been isolated as the cause: a refused
      // 'com.apple.webkit.mach-bootstrap' sandbox extension, and EPERM creating
      // ~/Library/WebKit/org.webkit.Playwright/WebsiteData/*. The second may
      // well be grantable or relocatable, so this is not known to be
      // unfixable — it just has not been chased down. CI runs WebKit fine.
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
