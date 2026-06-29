import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axeComponent } from '../test-utils/axe'
import PillarBadge from './PillarBadge.vue'

/**
 * Accessibility smoke test using axe-core (via vitest-axe).
 *
 * This is the reference example for the project's automated a11y checks: render a
 * component to real DOM and assert axe finds no WCAG violations. Add a sibling
 * `*.a11y.spec.ts` for other components as accessibility coverage grows. Runs as
 * part of `pnpm test:run`, which `pnpm ci:check` executes — so a regression fails CI.
 *
 * Note: color-contrast checks require layout that the happy-dom test environment
 * does not compute, so axe reports them as "incomplete" rather than violations;
 * contrast is verified separately (see saf-site-vitepress-q92).
 */
describe('pillarBadge accessibility', () => {
  it('has no axe-detectable violations when rendered with a label', async () => {
    const wrapper = mount(PillarBadge, {
      props: { pillar: 'validate', showLabel: true },
    })

    const results = await axeComponent(wrapper.element)

    expect(results).toHaveNoViolations()
  })

  it('marks the icon as decorative (aria-hidden)', () => {
    const wrapper = mount(PillarBadge, {
      props: { pillar: 'harden', showLabel: true },
    })

    // The visible "Harden" text names the badge; the icon must not be announced.
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('exposes an accessible name when icon-only (showLabel=false)', async () => {
    const wrapper = mount(PillarBadge, {
      props: { pillar: 'validate', showLabel: false },
    })

    // No visible text, so the badge itself must carry the name for assistive tech.
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Validate')

    const results = await axeComponent(wrapper.element)
    expect(results).toHaveNoViolations()
  })
})
