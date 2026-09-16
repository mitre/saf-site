/**
 * Redirect output generation.
 *
 * The site ships to two static hosts with different redirect support:
 *
 * - Cloudflare Pages honours a `_redirects` file, giving a real HTTP 301.
 *   Non-browser clients (curl, link checkers, chat unfurlers, scripted
 *   downloads) follow that; they do NOT follow a meta-refresh.
 * - GitHub Pages has no `_redirects` equivalent, so page redirects there
 *   rely on a generated `<path>/index.html` carrying a meta-refresh.
 *
 * Both are emitted, from one source map, with one exception: a redirect
 * source that looks like a file (has an extension) is emitted to
 * `_redirects` only. Writing `<path>/index.html` for such a source would
 * create a directory named e.g. "report.pdf", which collides with real
 * assets at the same path and breaks the build outright.
 */

export interface MetaRefreshPage {
  /** Output path relative to the build directory */
  path: string
  html: string
}

export interface RedirectOutputs {
  /** Full contents of the Cloudflare `_redirects` file */
  redirectsFile: string
  metaRefreshPages: MetaRefreshPage[]
}

// Matches a trailing extension on the FINAL path segment only, so a dotted
// directory name ("v1.2/guide") is not mistaken for a file.
const FILE_EXTENSION_REGEX = /\.[a-z0-9]+$/i
const TRAILING_SLASHES_REGEX = /\/+$/

/**
 * Whether a redirect source names a file rather than a page
 */
export function hasFileExtension(path: string): boolean {
  const lastSegment = path.replace(TRAILING_SLASHES_REGEX, '').split('/').pop() ?? ''
  return FILE_EXTENSION_REGEX.test(lastSegment)
}

/**
 * Prefix a root-relative redirect target with the deployment base
 */
export function resolveTarget(to: string, base: string): string {
  return to.startsWith('/') ? base + to.slice(1) : to
}

function metaRefreshHtml(target: string): string {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    `  <meta http-equiv="refresh" content="0;url=${target}">`,
    `  <link rel="canonical" href="${target}">`,
    '</head>',
    '<body>',
    `  <p>This page has moved to <a href="${target}">${target}</a>.</p>`,
    '</body>',
    '</html>',
  ].join('\n')
}

/**
 * Build both redirect artefacts from the shared redirect map
 *
 * @param redirects - source path (no leading slash) -> target
 * @param base - deployment base, always leading and trailing slashed
 */
export function buildRedirectOutputs(
  redirects: Record<string, string>,
  base: string,
): RedirectOutputs {
  const lines: string[] = []
  const metaRefreshPages: MetaRefreshPage[] = []

  for (const [from, to] of Object.entries(redirects)) {
    const target = resolveTarget(to, base)
    lines.push(`${base}${from} ${target} 301`)

    if (!hasFileExtension(from)) {
      metaRefreshPages.push({
        path: `${from.replace(TRAILING_SLASHES_REGEX, '')}/index.html`,
        html: metaRefreshHtml(target),
      })
    }
  }

  return {
    redirectsFile: `${lines.join('\n')}\n`,
    metaRefreshPages,
  }
}
