import { axe } from 'vitest-axe'

/**
 * Run axe-core against a single component rendered in isolation.
 *
 * Page-level structure rules assume a full document (a `<main>` landmark, a
 * top-level heading, etc.). A component mounted on its own legitimately has
 * none of those, so those rules are disabled here to avoid false positives.
 * Every other check — alt text, ARIA usage, names/roles, label association,
 * and so on — still runs.
 *
 * Usage:
 *   const results = await axeComponent(wrapper.element)
 *   expect(results).toHaveNoViolations()
 */
export function axeComponent(element: Element) {
  return axe(element, {
    rules: {
      'region': { enabled: false },
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
    },
  })
}
