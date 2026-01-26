/**
 * SAF Site Entity Schemas
 *
 * Zod validation schemas for all database entities.
 * Single source of truth for runtime validation.
 *
 * TypeScript types are inferred from these schemas using z.infer<>
 */

import { z } from 'zod'

// ============================================================================
// SHARED PATTERNS
// ============================================================================

/**
 * Slug pattern - lowercase alphanumeric with hyphens
 */
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Base slug schema with convention enforcement
 */
const slugSchema = z.string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be at most 100 characters')
  .regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
  .refine(
    slug => !slug.includes('--'),
    'Slug cannot contain consecutive hyphens',
  )
  .meta({
    id: 'slug',
    title: 'Slug',
    description: 'URL-friendly identifier. Lowercase alphanumeric with hyphens, no consecutive hyphens.',
  })

/**
 * Optional URL schema
 */
const urlSchema = z.string().url().optional().meta({
  id: 'url',
  title: 'URL',
  description: 'Valid URL (optional)',
})

/**
 * Full semver pattern: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
 * Examples: 1.0.0, 1.0.0-alpha, 1.0.0-alpha.1, 1.0.0+build, 1.0.0-beta+build
 * See: https://semver.org/
 */
const semverPattern = /^\d+\.\d+\.\d+(-[0-9A-Z-]+(\.[0-9A-Z-]+)*)?(\+[0-9A-Z-]+(\.[0-9A-Z-]+)*)?$/i

// ============================================================================
// ENUMS
// ============================================================================

export const orgTypeEnum = z.enum(['vendor', 'government', 'community', 'standards_body'])
  .meta({
    id: 'org_type',
    title: 'Organization Type',
    description: 'Classification of organization: vendor (commercial), government, community (open source), or standards_body',
  })

export const standardTypeEnum = z.enum(['regulatory', 'industry', 'government'])
  .meta({
    id: 'standard_type',
    title: 'Standard Type',
    description: 'Classification of security standard: regulatory (compliance mandated), industry (best practices), or government (agency-specific)',
  })

export const tagCategoryEnum = z.enum(['platform', 'compliance', 'feature', 'technology'])
  .meta({
    id: 'tag_category',
    title: 'Tag Category',
    description: 'Classification of tag: platform (OS/cloud), compliance (standards), feature (capabilities), or technology (tools)',
  })

export const contentTypeEnum = z.enum(['validation', 'hardening'])
  .meta({
    id: 'content_type',
    title: 'Content Type',
    description: 'Type of security content: validation (InSpec profiles for testing) or hardening (Ansible/Chef for remediation)',
  })

export const statusEnum = z.enum(['active', 'beta', 'deprecated', 'draft'])
  .meta({
    id: 'status',
    title: 'Publication Status',
    description: 'Lifecycle status: active (production-ready), beta (testing), deprecated (legacy), or draft (work-in-progress)',
  })

export const automationLevelEnum = z.enum(['full', 'partial', 'manual'])
  .meta({
    id: 'automation_level',
    title: 'Automation Level',
    description: 'Degree of automation: full (no manual steps), partial (some manual steps), or manual (requires human intervention)',
  })

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

export const organizationSchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').meta({
    title: 'Name',
    description: 'Display name of the organization',
  }),
  slug: slugSchema,
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description of the organization and its role in security',
  }),
  website: urlSchema.meta({
    title: 'Website',
    description: 'Primary website URL',
  }),
  logo: urlSchema.meta({
    title: 'Logo URL',
    description: 'URL to organization logo image',
  }),
  orgType: orgTypeEnum.optional().meta({
    title: 'Organization Type',
    description: 'Classification of the organization',
  }),
}).meta({
  id: 'organization',
  title: 'Organization',
  description: 'An organization that creates, maintains, or sponsors security content (e.g., MITRE, CIS, DISA)',
})

export const organizationInputSchema = organizationSchema.omit({ id: true }).meta({
  id: 'organization_input',
  title: 'Organization Input',
  description: 'Schema for creating a new organization (excludes auto-generated ID)',
})

// ============================================================================
// TARGET SCHEMA
// ============================================================================

