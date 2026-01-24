/**
 * SAF Site Content Naming Conventions
 *
 * Canonical mappings for generating consistent, predictable slugs
 * See CONVENTIONS.md for full documentation
 */

/**
 * Target name to canonical abbreviation mapping
 *
 * Keys are lowercase patterns to match against full target names
 * Values are the abbreviated form to use in slugs
 */
export const TARGET_ABBREVIATIONS: Record<string, string> = {
  // Operating Systems - Linux
  'red hat enterprise linux': 'rhel',
  'redhat enterprise linux': 'rhel',
  'oracle linux': 'ol',
  'centos': 'centos',
  'alpine linux': 'alpine',
  'alpine': 'alpine',
  'suse linux enterprise': 'sles',
  'suse': 'sles',
  'ubuntu': 'ubuntu',
  'debian': 'debian',

  // Operating Systems - Windows
  'windows server': 'win',
  'windows': 'win',

  // Operating Systems - macOS
  'macos': 'macos',
  'mac os': 'macos',

  // Cloud Providers
  'amazon web services': 'aws',
  'amazon rds': 'aws-rds',
  'aws rds': 'aws-rds',
  'google cloud platform': 'gcp',
  'google cloud': 'gcp',
  'microsoft azure': 'azure',

  // VMware
  'vmware esxi': 'esxi',
  'vmware vsphere': 'vsphere',
  'vmware vcenter': 'vcsa',
  'vmware vcsa': 'vcsa',

  // Containers & Orchestration
  'kubernetes': 'k8s',
  'docker': 'docker',
  'docker ce': 'docker-ce',
  'docker enterprise': 'docker-ee',

  // Databases
  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'mysql': 'mysql',
  'oracle database': 'oracle-db',
  'microsoft sql server': 'mssql',
  'sql server': 'mssql',
  'mongodb': 'mongodb',
  'redis': 'redis',
  'elasticsearch': 'elasticsearch',

  // Web Servers
  'apache http server': 'apache',
  'apache': 'apache',
  'nginx': 'nginx',
  'internet information services': 'iis',
  'iis': 'iis',

  // Application Platforms
  'java runtime environment': 'jre',
  'jre': 'jre',
  'jboss eap': 'jboss-eap',
  'jboss': 'jboss',
  'tomcat': 'tomcat',
  'apache tomcat': 'tomcat',

  // Network
  'cisco ios': 'cisco-ios',
  'palo alto pan-os': 'panos',
  'pan-os': 'panos',
}

/**
 * Standard name to canonical identifier mapping
 */
export const STANDARD_IDENTIFIERS: Record<string, string> = {
  'disa stig': 'stig',
  'stig': 'stig',
  'cis benchmark': 'cis',
  'cis': 'cis',
  'pci dss': 'pci-dss',
  'pci-dss': 'pci-dss',
  'nist 800-53': 'nist-800-53',
  'nist': 'nist-800-53',
  'hipaa': 'hipaa',
  'fedramp': 'fedramp',
  'soc 2': 'soc2',
  'soc2': 'soc2',
}

/**
 * Technology prefixes for hardening content
 */
export const TECHNOLOGY_PREFIXES: Record<string, string> = {
  ansible: 'ansible',
  chef: 'chef',
  puppet: 'puppet',
  terraform: 'terraform',
  powershell: 'powershell',
  bash: 'bash',
}

/**
 * Find the best matching abbreviation for a target name
 *
 * For multi-component targets (e.g., "AWS RDS PostgreSQL 14"),
 * includes all specific terms to preserve full context.
 */
export function abbreviateTarget(targetName: string): string {
  const normalized = targetName.toLowerCase().trim()

  // Try exact match first
  if (TARGET_ABBREVIATIONS[normalized]) {
    return TARGET_ABBREVIATIONS[normalized]
  }

  // For multi-component targets, build up from all matching components
  const components: string[] = []
  let remaining = normalized

  // Check for cloud platform prefix first (aws, amazon, google, azure)
  const cloudPrefixes = [
    { pattern: 'amazon web services', abbrev: 'aws' },
    { pattern: 'amazon rds', abbrev: 'aws-rds' },
    { pattern: 'aws rds', abbrev: 'aws-rds' },
    { pattern: 'amazon', abbrev: 'aws' },
    { pattern: 'aws', abbrev: 'aws' },
    { pattern: 'google cloud platform', abbrev: 'gcp' },
    { pattern: 'google cloud', abbrev: 'gcp' },
    { pattern: 'gcp', abbrev: 'gcp' },
    { pattern: 'microsoft azure', abbrev: 'azure' },
    { pattern: 'azure', abbrev: 'azure' },
  ]

  for (const { pattern, abbrev } of cloudPrefixes) {
    if (remaining.startsWith(pattern)) {
      components.push(abbrev)
      remaining = remaining.slice(pattern.length).trim()
      break
    }
  }

  // Check for service/product in remainder
  const productAbbrevs = [
    { pattern: 'postgresql', abbrev: 'postgresql' },
    { pattern: 'postgres', abbrev: 'postgresql' },
    { pattern: 'mysql', abbrev: 'mysql' },
    { pattern: 'sql server', abbrev: 'mssql' },
    { pattern: 'mongodb', abbrev: 'mongodb' },
    { pattern: 'redis', abbrev: 'redis' },
    { pattern: 'elasticsearch', abbrev: 'elasticsearch' },
  ]

  for (const { pattern, abbrev } of productAbbrevs) {
    if (remaining.includes(pattern)) {
      components.push(abbrev)
      remaining = remaining.replace(pattern, '').trim()
      break
    }
  }

  // If we found components, return them joined
  if (components.length > 0) {
    return components.join('-')
  }

  // Try single-match abbreviations for non-cloud targets
  const matches = Object.entries(TARGET_ABBREVIATIONS)
    .filter(([pattern]) => normalized.startsWith(pattern) || normalized.includes(pattern))
    .sort((a, b) => b[0].length - a[0].length)

  if (matches.length > 0) {
    return matches[0][1]
  }

  // No match - slugify the original (without version numbers)
  return slugify(remaining || normalized)
}

