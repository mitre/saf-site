/**
 * SAF Content Catalog - Database Schema v2
 *
 * Normalized 3NF schema for the MITRE SAF ecosystem
 *
 * Core Concepts:
 * - CAPABILITY: The 5 SAF pillars (Validate, Harden, Normalize, Plan, Visualize)
 * - CONTENT: Security profiles (validation + hardening unified)
 * - TOOL: Applications, CLIs, libraries in the ecosystem (Heimdall, SAF CLI, OHDF)
 * - TOOL_TYPE: Classification of tools (application, cli, library)
 * - DISTRIBUTION: Packaged releases of tools (helm charts, npm packages, docker images)
 * - DISTRIBUTION_TYPE: How tools are distributed (helm_chart, npm_package, docker_image, etc.)
 * - REGISTRY: Where distributions are hosted (Artifact Hub, Docker Hub, npmjs, etc.)
 * - TARGET: What gets secured (Red Hat 8, MySQL, Docker)
 * - CATEGORY: Grouping of targets (Operating System, Database, Container)
 * - STANDARD: Compliance frameworks (STIG, CIS, PCI-DSS)
 * - TECHNOLOGY: Implementation tools (InSpec, Ansible, Chef, Terraform)
 * - ORGANIZATION: Companies/agencies (MITRE, DISA, AWS, VMware)
 * - TEAM: Maintainer groups (SAF Team, DISA STIG Team)
 * - TAG: Flexible labels for filtering
 */

import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS (stored as text with validation)
// ============================================================================

export const ContentType = {
  VALIDATION: 'validation',
  HARDENING: 'hardening'
} as const

export const Status = {
  ACTIVE: 'active',
  BETA: 'beta',
  DEPRECATED: 'deprecated',
  DRAFT: 'draft'
} as const

export const RelationshipType = {
  VALIDATES: 'validates',      // validation content validates hardening content
  HARDENS: 'hardens',          // hardening content hardens what validation checks
  COMPLEMENTS: 'complements'   // related content
} as const

// ============================================================================
// LOOKUP TABLES
// ============================================================================

/**
 * SAF Capabilities - The 5 pillars of the framework
 */