export const targetSchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').meta({
    title: 'Name',
    description: 'Display name of the target system',
  }),
  slug: slugSchema,
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description of the target system',
  }),
  category: z.string().optional().meta({
    title: 'Category',
    description: 'FK to categories collection (e.g., operating-system, database, cloud)',
  }),
  vendor: z.string().optional().meta({
    title: 'Vendor',
    description: 'FK to organizations collection (the vendor/creator of this target)',
  }),
  website: urlSchema.meta({
    title: 'Website',
    description: 'Official product/project website',
  }),
  logo: urlSchema.meta({
    title: 'Logo URL',
    description: 'URL to target system logo image',
  }),
}).meta({
  id: 'target',
  title: 'Target',
  description: 'A system, platform, or application that can be secured (e.g., RHEL 9, PostgreSQL, AWS)',
})

export const targetInputSchema = targetSchema.omit({ id: true }).meta({
  id: 'target_input',
  title: 'Target Input',
  description: 'Schema for creating a new target (excludes auto-generated ID)',
})

// ============================================================================
// STANDARD SCHEMA
// ============================================================================

export const standardSchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').meta({
    title: 'Name',
    description: 'Full name of the security standard',
  }),
  shortName: z.string().optional().meta({
    title: 'Short Name',
    description: 'Abbreviated name (e.g., STIG, CIS, NIST)',
  }),
  slug: slugSchema,
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description of the standard and its purpose',
  }),
  website: urlSchema.meta({
    title: 'Website',
    description: 'Official standard documentation URL',
  }),
  logo: urlSchema.meta({
    title: 'Logo URL',
    description: 'URL to standard/organization logo',
  }),
  organization: z.string().optional().meta({
    title: 'Organization',
    description: 'FK to organizations collection (the body that publishes this standard)',
  }),
  standardType: standardTypeEnum.optional().meta({
    title: 'Standard Type',
    description: 'Classification of the standard',
  }),
}).meta({
  id: 'standard',
  title: 'Standard',
  description: 'A security standard or benchmark (e.g., DISA STIG, CIS Benchmark, NIST 800-53)',
})

export const standardInputSchema = standardSchema.omit({ id: true }).meta({
  id: 'standard_input',
  title: 'Standard Input',
  description: 'Schema for creating a new standard (excludes auto-generated ID)',
})

// ============================================================================
// TECHNOLOGY SCHEMA
// ============================================================================

export const technologySchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').meta({
    title: 'Name',
    description: 'Display name of the technology',
  }),
  slug: slugSchema,
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description of the technology and its use in security',
  }),
  website: urlSchema.meta({
    title: 'Website',
    description: 'Official project/product website',
  }),
  logo: urlSchema.meta({
    title: 'Logo URL',
    description: 'URL to technology logo image',
  }),
  github: urlSchema.meta({
    title: 'GitHub URL',
    description: 'GitHub repository URL (if open source)',
  }),
  organization: z.string().optional().meta({
    title: 'Organization',
    description: 'FK to organizations collection (creator/maintainer)',
  }),
  documentationUrl: urlSchema.meta({
    title: 'Documentation URL',
    description: 'Link to official documentation',
  }),
  quickStartTemplate: z.string().optional().meta({
    title: 'Quick Start Template',
    description: 'Markdown template for quick start instructions',
  }),
  prerequisitesTemplate: z.string().optional().meta({
    title: 'Prerequisites Template',
    description: 'Markdown template for prerequisites',
  }),
}).meta({
  id: 'technology',
  title: 'Technology',
  description: 'A tool or framework used for security automation (e.g., InSpec, Ansible, Chef, Terraform)',
})

export const technologyInputSchema = technologySchema.omit({ id: true }).meta({
  id: 'technology_input',
  title: 'Technology Input',
  description: 'Schema for creating a new technology (excludes auto-generated ID)',
})

// ============================================================================
// TEAM SCHEMA
// ============================================================================

export const teamSchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').meta({
    title: 'Name',
    description: 'Display name of the team',
  }),
  slug: slugSchema,
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description of the team and its focus area',
  }),
  organization: z.string().optional().meta({
    title: 'Organization',
    description: 'FK to organizations collection (parent organization)',
  }),
  website: urlSchema.meta({
    title: 'Website',
    description: 'Team website or landing page',
  }),
  logo: urlSchema.meta({
    title: 'Logo URL',
    description: 'URL to team logo image',
  }),
}).meta({
  id: 'team',
  title: 'Team',
  description: 'A team that maintains security content (e.g., SAF Team, AWS Security Team)',
})

