/**
 * Shared types for logo display components
 */

export interface LogoItem {
  /** Display name (used for BrandIcon lookup and alt text) */
  name: string
  /** Optional URL to link to */
  href?: string
  /** Optional custom image URL (overrides BrandIcon) */
  image?: string
  /** Optional icon name override for BrandIcon lookup */
  iconName?: string
  /** Optional description shown on hover */
  description?: string
}
