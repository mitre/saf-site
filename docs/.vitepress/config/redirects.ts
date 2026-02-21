/**
 * Redirect map for old SAF site URLs.
 *
 * Keys are source paths (without leading slash or .html).
 * Values are the target URLs to redirect to.
 *
 * At build time, each entry generates a small HTML page with a
 * <meta http-equiv="refresh"> redirect at the source path.
 */
export const redirects: Record<string, string> = {
  // Pillar verb forms (old saf.mitre.org /libs/<pillar> paths)
  'libs/validate': '/content/?pillar=validate',
  'libs/harden': '/content/?pillar=harden',
  'libs/normalize': '/content/?pillar=normalize',
  'libs/visualize': '/content/?pillar=visualize',
  'libs/plan': '/content/?pillar=plan',

  // Pillar noun forms (common alternative phrasing)
  'libs/validation': '/content/?pillar=validate',
  'libs/hardening': '/content/?pillar=harden',
  'libs/normalization': '/content/?pillar=normalize',
  'libs/visualization': '/content/?pillar=visualize',
  'libs/planning': '/content/?pillar=plan',

  // Individual library slugs (old /libs/<slug> paths -> content detail pages)
  'libs/inspecjs': '/content/inspecjs',
  'libs/ohdf-converters': '/content/ohdf-converters',
  'libs/emass-client': '/content/emass-client',
  'libs/ts-inspec-objects': '/content/ts-inspec-objects',
  'libs/stig-xccdf-xml-library': '/content/stig-xccdf-xml-library',
}