export const capabilities = sqliteTable('capabilities', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // Validate, Harden, Normalize, Plan, Visualize
  slug: text('slug').notNull().unique(),        // URL-friendly: validate, harden, normalize, plan, visualize
  description: text('description'),
  icon: text('icon'),                           // Icon name for UI
  color: text('color'),                         // Brand color for UI
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Categories - Groupings of targets
 */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // Operating System, Database, Container, etc.
  slug: text('slug').notNull().unique(),        // URL-friendly: operating-system, database, container
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Organizations - Companies, agencies, communities
 */
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: mitre, disa, aws, vmware
  description: text('description'),
  website: text('website'),
  logo: text('logo'),
  orgType: text('org_type'),                    // vendor, government, community, standards_body
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Teams - Maintainer groups within organizations
 */
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: saf-team, disa-stig-team
  description: text('description'),
  organization: text('organization').references(() => organizations.id),
  website: text('website'),
  logo: text('logo'),                           // Team logo URL (often inherited from organization)
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Standards - Compliance frameworks
 */
export const standards = sqliteTable('standards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name'),                // Display-friendly: STIG, CIS, PCI DSS
  slug: text('slug').notNull().unique(),        // URL-friendly: stig, cis, pci-dss
  description: text('description'),
  website: text('website'),
  logo: text('logo'),
  organization: text('organization').references(() => organizations.id),  // Who publishes it
  standardType: text('standard_type'),          // regulatory, industry, government
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Technologies - Implementation tools (InSpec, Ansible, Chef, etc.)
 */
export const technologies = sqliteTable('technologies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: inspec, ansible, chef, terraform
  description: text('description'),
  website: text('website'),
  logo: text('logo'),
  github: text('github'),
  organization: text('organization').references(() => organizations.id),  // Who makes it
  documentationUrl: text('documentation_url'),
  quickStartTemplate: text('quick_start_template'),      // Auto-generated quick start section
  prerequisitesTemplate: text('prerequisites_template'), // Basic prerequisites per technology
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Targets - Specific products/systems that get secured
 */
export const targets = sqliteTable('targets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),                 // Red Hat 8, MySQL 8.0, Docker CE, AWS RDS
  slug: text('slug').notNull().unique(),        // URL-friendly: red-hat-8, mysql-8, docker-ce
  description: text('description'),
  category: text('category').references(() => categories.id),
  vendor: text('vendor').references(() => organizations.id),  // Who makes this product
  website: text('website'),
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Tags - Flexible labels for filtering
 */
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // Identifier: linux, windows, cloud
  slug: text('slug').notNull().unique(),        // URL-friendly: linux, windows, cloud
  displayName: text('display_name'),            // Display: Linux, Windows, Cloud
  description: text('description'),
  tagCategory: text('tag_category'),            // platform, compliance, feature, technology
  badgeColor: text('badge_color'),              // Color for UI badges
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Tool Types - Classification of tools/applications
 */
export const toolTypes = sqliteTable('tool_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // application, cli, library
  slug: text('slug').notNull().unique(),        // URL-friendly: application, cli, library
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Distribution Types - How tools are packaged/distributed
 */
export const distributionTypes = sqliteTable('distribution_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // helm_chart, npm_package, docker_image, github_action, homebrew
  slug: text('slug').notNull().unique(),        // URL-friendly: helm-chart, npm-package, docker-image
  displayName: text('display_name'),            // Helm Chart, npm Package, Docker Image, etc.
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Registries - Where distributions are hosted
 */
export const registries = sqliteTable('registries', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // artifact_hub, docker_hub, npmjs, github_packages, homebrew
  slug: text('slug').notNull().unique(),        // URL-friendly: artifact-hub, docker-hub, npmjs
  displayName: text('display_name'),            // Artifact Hub, Docker Hub, npmjs.com, etc.
  description: text('description'),
  website: text('website'),                     // https://artifacthub.io, https://hub.docker.com, etc.
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Resource Types - Classification of learning resources for courses
 */
export const resourceTypes = sqliteTable('resource_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // internal_course, video, article, documentation, tool, external_course
  slug: text('slug').notNull().unique(),        // URL-friendly: internal-course, video, article
  displayName: text('display_name'),            // Internal Course, Video, Article, etc.
  description: text('description'),
  icon: text('icon'),                           // Icon for UI (play-circle, book, link, etc.)
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Media Types - Classification of SAF media library items
 */
export const mediaTypes = sqliteTable('media_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),        // presentation, pdf, video, webinar, conference_talk, whitepaper, infographic
  slug: text('slug').notNull().unique(),        // URL-friendly: presentation, pdf, video
  displayName: text('display_name'),            // Presentation, PDF, Video, etc.
  description: text('description'),
  icon: text('icon'),                           // Icon for UI (file-ppt, file-pdf, play-circle, etc.)
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============================================================================
// MAIN CONTENT TABLES
// ============================================================================

/**
 * Content - Unified validation + hardening profiles
 */
export const content = sqliteTable('content', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: red-hat-8-stig, ubuntu-20-cis
  description: text('description'),
  longDescription: text('long_description'),
  version: text('version'),                      // Semver without "v" prefix (e.g., "1.0.0") - frontend adds "v"

  // Classification
  contentType: text('content_type').notNull(),  // 'validation' or 'hardening'
  status: text('status').default('active'),     // active, beta, deprecated, draft

  // Foreign Keys
  target: text('target').references(() => targets.id),
  standard: text('standard').references(() => standards.id),
  technology: text('technology').references(() => technologies.id),
  vendor: text('vendor').references(() => organizations.id),      // Who created it
  maintainer: text('maintainer').references(() => teams.id),      // Who maintains it

  // Links
  github: text('github'),
  documentationUrl: text('documentation_url'),
  referenceUrl: text('reference_url'),          // Link to official standard (cyber.mil, cisecurity.org)
  readmeUrl: text('readme_url'),                // GitHub raw README URL for fetching/syncing
  readmeMarkdown: text('readme_markdown'),      // Full/curated README content (long markdown)

  // Domain-specific (validation profiles)
  controlCount: integer('control_count'),       // Number of controls/checks
  stigId: text('stig_id'),                      // e.g., "RHEL-08-010010"
  benchmarkVersion: text('benchmark_version'),  // e.g., "V1R3"

  // Domain-specific (hardening)
  automationLevel: text('automation_level'),    // full, partial, manual

  // Featured/Curation
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  featuredOrder: integer('featured_order'),

  // Metadata
  license: text('license'),
  releaseDate: integer('release_date', { mode: 'timestamp' }),
  deprecatedAt: integer('deprecated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Tools - Applications, CLIs, and libraries in the SAF ecosystem
 */
export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: heimdall, vulcan, saf-cli
  description: text('description'),
  longDescription: text('long_description'),
  version: text('version'),                      // Semver without "v" prefix (e.g., "1.0.0") - frontend adds "v"

  // Classification
  toolType: text('tool_type').references(() => toolTypes.id),  // application, cli, library
  status: text('status').default('active'),

  // Foreign Keys
  organization: text('organization').references(() => organizations.id),
  technology: text('technology').references(() => technologies.id),  // Built with

  // Links
  website: text('website'),
  github: text('github'),
  documentationUrl: text('documentation_url'),

  // Media
  logo: text('logo'),
  screenshot: text('screenshot'),              // Primary screenshot
  screenshots: text('screenshots'),            // JSON array of screenshot URLs

  // Featured/Curation
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  featuredOrder: integer('featured_order'),

  // Metadata
  license: text('license'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Courses - Training classes and educational content
 */
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: inspec-developer, heimdall-user
  description: text('description'),
  longDescription: text('long_description'),

  // Classification
  courseType: text('course_type'),             // class, workshop, tutorial, webinar
  level: text('level'),                        // beginner, intermediate, advanced
  status: text('status').default('active'),

  // Foreign Keys
  organization: text('organization').references(() => organizations.id),  // Who offers it

  // Links
  website: text('website'),
  registrationUrl: text('registration_url'),
  materialsUrl: text('materials_url'),
  logo: text('logo'),

  // Duration & Pricing
  durationMinutes: integer('duration_minutes'),
  isFree: integer('is_free', { mode: 'boolean' }).default(true),
  priceUsd: integer('price_usd'),              // Price in USD cents (e.g., 9900 = $99.00)

  // Audience
  targetAudience: text('target_audience'),     // "developers", "security analysts", "devops"

  // Registration
  registrationActive: integer('registration_active', { mode: 'boolean' }).default(false),

  // Featured/Curation
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  featuredOrder: integer('featured_order'),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Course Resources - Learning materials for courses (prerequisites, references, etc.)
 */
export const courseResources = sqliteTable('course_resources', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),               // "Introduction to Ruby", "GitHub Actions Basics"
  description: text('description'),
  url: text('url').notNull(),                   // Internal or external link

  // Foreign Keys
  course: text('course').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull().references(() => resourceTypes.id),

  // Display
  sortOrder: integer('sort_order').default(0),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Course Sessions - Scheduled training dates (past and future)
 */
export const courseSessions = sqliteTable('course_sessions', {
  id: text('id').primaryKey(),
  title: text('title'),                         // Optional override like "Spring 2026 Cohort"

  // Foreign Keys
  course: text('course').notNull().references(() => courses.id, { onDelete: 'cascade' }),

  // Schedule
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  timezone: text('timezone'),                   // e.g., "America/New_York"

  // Location
  locationType: text('location_type'),          // virtual, in_person, hybrid
  location: text('location'),                   // Room/venue or video platform
  meetingUrl: text('meeting_url'),

  // Capacity
  instructor: text('instructor'),
  maxAttendees: integer('max_attendees'),

  // Recording (YouTube or other)
  recordingUrl: text('recording_url'),

  // Status
  status: text('status').default('scheduled'), // scheduled, in_progress, completed, cancelled

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Media - SAF media library (presentations, PDFs, videos, webinars, conference talks)
 */
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),        // URL-friendly: saf-overview-2026, inspec-deep-dive
  description: text('description'),

  // Classification
  mediaType: text('media_type').notNull().references(() => mediaTypes.id),

  // Author/Source
  author: text('author'),                       // External speakers, presenters
  organization: text('organization').references(() => organizations.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }),

  // Content - URL or File (one or both)
  url: text('url'),                             // External link (YouTube, SlideShare, etc.)
  file: text('file'),                           // Pocketbase file path for binary uploads
  fileSize: integer('file_size'),               // Size in bytes
  thumbnail: text('thumbnail'),                 // Thumbnail image path

  // Event context (optional - for conference talks, webinars)
  eventName: text('event_name'),
  eventDate: integer('event_date', { mode: 'timestamp' }),

  // Featured/Curation
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  featuredOrder: integer('featured_order'),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Distributions - Packaged releases of tools (helm charts, npm packages, docker images, etc.)
 */
export const distributions = sqliteTable('distributions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),                 // e.g., "heimdall-helm-chart", "saf-cli-npm"
  slug: text('slug').notNull().unique(),        // URL-friendly: heimdall-helm, saf-cli-npm
  description: text('description'),
  version: text('version'),                      // Semver without "v" prefix (e.g., "1.0.0") - frontend adds "v"

  // Classification
  status: text('status').default('active'),

  // Foreign Keys
  tool: text('tool').references(() => tools.id),                        // Which tool this distributes
  distributionType: text('distribution_type').references(() => distributionTypes.id),  // helm_chart, npm, docker, etc.
  registry: text('registry').references(() => registries.id),           // Where it's hosted

  // Links
  registryUrl: text('registry_url'),            // Direct link to package in registry
  github: text('github'),                       // Source repo if different from tool
  documentationUrl: text('documentation_url'),

  // Installation
  installCommand: text('install_command'),      // e.g., "helm install...", "npm install..."

  // Metadata
  license: text('license'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

/**
 * Releases - Version history for content, tools, and distributions
 * Polymorphic table: entityType + entityId pattern
 */
export const releases = sqliteTable('releases', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),        // URL-friendly: heimdall-v3-2-0, rhel8-stig-v1r3

  // Polymorphic reference
  entityType: text('entity_type').notNull(),    // 'content', 'tool', 'distribution'
  entityId: text('entity_id').notNull(),        // ID of the entity

  // Version info (format varies by entity type: semver "3.2.0" for tools, STIG "V1R3" for content)
  version: text('version').notNull(),           // No pattern validation - supports multiple formats
  releaseDate: integer('release_date', { mode: 'timestamp' }),
  releaseNotes: text('release_notes'),

  // Download/verification
  downloadUrl: text('download_url'),
  sha256: text('sha256'),                       // For integrity verification

  // Status
  isLatest: integer('is_latest', { mode: 'boolean' }).default(false),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============================================================================
// JUNCTION TABLES
// ============================================================================

/**
 * Content ↔ Capabilities (many-to-many)
 */
export const contentCapabilities = sqliteTable('content_capabilities', {
  contentId: text('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  capabilityId: text('capability_id').notNull().references(() => capabilities.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.contentId, table.capabilityId] })
}))

/**
 * Content ↔ Tags (many-to-many)
 */
export const contentTags = sqliteTable('content_tags', {
  contentId: text('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.contentId, table.tagId] })
}))

/**
 * Content ↔ Content (self-referential: validation ↔ hardening pairs)
 */
export const contentRelationships = sqliteTable('content_relationships', {
  contentId: text('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  relatedContentId: text('related_content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull()  // validates, hardens, complements
}, (table) => ({
  pk: primaryKey({ columns: [table.contentId, table.relatedContentId] })
}))

/**
 * Tools ↔ Capabilities (many-to-many)
 */
export const toolCapabilities = sqliteTable('tool_capabilities', {
  toolId: text('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' }),
  capabilityId: text('capability_id').notNull().references(() => capabilities.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.toolId, table.capabilityId] })
}))

/**
 * Tools ↔ Tags (many-to-many)
 */
export const toolTags = sqliteTable('tool_tags', {
  toolId: text('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.toolId, table.tagId] })
}))

/**
 * Distributions ↔ Capabilities (many-to-many)
 */
export const distributionCapabilities = sqliteTable('distribution_capabilities', {
  distributionId: text('distribution_id').notNull().references(() => distributions.id, { onDelete: 'cascade' }),
  capabilityId: text('capability_id').notNull().references(() => capabilities.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.distributionId, table.capabilityId] })
}))

/**
 * Distributions ↔ Tags (many-to-many)
 */
export const distributionTags = sqliteTable('distribution_tags', {
  distributionId: text('distribution_id').notNull().references(() => distributions.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.distributionId, table.tagId] })
}))

/**
 * Courses ↔ Capabilities (many-to-many) - e.g., InSpec course teaches Validation
 */
export const courseCapabilities = sqliteTable('course_capabilities', {
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  capabilityId: text('capability_id').notNull().references(() => capabilities.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.courseId, table.capabilityId] })
}))

/**
 * Courses ↔ Tools (many-to-many) - e.g., Heimdall course covers Heimdall tool
 */
export const courseTools = sqliteTable('course_tools', {
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  toolId: text('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.courseId, table.toolId] })
}))

/**
 * Courses ↔ Tags (many-to-many)
 */
export const courseTags = sqliteTable('course_tags', {
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.courseId, table.tagId] })
}))

