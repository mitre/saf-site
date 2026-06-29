import { expect, test } from '@playwright/test'

/**
 * Real-browser accessibility-tree checks.
 *
 * Playwright's role queries resolve against the browser's accessibility tree —
 * the same semantic model (landmarks, headings, accessible names) that a screen
 * reader exposes. These assert the structure AT relies on to navigate, which
 * axe rule-checking alone doesn't guarantee. This is the automated proxy for a
 * screen-reader pass; a real VoiceOver/NVDA review still belongs to the manual
 * conformance step (saf-site-vitepress-rrz).
 */

// Home (home layout, main landmark added in index.md) plus static doc pages.
const PAGES = ['/', '/privacy-policy', '/framework/validate']

for (const path of PAGES) {
  test(`${path} exposes the landmarks and headings a screen reader needs`, async ({ page }) => {
    await page.goto(path)

    // A main landmark lets AT users skip straight to content.
    await expect(page.getByRole('main')).toBeVisible()

    // Site navigation is reachable as a landmark.
    await expect(page.getByRole('navigation').first()).toBeVisible()

    // The page exposes a heading to anchor the document outline.
    await expect(page.getByRole('heading').first()).toBeVisible()
  })
}

test('home page navigation links have accessible names', async ({ page }) => {
  await page.goto('/')

  const links = page.getByRole('navigation').first().getByRole('link')
  // Wait for the nav to hydrate before counting, otherwise an early 0-count
  // makes the assertion flaky.
  await expect(links.first()).toBeVisible()

  // Every link must have a non-empty *accessible name*, otherwise a screen
  // reader announces it as an unlabeled "link". Assert against the computed
  // accessible name (covers aria-label/aria-labelledby), not just inner text.
  const count = await links.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++)
    await expect(links.nth(i)).toHaveAccessibleName(/\S/)
})
