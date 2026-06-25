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
})