export const teamInputSchema = teamSchema.omit({ id: true }).meta({
  id: 'team_input',
  title: 'Team Input',
  description: 'Schema for creating a new team (excludes auto-generated ID)',
})

// ============================================================================
// TAG SCHEMA
// ============================================================================

export const tagSchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').meta({
    title: 'Name',
    description: 'Internal tag name (used for filtering)',
  }),
  slug: slugSchema,
  displayName: z.string().optional().meta({
    title: 'Display Name',
    description: 'Human-friendly name shown in UI (defaults to name if not set)',
  }),
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description of what this tag represents',
  }),
  tagCategory: tagCategoryEnum.optional().meta({
    title: 'Tag Category',
    description: 'Classification of the tag for grouping',
  }),
  badgeColor: z.string().optional().meta({
    title: 'Badge Color',
    description: 'CSS color for the tag badge (e.g., #3b82f6, blue-500)',
  }),
}).meta({
  id: 'tag',
  title: 'Tag',
  description: 'A categorization tag for content items (e.g., kubernetes, aws, stig-ready)',
})

export const tagInputSchema = tagSchema.omit({ id: true }).meta({
  id: 'tag_input',
  title: 'Tag Input',
  description: 'Schema for creating a new tag (excludes auto-generated ID)',
})

// ============================================================================
// CONTENT SCHEMA
// ============================================================================

export const contentSchema = z.object({
  id: z.string().min(1).meta({
    title: 'ID',
    description: 'Unique identifier (Pocketbase-generated)',
  }),
  name: z.string().min(1, 'Name is required').max(200).meta({
    title: 'Name',
    description: 'Display name of the content item',
  }),
  slug: slugSchema,
  description: z.string().optional().meta({
    title: 'Description',
    description: 'Brief description (shown in cards and search results)',
  }),
  longDescription: z.string().optional().meta({
    title: 'Long Description',
    description: 'Detailed description (shown on detail page)',
  }),
  version: z.string().regex(semverPattern, 'Version must be semver format (x.y.z[-prerelease][+build])').optional().meta({
    id: 'semver',
    title: 'Version',
    description: 'Semantic version: MAJOR.MINOR.PATCH[-prerelease][+build]. See https://semver.org/',
  }),

  // Classification
  contentType: contentTypeEnum.meta({
    title: 'Content Type',
    description: 'Type of security content',
  }),
  status: statusEnum.optional().default('active').meta({
    title: 'Status',
    description: 'Publication lifecycle status',
  }),

  // Foreign Keys
  target: z.string().optional().meta({
    title: 'Target',
    description: 'FK to targets collection (what system this content secures)',
  }),
  standard: z.string().optional().meta({
    title: 'Standard',
    description: 'FK to standards collection (what standard this implements)',
  }),
  technology: z.string().optional().meta({
    title: 'Technology',
    description: 'FK to technologies collection (what tool this uses)',
  }),
  vendor: z.string().optional().meta({
    title: 'Vendor',
    description: 'FK to organizations collection (who created this)',
  }),
  maintainer: z.string().optional().meta({
    title: 'Maintainer',
    description: 'FK to teams collection (who maintains this)',
  }),

  // Links
  github: urlSchema.meta({
    title: 'GitHub URL',
    description: 'GitHub repository URL',
  }),
  documentationUrl: urlSchema.meta({
    title: 'Documentation URL',
    description: 'Link to external documentation',
  }),
  referenceUrl: urlSchema.meta({
    title: 'Reference URL',
    description: 'Link to reference material (e.g., STIG viewer)',
  }),
  readmeUrl: urlSchema.meta({
    title: 'README URL',
    description: 'Direct link to README file (auto-populated from GitHub)',
  }),
  readmeMarkdown: z.string().optional().meta({
    title: 'README Markdown',
    description: 'Cached README content in markdown format',
  }),

  // Domain-specific (validation profiles)
  controlCount: z.number().int().positive().optional().meta({
    title: 'Control Count',
    description: 'Number of controls/rules in this profile (validation only)',
  }),
  stigId: z.string().optional().meta({
    title: 'STIG ID',
    description: 'Official DISA STIG identifier (e.g., RHEL_9_STIG)',
  }),
  benchmarkVersion: z.string().optional().meta({
    title: 'Benchmark Version',
    description: 'Version of the benchmark this implements (e.g., V1R1)',
  }),

  // Domain-specific (hardening)
  automationLevel: automationLevelEnum.optional().meta({
    title: 'Automation Level',
    description: 'Degree of automation (hardening only)',
  }),

  // Featured/Curation
  isFeatured: z.boolean().optional().meta({
    title: 'Is Featured',
    description: 'Whether to feature this content on the homepage',
  }),
  featuredOrder: z.number().int().optional().meta({
    title: 'Featured Order',
    description: 'Sort order for featured items (lower = first)',
  }),

  // Metadata
  license: z.string().optional().meta({
    title: 'License',
    description: 'SPDX license identifier (e.g., Apache-2.0, MIT)',
  }),
  releaseDate: z.date().optional().meta({
    title: 'Release Date',
    description: 'Date of initial release',
  }),
  deprecatedAt: z.date().optional().meta({
    title: 'Deprecated At',
    description: 'Date when this content was deprecated (if status=deprecated)',
  }),
}).meta({
  id: 'content',
  title: 'Content',
  description: 'A security content item: validation profile (InSpec) or hardening content (Ansible/Chef/Terraform)',
})

