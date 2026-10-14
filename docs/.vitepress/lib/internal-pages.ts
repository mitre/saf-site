/**
 * Pages that exist for the maintainer but must never ship.
 *
 * `docs/internal/**` holds tooling pages — currently the printable slick sheet
 * — that are useful to open locally but must not become routes on
 * saf.mitre.org, appear in the search index, or land in `dist/` at all.
 *
 * VitePress routes every markdown file under `srcDir` unless `srcExclude`
 * matches it, so keeping a page unpublished is a positive act of configuration,
 * not a side effect of where the file sits. A leading underscore, a .gitignore
 * entry or a robots.txt rule would none of them stop it being built.
 *
 * The split is driven by NODE_ENV, verified against VitePress 2.0.0-alpha.15:
 * `vitepress build docs` runs with NODE_ENV="production", while
 * `vitepress dev docs` leaves it undefined. Excluding only under production
 * therefore drops these pages from the build while the dev server still serves
 * them — which is the whole point, since the maintainer needs to open the sheet
 * to print it.
 */

/** Glob matching every maintainer-only page, relative to srcDir. */
export const INTERNAL_PAGES_GLOB = 'internal/**'

/**
 * Resolve `srcExclude` for the current mode.
 *
 * @param nodeEnv - typically `process.env.NODE_ENV`
 * @returns globs VitePress should refuse to route
 */
export function resolveSrcExclude(nodeEnv: string | undefined): string[] {
  return nodeEnv === 'production' ? [INTERNAL_PAGES_GLOB] : []
}
