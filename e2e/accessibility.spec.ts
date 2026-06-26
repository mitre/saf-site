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

// Representative routes: the home (home layout) plus static doc-layout pages.
const PAGES = ['/', '/privacy-policy', '/framework/validate']

for (const path of PAGES) {
  test(`${path} exposes the landmarks and headings a screen reader needs`, async ({ page }) => {
    await page.goto(path)

    // A main landmark so AT users can skip straight to content.
    await expect(page.getByRole('main')).toBeVisible()

    // Site navigation is reachable as a landmark.
    await expect(page.getByRole('navigation').first()).toBeVisible()

    // The page exposes a heading to anchor the document outline.
    await expect(page.getByRole('heading').first()).toBeVisible()
  })
}

test('home page navigation links have accessible names', async ({ page }) => {
  await page.goto('/')

  // Every link in the accessibility tree must have a non-empty accessible name,
  // otherwise a screen reader announces it as an unlabeled "link".
  const linkNames = await page.getByRole('navigation').first().getByRole('link').allInnerTexts()
  expect(linkNames.length).toBeGreaterThan(0)
  for (const name of linkNames)
    expect(name.trim().length).toBeGreaterThan(0)
})