export const contentInputSchema = contentSchema.omit({ id: true }).meta({
  id: 'content_input',
  title: 'Content Input',
  description: 'Schema for creating new content (excludes auto-generated ID)',
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = z.infer<typeof organizationSchema>
export type OrganizationInput = z.infer<typeof organizationInputSchema>

export type Target = z.infer<typeof targetSchema>
export type TargetInput = z.infer<typeof targetInputSchema>

export type Standard = z.infer<typeof standardSchema>
export type StandardInput = z.infer<typeof standardInputSchema>

export type Technology = z.infer<typeof technologySchema>
export type TechnologyInput = z.infer<typeof technologyInputSchema>

export type Team = z.infer<typeof teamSchema>
export type TeamInput = z.infer<typeof teamInputSchema>

export type Tag = z.infer<typeof tagSchema>
export type TagInput = z.infer<typeof tagInputSchema>

export type ContentRecord = z.infer<typeof contentSchema>
export type ContentInput = z.infer<typeof contentInputSchema>

// ============================================================================
// POCKETBASE RECORD SCHEMAS (Phase 1.2)
// ============================================================================

/**
 * Base Pocketbase record metadata
 * All Pocketbase records include these fields
 */
export const pbRecordSchema = z.object({
  id: z.string().meta({
    title: 'ID',
    description: 'Pocketbase-generated unique identifier',
  }),
  created: z.string().meta({
    title: 'Created',
    description: 'ISO timestamp when record was created',
  }),
  updated: z.string().meta({
    title: 'Updated',
    description: 'ISO timestamp when record was last updated',
  }),
  collectionId: z.string().meta({
    title: 'Collection ID',
    description: 'ID of the Pocketbase collection',
  }),
  collectionName: z.string().meta({
    title: 'Collection Name',
    description: 'Name of the Pocketbase collection',
  }),
  expand: z.record(z.string(), z.unknown()).optional().meta({
    title: 'Expand',
    description: 'Expanded FK relations (when using ?expand=)',
  }),
}).meta({
  id: 'pb_record',
  title: 'Pocketbase Record',
  description: 'Base schema for all Pocketbase records with standard metadata fields',
})

/**
 * Pocketbase organization record (snake_case fields)
 */
export const pbOrganizationSchema = pbRecordSchema.extend({
  name: z.string().meta({ title: 'Name', description: 'Organization name' }),
  slug: z.string().meta({ title: 'Slug', description: 'URL-friendly identifier' }),
  description: z.string().nullable().optional().meta({ title: 'Description', description: 'Organization description' }),
  website: z.string().nullable().optional().meta({ title: 'Website', description: 'Website URL' }),
  logo: z.string().nullable().optional().meta({ title: 'Logo', description: 'Logo URL' }),
  org_type: z.string().nullable().optional().meta({ title: 'Organization Type', description: 'Type classification (snake_case from Pocketbase)' }),
}).meta({
  id: 'pb_organization',
  title: 'PB Organization',
  description: 'Pocketbase organization record with snake_case field names',
})

/**
 * Pocketbase target record (snake_case fields)
 */
export const pbTargetSchema = pbRecordSchema.extend({
  name: z.string().meta({ title: 'Name', description: 'Target name' }),
  slug: z.string().meta({ title: 'Slug', description: 'URL-friendly identifier' }),
  description: z.string().nullable().optional().meta({ title: 'Description', description: 'Target description' }),
  category: z.string().nullable().optional().meta({ title: 'Category', description: 'FK to categories (string ID)' }),
  vendor: z.string().nullable().optional().meta({ title: 'Vendor', description: 'FK to organizations (string ID)' }),
  website: z.string().nullable().optional().meta({ title: 'Website', description: 'Website URL' }),
  logo: z.string().nullable().optional().meta({ title: 'Logo', description: 'Logo URL' }),
}).meta({
  id: 'pb_target',
  title: 'PB Target',
  description: 'Pocketbase target record with snake_case field names',
})

/**
 * Pocketbase standard record (snake_case fields)
 */
export const pbStandardSchema = pbRecordSchema.extend({
  name: z.string().meta({ title: 'Name', description: 'Standard name' }),
  short_name: z.string().nullable().optional().meta({ title: 'Short Name', description: 'Abbreviated name (snake_case)' }),
  slug: z.string().meta({ title: 'Slug', description: 'URL-friendly identifier' }),
  description: z.string().nullable().optional().meta({ title: 'Description', description: 'Standard description' }),
  website: z.string().nullable().optional().meta({ title: 'Website', description: 'Website URL' }),
  logo: z.string().nullable().optional().meta({ title: 'Logo', description: 'Logo URL' }),
  organization: z.string().nullable().optional().meta({ title: 'Organization', description: 'FK to organizations (string ID)' }),
  standard_type: z.string().nullable().optional().meta({ title: 'Standard Type', description: 'Type classification (snake_case)' }),
}).meta({
  id: 'pb_standard',
  title: 'PB Standard',
  description: 'Pocketbase standard record with snake_case field names',
})

/**
 * Pocketbase technology record (snake_case fields)
 */
export const pbTechnologySchema = pbRecordSchema.extend({
  name: z.string().meta({ title: 'Name', description: 'Technology name' }),
  slug: z.string().meta({ title: 'Slug', description: 'URL-friendly identifier' }),
  description: z.string().nullable().optional().meta({ title: 'Description', description: 'Technology description' }),
  website: z.string().nullable().optional().meta({ title: 'Website', description: 'Website URL' }),
  logo: z.string().nullable().optional().meta({ title: 'Logo', description: 'Logo URL' }),
  github: z.string().nullable().optional().meta({ title: 'GitHub', description: 'GitHub repository URL' }),
  organization: z.string().nullable().optional().meta({ title: 'Organization', description: 'FK to organizations (string ID)' }),
  documentation_url: z.string().nullable().optional().meta({ title: 'Documentation URL', description: 'Documentation link (snake_case)' }),
  quick_start_template: z.string().nullable().optional().meta({ title: 'Quick Start Template', description: 'Markdown template (snake_case)' }),
  prerequisites_template: z.string().nullable().optional().meta({ title: 'Prerequisites Template', description: 'Markdown template (snake_case)' }),
}).meta({
  id: 'pb_technology',
  title: 'PB Technology',
  description: 'Pocketbase technology record with snake_case field names',
})

/**
 * Pocketbase team record (snake_case fields)
 */
export const pbTeamSchema = pbRecordSchema.extend({
  name: z.string().meta({ title: 'Name', description: 'Team name' }),
  slug: z.string().meta({ title: 'Slug', description: 'URL-friendly identifier' }),
  description: z.string().nullable().optional().meta({ title: 'Description', description: 'Team description' }),
  organization: z.string().nullable().optional().meta({ title: 'Organization', description: 'FK to organizations (string ID)' }),
  website: z.string().nullable().optional().meta({ title: 'Website', description: 'Website URL' }),
  logo: z.string().nullable().optional().meta({ title: 'Logo', description: 'Logo URL' }),
}).meta({
  id: 'pb_team',
  title: 'PB Team',
  description: 'Pocketbase team record with snake_case field names',
})

/**
 * Pocketbase content record (snake_case fields)
 * This is the main content schema for validation profiles and hardening content
 */
export const pbContentSchema = pbRecordSchema.extend({
  name: z.string().meta({ title: 'Name', description: 'Content name' }),
  slug: z.string().meta({ title: 'Slug', description: 'URL-friendly identifier' }),
  description: z.string().nullable().optional().meta({ title: 'Description', description: 'Brief description' }),
  long_description: z.string().nullable().optional().meta({ title: 'Long Description', description: 'Detailed description (snake_case)' }),
  version: z.string().nullable().optional().meta({ title: 'Version', description: 'Semantic version string' }),

  // Classification
  content_type: z.string().meta({ title: 'Content Type', description: 'validation or hardening (snake_case)' }),
  status: z.string().nullable().optional().meta({ title: 'Status', description: 'Publication status' }),

  // Foreign Keys (as string IDs)
  target: z.string().nullable().optional().meta({ title: 'Target', description: 'FK to targets (string ID)' }),
  standard: z.string().nullable().optional().meta({ title: 'Standard', description: 'FK to standards (string ID)' }),
  technology: z.string().nullable().optional().meta({ title: 'Technology', description: 'FK to technologies (string ID)' }),
  vendor: z.string().nullable().optional().meta({ title: 'Vendor', description: 'FK to organizations (string ID)' }),
  maintainer: z.string().nullable().optional().meta({ title: 'Maintainer', description: 'FK to teams (string ID)' }),

  // Links
  github: z.string().nullable().optional().meta({ title: 'GitHub', description: 'GitHub repository URL' }),
  documentation_url: z.string().nullable().optional().meta({ title: 'Documentation URL', description: 'Documentation link (snake_case)' }),
  reference_url: z.string().nullable().optional().meta({ title: 'Reference URL', description: 'Reference material link (snake_case)' }),
  readme_url: z.string().nullable().optional().meta({ title: 'README URL', description: 'README file link (snake_case)' }),
  readme_markdown: z.string().nullable().optional().meta({ title: 'README Markdown', description: 'Cached README content (snake_case)' }),

  // Domain-specific (validation profiles)
  control_count: z.number().nullable().optional().meta({ title: 'Control Count', description: 'Number of controls (snake_case)' }),
  stig_id: z.string().nullable().optional().meta({ title: 'STIG ID', description: 'DISA STIG identifier (snake_case)' }),
  benchmark_version: z.string().nullable().optional().meta({ title: 'Benchmark Version', description: 'Benchmark version (snake_case)' }),

  // Domain-specific (hardening)
  automation_level: z.string().nullable().optional().meta({ title: 'Automation Level', description: 'full/partial/manual (snake_case)' }),

  // Featured/Curation
  is_featured: z.boolean().nullable().optional().meta({ title: 'Is Featured', description: 'Featured flag (snake_case)' }),
  featured_order: z.number().nullable().optional().meta({ title: 'Featured Order', description: 'Sort order (snake_case)' }),

  // Metadata
  license: z.string().nullable().optional().meta({ title: 'License', description: 'SPDX license identifier' }),
  release_date: z.string().nullable().optional().meta({ title: 'Release Date', description: 'ISO date string (snake_case)' }),
  deprecated_at: z.string().nullable().optional().meta({ title: 'Deprecated At', description: 'ISO date string (snake_case)' }),
}).meta({
  id: 'pb_content',
  title: 'PB Content',
  description: 'Pocketbase content record with snake_case field names. Main schema for validation profiles and hardening content.',
})

/**
 * Content with expanded FK relations
 * Used when fetching content with ?expand=target,standard,vendor,etc.
 */
export const pbContentWithExpand = pbContentSchema.extend({
  expand: z.object({
    target: pbTargetSchema.optional(),
    standard: pbStandardSchema.optional(),
    technology: pbTechnologySchema.optional(),
    vendor: pbOrganizationSchema.optional(),
    maintainer: pbTeamSchema.optional(),
  }).optional().meta({
    title: 'Expanded Relations',
    description: 'Populated FK relations from ?expand= query parameter',
  }),
}).meta({
  id: 'pb_content_expanded',
  title: 'PB Content (Expanded)',
  description: 'Pocketbase content record with expanded FK relations',
})

// ============================================================================
// POCKETBASE TYPE EXPORTS
// ============================================================================

export type PocketbaseRecord = z.infer<typeof pbRecordSchema>
export type PBOrganization = z.infer<typeof pbOrganizationSchema>
export type PBTarget = z.infer<typeof pbTargetSchema>
export type PBStandard = z.infer<typeof pbStandardSchema>
export type PBTechnology = z.infer<typeof pbTechnologySchema>
export type PBTeam = z.infer<typeof pbTeamSchema>
export type PBContent = z.infer<typeof pbContentSchema>
export type PBContentExpanded = z.infer<typeof pbContentWithExpand>
