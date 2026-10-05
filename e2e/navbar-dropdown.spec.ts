import { expect, test } from '@playwright/test'

/**
 * Navbar dropdown clipping guard.
 *
 * VitePress sets `overflow-x: clip` on `.VPNav` (VPNav.vue). WebKit applies
 * that clip to the Y axis as well, so Safari cuts off the flyout menus, which
 * are positioned below the 64px-tall header — they flicker and never render.
 * Upstream: https://github.com/vuejs/vitepress/issues/5050, fixed upstream
 * (closed 2025-12-08) but after our pinned 2.0.0-alpha.15, so custom.css still
 * lifts the clip at the widths where it is not needed; these tests pin that
 * contract from both sides.
 *
 * NOTE ON COVERAGE: these run under both chromium and webkit (see
 * playwright.config.ts). Under Chromium they verify the CSS contract and the
 * no-horizontal-scroll property only — Chromium honours `overflow-y: visible`
 * and never reproduced the Safari symptom. Under WebKit the computed-style
 * assertions below do run on the engine that has the bug, so reverting the
 * custom.css fix would flip them. What NO engine here asserts is painting:
 * every assertion reads computed style or layout boxes, never pixels.
 */

// Below 960px `.VPNav` is `position: relative`, so its overflow extends the
// document's scroll area and the clip is load-bearing. At and above 960px
// upstream switches it to `position: fixed`, where overflow no longer
// contributes to document scroll — which is what makes lifting the clip safe.
const NARROW = [375, 640, 768, 850]
const WIDE = [960, 1024, 1180, 1280, 1440, 1920]

async function navOverflowX(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.VPNav')
    return nav ? getComputedStyle(nav).overflowX : null
  })
}

test.describe('navbar dropdown is not clipped by the nav', () => {
  for (const width of WIDE) {
    test(`does not clip the dropdown at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.waitForSelector('.VPNavBarMenu .VPFlyout')

      // The fix: no horizontal clip at widths where the nav is position:fixed.
      expect(await navOverflowX(page)).toBe('visible')
    })
  }

  for (const width of NARROW) {
    test(`preserves the upstream clip at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.waitForSelector('.VPNav')

      // Below 960px the clip still does real work; lifting it here would add a
      // document horizontal scrollbar.
      expect(await navOverflowX(page)).toBe('clip')
    })
  }

  for (const width of [...NARROW, ...WIDE]) {
    test(`no horizontal scrollbar at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.waitForSelector('.VPNav')

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, `document scrolls horizontally at ${width}px`).toBeLessThanOrEqual(clientWidth)
    })
  }

  test('the open dropdown opens and is laid out below the navbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')

    const flyout = page.locator('.VPNavBarMenu .VPFlyout', { hasText: 'Framework' }).first()
    await flyout.hover()

    // The menu fades in over 0.25s; wait for the transition to settle rather
    // than sampling mid-flight and reading the start-of-transition opacity.
    await page.waitForFunction(() => {
      const fly = [...document.querySelectorAll('.VPNavBarMenu .VPFlyout')]
        .find(f => f.textContent?.trim().startsWith('Framework'))
      const menu = fly?.querySelector('.menu')
      return !!menu && getComputedStyle(menu).opacity === '1'
    }, undefined, { timeout: 5000 })

    const geometry = await page.evaluate(() => {
      const fly = [...document.querySelectorAll('.VPNavBarMenu .VPFlyout')]
        .find(f => f.textContent?.trim().startsWith('Framework'))
      const menu = fly?.querySelector('.menu')
      const nav = document.querySelector('.VPNav')
      if (!menu || !nav)
        return null
      const style = getComputedStyle(menu)
      return {
        opacity: style.opacity,
        visibility: style.visibility,
        menuBottom: menu.getBoundingClientRect().bottom,
        navBottom: nav.getBoundingClientRect().bottom,
      }
    })

    expect(geometry).not.toBeNull()
    expect(geometry!.opacity).toBe('1')
    expect(geometry!.visibility).toBe('visible')
    // This asserts LAYOUT, not painting. getBoundingClientRect() reports the
    // layout box, which clipping does not affect, so this assertion does NOT
    // detect a reintroduced Y-axis clip — it still passes with the clip in
    // place (verified under Chromium across 20 observables, incl. hit-testing
    // and a screenshot hash). Its value is as a guard that the flyout still
    // opens and is positioned below the header. The overflow-x assertions
    // above are what pin the fix, and under the webkit project they do so on
    // the engine that actually has the bug.
    expect(
      geometry!.menuBottom,
      'dropdown should be laid out below the navbar',
    ).toBeGreaterThan(geometry!.navBottom)
  })
})