/**
 * Media ↔ Capabilities (many-to-many)
 */
export const mediaCapabilities = sqliteTable('media_capabilities', {
  mediaId: text('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  capabilityId: text('capability_id').notNull().references(() => capabilities.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.mediaId, table.capabilityId] })
}))

/**
 * Media ↔ Tags (many-to-many)
 */
export const mediaTags = sqliteTable('media_tags', {
  mediaId: text('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.mediaId, table.tagId] })
}))

// ============================================================================
// RELATIONS (for Drizzle query builder)
// ============================================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  teams: many(teams),
  standards: many(standards),
  technologies: many(technologies),
  targets: many(targets),
  content: many(content),
  tools: many(tools)
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organization],
    references: [organizations.id]
  }),
  content: many(content)
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  targets: many(targets)
}))

export const targetsRelations = relations(targets, ({ one, many }) => ({
  category: one(categories, {
    fields: [targets.category],
    references: [categories.id]
  }),
  vendor: one(organizations, {
    fields: [targets.vendor],
    references: [organizations.id]
  }),
  content: many(content)
}))

export const standardsRelations = relations(standards, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [standards.organization],
    references: [organizations.id]
  }),
  content: many(content)
}))

export const technologiesRelations = relations(technologies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [technologies.organization],
    references: [organizations.id]
  }),
  content: many(content),
  tools: many(tools)
}))

