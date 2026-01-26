#!/usr/bin/env tsx
/**
 * Create Pocketbase collections for Schema v2
 *
 * This script creates all collections defined in schema-v2.ts
 * Run with: npx tsx scripts/create-schema-v2-collections.ts
 *
 * Features:
 * - Proper FK indexes for query performance
 * - Cascade delete on junction tables
 * - Slug fields for URL-friendly routing
 * - Featured flags for homepage curation
 * - Domain-specific fields (control_count, stig_id, etc.)
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

async function main() {
  await pb.admins.authWithPassword('admin@localhost.com', 'testpassword123')
  console.log('✓ Authenticated\n')

  console.log('='.repeat(70))
  console.log('SCHEMA V2 - Creating Collections (with v2_ prefix)')
  console.log('='.repeat(70))
  console.log('All collections prefixed with v2_ to coexist with v1 schema\n')

  // Track created collections for FK references
  const collectionIds: Record<string, string> = {}

  // ========================================================================
  // LOOKUP TABLES (no FK dependencies)
  // ========================================================================

  // Capabilities
  collectionIds.capabilities = await createCollection('v2_capabilities', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'color', type: 'text', options: { max: 50 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['name', 'slug'],
  })

  // Categories
  collectionIds.categories = await createCollection('v2_categories', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['name', 'slug'],
  })

  // Organizations
  collectionIds.organizations = await createCollection('v2_organizations', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'org_type', type: 'select', values: ['vendor', 'government', 'community', 'standards_body'] },
  ], {
    unique: ['slug'],
    regular: ['org_type'],
  })

  // Tags
  collectionIds.tags = await createCollection('v2_tags', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'tag_category', type: 'select', values: ['platform', 'compliance', 'feature', 'technology', 'other'] },
    { name: 'badge_color', type: 'text', options: { max: 50 } },
  ], {
    unique: ['name', 'slug'],
    regular: ['tag_category'],
  })

  // Tool Types
  collectionIds.tool_types = await createCollection('v2_tool_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['name', 'slug'],
  })

  // Distribution Types
  collectionIds.distribution_types = await createCollection('v2_distribution_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['name', 'slug'],
  })

  // Registries
  collectionIds.registries = await createCollection('v2_registries', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
  ], {
    unique: ['name', 'slug'],
  })

  // Resource Types (for course learning resources)
  collectionIds.resource_types = await createCollection('v2_resource_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['name', 'slug'],
  })

  // Media Types (for SAF media library)
  collectionIds.media_types = await createCollection('v2_media_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['name', 'slug'],
  })

  // ========================================================================
  // TABLES WITH FK DEPENDENCIES (Level 1)
  // ========================================================================

  // Teams (depends on organizations)
  collectionIds.teams = await createCollection('v2_teams', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'website', type: 'url' },
  ], {
    unique: ['slug'],
    regular: ['organization'],
  })

  // Standards (depends on organizations)
  collectionIds.standards = await createCollection('v2_standards', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'short_name', type: 'text', options: { max: 50 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'standard_type', type: 'select', values: ['regulatory', 'industry', 'government', 'vendor'] },
  ], {
    unique: ['slug'],
    regular: ['organization', 'standard_type'],
  })

  // Technologies (depends on organizations)
  collectionIds.technologies = await createCollection('v2_technologies', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'github', type: 'url' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'documentation_url', type: 'url' },
  ], {
    unique: ['slug'],
    regular: ['organization'],
  })

  // Targets (depends on categories, organizations)
  collectionIds.targets = await createCollection('v2_targets', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'category', type: 'relation', collectionId: collectionIds.categories, maxSelect: 1 },
    { name: 'vendor', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
  ], {
    unique: ['slug'],
    regular: ['category', 'vendor'],
  })

  // ========================================================================
  // MAIN CONTENT TABLES (Level 2)
  // ========================================================================

  // Content (unified profiles)
  collectionIds.content = await createCollection('v2_content', [
    { name: 'name', type: 'text', required: true, options: { max: 300 } },
    { name: 'slug', type: 'text', required: true, options: { max: 150 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50, pattern: '^[0-9].*$' } }, // No "v" prefix - frontend adds it

    // Classification
    { name: 'content_type', type: 'select', required: true, values: ['validation', 'hardening'] },
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'target', type: 'relation', collectionId: collectionIds.targets, maxSelect: 1 },
    { name: 'standard', type: 'relation', collectionId: collectionIds.standards, maxSelect: 1 },
    { name: 'technology', type: 'relation', collectionId: collectionIds.technologies, maxSelect: 1 },
    { name: 'vendor', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'maintainer', type: 'relation', collectionId: collectionIds.teams, maxSelect: 1 },

    // Links
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },

    // Domain-specific (validation profiles)
    { name: 'control_count', type: 'number', options: { min: 0 } },
    { name: 'stig_id', type: 'text', options: { max: 50 } },
    { name: 'benchmark_version', type: 'text', options: { max: 50 } },

    // Domain-specific (hardening)
    { name: 'automation_level', type: 'select', values: ['full', 'partial', 'manual'] },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } },
    { name: 'release_date', type: 'date' },
    { name: 'deprecated_at', type: 'date' },
  ], {
    unique: ['slug'],
    regular: ['content_type', 'status', 'target', 'standard', 'technology', 'vendor', 'maintainer', 'is_featured'],
  })

  // Tools
  collectionIds.tools = await createCollection('v2_tools', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50, pattern: '^[0-9].*$' } }, // No "v" prefix - frontend adds it

    // Classification
    { name: 'tool_type', type: 'relation', collectionId: collectionIds.tool_types, maxSelect: 1 },
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'technology', type: 'relation', collectionId: collectionIds.technologies, maxSelect: 1 },

    // Links
    { name: 'website', type: 'url' },
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },
    { name: 'logo', type: 'text' },

    // Media
    { name: 'screenshot', type: 'text' },
    { name: 'screenshots', type: 'json' },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } },
  ], {
    unique: ['slug'],
    regular: ['tool_type', 'status', 'organization', 'technology', 'is_featured'],
  })

  // Distributions
  collectionIds.distributions = await createCollection('v2_distributions', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50, pattern: '^[0-9].*$' } }, // No "v" prefix - frontend adds it

    // Classification
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'tool', type: 'relation', collectionId: collectionIds.tools, maxSelect: 1 },
    { name: 'distribution_type', type: 'relation', collectionId: collectionIds.distribution_types, maxSelect: 1 },
    { name: 'registry', type: 'relation', collectionId: collectionIds.registries, maxSelect: 1 },

    // Links
    { name: 'registry_url', type: 'url' },
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },

    // Installation
    { name: 'install_command', type: 'text' },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } },
  ], {
    unique: ['slug'],
    regular: ['status', 'tool', 'distribution_type', 'registry'],
  })

  // Courses (training classes and educational content)
  collectionIds.courses = await createCollection('v2_courses', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },

    // Classification
    { name: 'course_type', type: 'select', values: ['class', 'workshop', 'tutorial', 'webinar'] },
    { name: 'level', type: 'select', values: ['beginner', 'intermediate', 'advanced'] },
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },

    // Links
    { name: 'website', type: 'url' },
    { name: 'registration_url', type: 'url' },
    { name: 'materials_url', type: 'url' },
    { name: 'logo', type: 'text' },

    // Duration & Pricing
    { name: 'duration_minutes', type: 'number', options: { min: 0 } },
    { name: 'is_free', type: 'bool' },
    { name: 'price_usd', type: 'number', options: { min: 0 } },

    // Audience
    { name: 'target_audience', type: 'text' },

    // Registration
    { name: 'registration_active', type: 'bool' },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['slug'],
    regular: ['course_type', 'level', 'status', 'organization', 'is_featured'],
  })

  // Course Resources (learning materials for courses)
  collectionIds.course_resources = await createCollection('v2_course_resources', [
    { name: 'title', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'url', type: 'url', required: true },

    // Foreign Keys
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'resource_type', type: 'relation', required: true, collectionId: collectionIds.resource_types, maxSelect: 1 },

    // Display
    { name: 'sort_order', type: 'number', options: { min: 0 } },
  ], {
    regular: ['course', 'resource_type'],
  })

  // Course Sessions (scheduled training dates - past and future)
  collectionIds.course_sessions = await createCollection('v2_course_sessions', [
    { name: 'title', type: 'text', options: { max: 200 } }, // Optional override like "Spring 2026 Cohort"

    // Foreign Keys
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },

    // Schedule
    { name: 'start_date', type: 'date', required: true },
    { name: 'end_date', type: 'date' },
    { name: 'timezone', type: 'text', options: { max: 50 } },

    // Location
    { name: 'location_type', type: 'select', values: ['virtual', 'in_person', 'hybrid'] },
    { name: 'location', type: 'text' }, // Room/venue or video platform
    { name: 'meeting_url', type: 'url' },

    // Capacity
    { name: 'instructor', type: 'text', options: { max: 200 } },
    { name: 'max_attendees', type: 'number', options: { min: 0 } },

    // Recording (YouTube or other)
    { name: 'recording_url', type: 'url' },

    // Status
    { name: 'status', type: 'select', values: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
  ], {
    regular: ['course', 'start_date', 'status', 'location_type'],
  })

  // Media (SAF media library - presentations, PDFs, videos, etc.)
  collectionIds.media = await createCollection('v2_media', [
    { name: 'name', type: 'text', required: true, options: { max: 300 } },
    { name: 'slug', type: 'text', required: true, options: { max: 150 } },
    { name: 'description', type: 'text' },

    // Classification
    { name: 'media_type', type: 'relation', required: true, collectionId: collectionIds.media_types, maxSelect: 1 },

    // Author/Source
    { name: 'author', type: 'text', options: { max: 200 } },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'published_at', type: 'date' },

    // Content - URL or File (one or both)
    { name: 'url', type: 'url' }, // External link (YouTube, SlideShare, etc.)
    { name: 'file', type: 'file', options: { // Binary upload (PDF, PPT, etc.)
      maxSelect: 1,
      maxSize: 52428800, // 50MB
    } },
    { name: 'file_size', type: 'number', options: { min: 0 } },
    { name: 'thumbnail', type: 'file', options: {
      maxSelect: 1,
      maxSize: 2097152, // 2MB
      mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    } },

    // Event context (optional - for conference talks, webinars)
    { name: 'event_name', type: 'text', options: { max: 200 } },
    { name: 'event_date', type: 'date' },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } },
  ], {
    unique: ['slug'],
    regular: ['media_type', 'organization', 'published_at', 'is_featured'],
  })

  // Releases (version history - polymorphic)
  collectionIds.releases = await createCollection('v2_releases', [
    { name: 'slug', type: 'text', required: true, options: { max: 150 } },

    // Polymorphic reference
    { name: 'entity_type', type: 'select', required: true, values: ['content', 'tool', 'distribution'] },
    { name: 'entity_id', type: 'text', required: true, options: { max: 50 } },

    // Version info
    { name: 'version', type: 'text', required: true, options: { max: 50 } },
    { name: 'release_date', type: 'date' },
    { name: 'release_notes', type: 'text' },

    // Download/verification
    { name: 'download_url', type: 'url' },
    { name: 'sha256', type: 'text', options: { max: 64 } },

    // Status
    { name: 'is_latest', type: 'bool' },
  ], {
    unique: ['slug'],
    regular: ['entity_type', 'entity_id', 'is_latest'],
    composite: [['entity_type', 'entity_id', 'is_latest']], // For "get latest" queries
  })

  // ========================================================================
  // JUNCTION TABLES (Level 3) - with cascadeDelete
  // ========================================================================

  // Content ↔ Capabilities
  await createCollection('v2_content_capabilities', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['content', 'capability'],
  })

  // Content ↔ Tags
  await createCollection('v2_content_tags', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['content', 'tag'],
  })

  // Content ↔ Content (relationships)
  await createCollection('v2_content_relationships', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'related_content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'relationship_type', type: 'select', required: true, values: ['validates', 'hardens', 'complements'] },
  ], {
    regular: ['content', 'related_content', 'relationship_type'],
  })

  // Tools ↔ Capabilities
  await createCollection('v2_tool_capabilities', [
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['tool', 'capability'],
  })

  // Tools ↔ Tags
  await createCollection('v2_tool_tags', [
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['tool', 'tag'],
  })

  // Distributions ↔ Capabilities
  await createCollection('v2_distribution_capabilities', [
    { name: 'distribution', type: 'relation', required: true, collectionId: collectionIds.distributions, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['distribution', 'capability'],
  })

  // Distributions ↔ Tags
  await createCollection('v2_distribution_tags', [
    { name: 'distribution', type: 'relation', required: true, collectionId: collectionIds.distributions, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['distribution', 'tag'],
  })

  // Courses ↔ Capabilities
  await createCollection('v2_course_capabilities', [
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['course', 'capability'],
  })

  // Courses ↔ Tools
  await createCollection('v2_course_tools', [
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['course', 'tool'],
  })

  // Courses ↔ Tags
  await createCollection('v2_course_tags', [
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['course', 'tag'],
  })

  // Media ↔ Capabilities
  await createCollection('v2_media_capabilities', [
    { name: 'media', type: 'relation', required: true, collectionId: collectionIds.media, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['media', 'capability'],
  })

  // Media ↔ Tags
  await createCollection('v2_media_tags', [
    { name: 'media', type: 'relation', required: true, collectionId: collectionIds.media, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true },
  ], {
    regular: ['media', 'tag'],
  })

  // ========================================================================
  // SUMMARY
  // ========================================================================

  console.log(`\n${'='.repeat(70)}`)
  console.log('SUMMARY - All collections prefixed with v2_')
  console.log('='.repeat(70))
  console.log('\nLookup Tables (no dependencies):')
  console.log('  • v2_capabilities - SAF pillars (Validate, Harden, Normalize, Plan, Visualize)')
  console.log('  • v2_categories - Target groupings (OS, Database, Container, etc.)')
  console.log('  • v2_organizations - Companies/agencies (MITRE, DISA, AWS, VMware)')
  console.log('  • v2_tags - Flexible labels (linux, windows, cloud)')
  console.log('  • v2_tool_types - Tool classification (application, cli, library)')
  console.log('  • v2_distribution_types - Distribution methods (helm_chart, npm, docker)')
  console.log('  • v2_registries - Package registries (Artifact Hub, Docker Hub, npmjs)')
  console.log('  • v2_resource_types - Course resource types (video, article, internal_course)')
  console.log('  • v2_media_types - Media library types (presentation, pdf, video, webinar)')

  console.log('\nWith FK Dependencies (Level 1):')
  console.log('  • v2_teams → v2_organizations')
  console.log('  • v2_standards → v2_organizations')
  console.log('  • v2_technologies → v2_organizations')
  console.log('  • v2_targets → v2_categories, v2_organizations')

  console.log('\nMain Content Tables (Level 2):')
  console.log('  • v2_content → v2_targets, v2_standards, v2_technologies, v2_organizations, v2_teams')
  console.log('    + slug, is_featured, control_count, stig_id, benchmark_version')
  console.log('  • v2_tools → v2_tool_types, v2_organizations, v2_technologies')
  console.log('    + slug, is_featured, screenshot, screenshots')
  console.log('  • v2_courses → v2_organizations')
  console.log('    + slug, is_featured, is_free, price_usd, target_audience, registration_active')
  console.log('  • v2_distributions → v2_tools, v2_distribution_types, v2_registries')
  console.log('    + slug')
  console.log('  • v2_media → v2_media_types, v2_organizations')
  console.log('    + slug, author, url, file (binary), thumbnail, event_name, is_featured')
  console.log('  • v2_releases (polymorphic version history)')
  console.log('    + entity_type, entity_id, version, sha256, is_latest')

  console.log('\nCourse-Related Tables:')
  console.log('  • v2_course_resources → v2_courses, v2_resource_types (learning materials)')
  console.log('    + title, url, description, sort_order')
  console.log('  • v2_course_sessions → v2_courses (scheduled training dates)')
  console.log('    + start_date, end_date, location_type, instructor, recording_url, status')

  console.log('\nJunction Tables (with cascadeDelete):')
  console.log('  • v2_content_capabilities, v2_content_tags, v2_content_relationships')
  console.log('  • v2_tool_capabilities, v2_tool_tags')
  console.log('  • v2_distribution_capabilities, v2_distribution_tags')
  console.log('  • v2_course_capabilities, v2_course_tools, v2_course_tags')
  console.log('  • v2_media_capabilities, v2_media_tags')

  console.log('\nIndexes:')
  console.log('  • UNIQUE indexes on all slug fields')
  console.log('  • Regular indexes on all FK columns')
  console.log('  • Regular indexes on status, content_type, is_featured')
  console.log('  • Composite index on v2_releases (entity_type, entity_id, is_latest)')

  console.log('\n✓ Schema v2 collections created successfully!')
  console.log('\nNext steps:')
  console.log('  1. Export v1 data: pb collections profiles list -o json > v1-profiles.json')
  console.log('  2. Transform v1 → v2 format')
  console.log('  3. Import to v2: pb collections v2_content create --file ...')
  console.log('  4. After validation, delete v1 collections and rename v2 (remove prefix)')
}

// Helper function to create a collection with proper indexes
interface IndexConfig {
  unique?: string[] // Fields that need UNIQUE indexes
  regular?: string[] // Fields that need regular indexes (FKs, filters)
  composite?: string[][] // Composite indexes (array of field arrays)
}

async function createCollection(
  name: string,
  fields: any[],
  indexConfig?: IndexConfig,
): Promise<string> {
  try {
    // Check if collection exists
    const existing = await pb.collections.getList(1, 100)
    const found = existing.items.find(c => c.name === name)

    if (found) {
      console.log(`  ℹ️  ${name} already exists (ID: ${found.id})`)
      return found.id
    }

    // Build indexes array
    const indexes: string[] = []

    if (indexConfig?.unique) {
      for (const field of indexConfig.unique) {
        indexes.push(`CREATE UNIQUE INDEX idx_${name}_${field} ON ${name} (${field})`)
      }
    }

    if (indexConfig?.regular) {
      for (const field of indexConfig.regular) {
        indexes.push(`CREATE INDEX idx_${name}_${field} ON ${name} (${field})`)
      }
    }

    if (indexConfig?.composite) {
      for (const fields of indexConfig.composite) {
        const fieldList = fields.join(', ')
        const indexName = fields.join('_')
        indexes.push(`CREATE INDEX idx_${name}_${indexName} ON ${name} (${fieldList})`)
      }
    }

    // Create collection
    const collection = await pb.collections.create({
      name,
      type: 'base',
      fields,
      indexes,
    })

    console.log(`  ✓ Created ${name} (ID: ${collection.id})`)
    if (indexes.length > 0) {
      console.log(`      ${indexes.length} indexes created`)
    }
    return collection.id
  }
  catch (error: any) {
    console.error(`  ✗ Failed to create ${name}:`, error.message)
    if (error.response?.data) {
      console.error(`      Details:`, JSON.stringify(error.response.data, null, 2))
    }
    throw error
  }
}

main().catch(console.error)