/**
 * Get the canonical standard identifier
 */
export function abbreviateStandard(standardName: string): string {
  const normalized = standardName.toLowerCase().trim()

  if (STANDARD_IDENTIFIERS[normalized]) {
    return STANDARD_IDENTIFIERS[normalized]
  }

  // Fallback to slugified version
  return slugify(normalized)
}

/**
 * Extract version from a string (e.g., "Red Hat 9" -> "9", "Ubuntu 22.04" -> "2204")
 */
export function extractVersion(name: string): string | null {
  // Match version patterns: 9, 9.0, 22.04, 2019, etc.
  const versionMatch = name.match(/(\d+(?:\.\d+)?(?:\.\d+)?)/)

  if (!versionMatch)
    return null

  const version = versionMatch[1]

  // For versions like 9.0 or 14.0, just use major
  if (version.match(/^\d+\.0$/)) {
    return version.split('.')[0]
  }

  // For OS versions like 22.04 (non-.0 minor), remove the dot (ubuntu-2204)
  if (version.match(/^\d+\.\d+$/) && !version.endsWith('.0')) {
    return version.replace('.', '')
  }

  return version
}

/**
 * Generate a slug from target name and standard
 *
 * @param targetName - Full target name (e.g., "Red Hat Enterprise Linux 9")
 * @param standardName - Standard name (e.g., "DISA STIG")
 * @param technology - Optional technology prefix for hardening content
 */
export function generateContentSlug(
  targetName: string,
  standardName: string,
  technology?: string,
): string {
  const targetAbbrev = abbreviateTarget(targetName)
  const version = extractVersion(targetName)
  const standard = abbreviateStandard(standardName)

  const parts: string[] = []

  // Add technology prefix for hardening content
  if (technology) {
    const techPrefix = TECHNOLOGY_PREFIXES[technology.toLowerCase()] || slugify(technology)
    parts.push(techPrefix)
  }

  // Add target abbreviation
  parts.push(targetAbbrev)

  // Add version if present
  if (version) {
    parts.push(version)
  }

  // Add standard
  parts.push(standard)

  return parts.join('-')
}

/**
 * Parse a GitHub repo name into components
 *
 * @example
 * parseRepoName('redhat-enterprise-linux-9-stig-baseline')
 * // { target: 'redhat-enterprise-linux-9', standard: 'stig', type: 'baseline' }
 *
 * parseRepoName('ansible-redhat-enterprise-linux-9-stig-hardening')
 * // { technology: 'ansible', target: 'redhat-enterprise-linux-9', standard: 'stig', type: 'hardening' }
 */
export function parseRepoName(repoName: string): {
  technology?: string
  target: string
  standard: string
  type: 'baseline' | 'hardening'
} | null {
  const normalized = repoName.toLowerCase()

  // Check for hardening pattern: {tech}-{target}-{standard}-hardening
  const hardeningMatch = normalized.match(
    /^(ansible|chef|puppet|terraform|powershell)-(.+)-(stig|cis|pci-dss|nist|hipaa)-hardening$/,
  )

  if (hardeningMatch) {
    return {
      technology: hardeningMatch[1],
      target: hardeningMatch[2],
      standard: hardeningMatch[3],
      type: 'hardening',
    }
  }

  // Check for baseline pattern: {target}-{standard}-baseline
  const baselineMatch = normalized.match(
    /^(.+)-(stig|cis|pci-dss|nist|hipaa)-baseline$/,
  )

  if (baselineMatch) {
    return {
      target: baselineMatch[1],
      standard: baselineMatch[2],
      type: 'baseline',
    }
  }

  return null
}

/**
 * Simple slugify - lowercase, replace non-alphanumeric with hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Suggest a slug from a GitHub repository name
 */
export function suggestSlugFromRepo(repoName: string): string | null {
  const parsed = parseRepoName(repoName)

  if (!parsed)
    return null

  // Convert target from repo format to display format for abbreviation lookup
  const targetDisplay = parsed.target
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  return generateContentSlug(
    targetDisplay,
    parsed.standard,
    parsed.technology,
  )
}