export const contentRelations = relations(content, ({ one, many }) => ({
  target: one(targets, {
    fields: [content.target],
    references: [targets.id]
  }),
  standard: one(standards, {
    fields: [content.standard],
    references: [standards.id]
  }),
  technology: one(technologies, {
    fields: [content.technology],
    references: [technologies.id]
  }),
  vendor: one(organizations, {
    fields: [content.vendor],
    references: [organizations.id]
  }),
  maintainer: one(teams, {
    fields: [content.maintainer],
    references: [teams.id]
  }),
  capabilities: many(contentCapabilities),
  tags: many(contentTags),
  relationships: many(contentRelationships)
}))

export const toolTypesRelations = relations(toolTypes, ({ many }) => ({
  tools: many(tools)
}))

export const toolsRelations = relations(tools, ({ one, many }) => ({
  toolType: one(toolTypes, {
    fields: [tools.toolType],
    references: [toolTypes.id]
  }),
  organization: one(organizations, {
    fields: [tools.organization],
    references: [organizations.id]
  }),
  technology: one(technologies, {
    fields: [tools.technology],
    references: [technologies.id]
  }),
  capabilities: many(toolCapabilities),
  tags: many(toolTags),
  distributions: many(distributions)
}))

export const distributionTypesRelations = relations(distributionTypes, ({ many }) => ({
  distributions: many(distributions)
}))

export const registriesRelations = relations(registries, ({ many }) => ({
  distributions: many(distributions)
}))

export const distributionsRelations = relations(distributions, ({ one, many }) => ({
  tool: one(tools, {
    fields: [distributions.tool],
    references: [tools.id]
  }),
  distributionType: one(distributionTypes, {
    fields: [distributions.distributionType],
    references: [distributionTypes.id]
  }),
  registry: one(registries, {
    fields: [distributions.registry],
    references: [registries.id]
  }),
  capabilities: many(distributionCapabilities),
  tags: many(distributionTags)
}))

export const capabilitiesRelations = relations(capabilities, ({ many }) => ({
  content: many(contentCapabilities),
  tools: many(toolCapabilities),
  distributions: many(distributionCapabilities),
  courses: many(courseCapabilities),
  media: many(mediaCapabilities)
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [courses.organization],
    references: [organizations.id]
  }),
  capabilities: many(courseCapabilities),
  tools: many(courseTools),
  tags: many(courseTags),
  resources: many(courseResources),
  sessions: many(courseSessions)
}))

export const resourceTypesRelations = relations(resourceTypes, ({ many }) => ({
  resources: many(courseResources)
}))

export const courseResourcesRelations = relations(courseResources, ({ one }) => ({
  course: one(courses, {
    fields: [courseResources.course],
    references: [courses.id]
  }),
  resourceType: one(resourceTypes, {
    fields: [courseResources.resourceType],
    references: [resourceTypes.id]
  })
}))

export const courseSessionsRelations = relations(courseSessions, ({ one }) => ({
  course: one(courses, {
    fields: [courseSessions.course],
    references: [courses.id]
  })
}))

export const mediaTypesRelations = relations(mediaTypes, ({ many }) => ({
  media: many(media)
}))

export const mediaRelations = relations(media, ({ one, many }) => ({
  mediaType: one(mediaTypes, {
    fields: [media.mediaType],
    references: [mediaTypes.id]
  }),
  organization: one(organizations, {
    fields: [media.organization],
    references: [organizations.id]
  }),
  capabilities: many(mediaCapabilities),
  tags: many(mediaTags)
}))

export const mediaCapabilitiesRelations = relations(mediaCapabilities, ({ one }) => ({
  media: one(media, {
    fields: [mediaCapabilities.mediaId],
    references: [media.id]
  }),
  capability: one(capabilities, {
    fields: [mediaCapabilities.capabilityId],
    references: [capabilities.id]
  })
}))

export const mediaTagsRelations = relations(mediaTags, ({ one }) => ({
  media: one(media, {
    fields: [mediaTags.mediaId],
    references: [media.id]
  }),
  tag: one(tags, {
    fields: [mediaTags.tagId],
    references: [tags.id]
  })
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  content: many(contentTags),
  tools: many(toolTags),
  distributions: many(distributionTags),
  courses: many(courseTags),
  media: many(mediaTags)
}))

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Capability = typeof capabilities.$inferSelect
export type Category = typeof categories.$inferSelect
export type Organization = typeof organizations.$inferSelect
export type Team = typeof teams.$inferSelect
export type Standard = typeof standards.$inferSelect
export type Technology = typeof technologies.$inferSelect
export type Target = typeof targets.$inferSelect
export type Tag = typeof tags.$inferSelect
export type ToolType = typeof toolTypes.$inferSelect
export type DistributionType = typeof distributionTypes.$inferSelect
export type Registry = typeof registries.$inferSelect
export type Content = typeof content.$inferSelect
export type Tool = typeof tools.$inferSelect
export type Course = typeof courses.$inferSelect
export type Distribution = typeof distributions.$inferSelect
export type Release = typeof releases.$inferSelect
export type ResourceType = typeof resourceTypes.$inferSelect
export type CourseResource = typeof courseResources.$inferSelect
export type CourseSession = typeof courseSessions.$inferSelect
export type MediaType = typeof mediaTypes.$inferSelect
export type Media = typeof media.$inferSelect
