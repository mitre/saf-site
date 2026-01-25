/**
 * Tests for drizzle-zod generated schemas
 */

import { describe, expect, it } from 'vitest'
import {
  // Schemas
  contentInsertSchema,
  contentSelectSchema,
  contentTypeSchema,
  organizationInsertSchema,
  SEMVER_PATTERN,
  semverSchema,
  SLUG_PATTERN,
  slugSchema,
  statusSchema,
  targetInsertSchema,
} from './schema.zod.js'

describe('schema.zod', () => {
  describe('patterns', () => {
    it('sLUG_PATTERN matches valid slugs', () => {
      expect(SLUG_PATTERN.test('valid-slug')).toBe(true)
      expect(SLUG_PATTERN.test('valid-slug-123')).toBe(true)
      expect(SLUG_PATTERN.test('simple')).toBe(true)
      expect(SLUG_PATTERN.test('a1b2c3')).toBe(true)
    })

    it('sLUG_PATTERN rejects invalid slugs', () => {
      expect(SLUG_PATTERN.test('Invalid-Slug')).toBe(false) // uppercase
      expect(SLUG_PATTERN.test('invalid--slug')).toBe(false) // consecutive hyphens
      expect(SLUG_PATTERN.test('-invalid')).toBe(false) // leading hyphen
      expect(SLUG_PATTERN.test('invalid-')).toBe(false) // trailing hyphen
      expect(SLUG_PATTERN.test('invalid slug')).toBe(false) // space
    })

    it('sEMVER_PATTERN matches valid semver', () => {
      expect(SEMVER_PATTERN.test('1.0.0')).toBe(true)
      expect(SEMVER_PATTERN.test('1.2.3')).toBe(true)
      expect(SEMVER_PATTERN.test('10.20.30')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-alpha')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-alpha.1')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0+build')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-beta+build')).toBe(true)
    })

    it('sEMVER_PATTERN rejects invalid semver', () => {
      expect(SEMVER_PATTERN.test('v1.0.0')).toBe(false) // v prefix
      expect(SEMVER_PATTERN.test('1.0')).toBe(false) // missing patch
      expect(SEMVER_PATTERN.test('1')).toBe(false) // only major
    })
  })

  describe('slugSchema', () => {
    it('accepts valid slugs', () => {
      expect(slugSchema.safeParse('valid-slug').success).toBe(true)
      expect(slugSchema.safeParse('rhel-8-stig').success).toBe(true)
    })

    it('rejects empty slugs', () => {
      const result = slugSchema.safeParse('')
      expect(result.success).toBe(false)
    })

    it('rejects consecutive hyphens', () => {
      const result = slugSchema.safeParse('invalid--slug')
      expect(result.success).toBe(false)
    })

    it('rejects uppercase', () => {
      const result = slugSchema.safeParse('Invalid-Slug')
      expect(result.success).toBe(false)
    })
  })

  describe('semverSchema', () => {
    it('accepts valid semver', () => {
      expect(semverSchema.safeParse('1.0.0').success).toBe(true)
      expect(semverSchema.safeParse('2.3.4-beta').success).toBe(true)
    })

    it('rejects invalid semver', () => {
      expect(semverSchema.safeParse('v1.0.0').success).toBe(false)
      expect(semverSchema.safeParse('1.0').success).toBe(false)
    })
  })

  describe('enum schemas', () => {
    it('contentTypeSchema accepts valid values', () => {
      expect(contentTypeSchema.safeParse('validation').success).toBe(true)
      expect(contentTypeSchema.safeParse('hardening').success).toBe(true)
    })

    it('contentTypeSchema rejects invalid values', () => {
      expect(contentTypeSchema.safeParse('invalid').success).toBe(false)
    })

    it('statusSchema accepts valid values', () => {
      expect(statusSchema.safeParse('active').success).toBe(true)
      expect(statusSchema.safeParse('beta').success).toBe(true)
      expect(statusSchema.safeParse('deprecated').success).toBe(true)
      expect(statusSchema.safeParse('draft').success).toBe(true)
    })
  })

  describe('organizationInsertSchema', () => {
    it('accepts valid organization', () => {
      const org = {
        id: 'test-id',
        name: 'MITRE',
        slug: 'mitre',
      }
      const result = organizationInsertSchema.safeParse(org)
      expect(result.success).toBe(true)
    })

    it('accepts organization with optional fields', () => {
      const org = {
        id: 'test-id',
        name: 'MITRE',
        slug: 'mitre',
        description: 'A security research organization',
        website: 'https://mitre.org',
        orgType: 'government',
      }
      const result = organizationInsertSchema.safeParse(org)
      expect(result.success).toBe(true)
    })

    it('rejects invalid slug', () => {
      const org = {
        id: 'test-id',
        name: 'MITRE',
        slug: 'INVALID--SLUG',
      }
      const result = organizationInsertSchema.safeParse(org)
      expect(result.success).toBe(false)
    })

    it('rejects invalid website URL', () => {
      const org = {
        id: 'test-id',
        name: 'MITRE',
        slug: 'mitre',
        website: 'not-a-url',
      }
      const result = organizationInsertSchema.safeParse(org)
      expect(result.success).toBe(false)
    })
  })

  describe('targetInsertSchema', () => {
    it('accepts valid target', () => {
      const target = {
        id: 'test-id',
        name: 'Red Hat Enterprise Linux 8',
        slug: 'rhel-8',
      }
      const result = targetInsertSchema.safeParse(target)
      expect(result.success).toBe(true)
    })
  })

  describe('contentInsertSchema', () => {
    it('accepts valid validation content', () => {
      const content = {
        id: 'test-id',
        name: 'RHEL 8 STIG InSpec Profile',
        slug: 'rhel-8-stig',
        contentType: 'validation',
      }
      const result = contentInsertSchema.safeParse(content)
      expect(result.success).toBe(true)
    })

    it('accepts content with version', () => {
      const content = {
        id: 'test-id',
        name: 'RHEL 8 STIG InSpec Profile',
        slug: 'rhel-8-stig',
        contentType: 'validation',
        version: '1.2.3',
      }
      const result = contentInsertSchema.safeParse(content)
      expect(result.success).toBe(true)
    })

    it('rejects invalid version format', () => {
      const content = {
        id: 'test-id',
        name: 'RHEL 8 STIG InSpec Profile',
        slug: 'rhel-8-stig',
        contentType: 'validation',
        version: 'v1.0', // invalid: has 'v' prefix and missing patch
      }
      const result = contentInsertSchema.safeParse(content)
      expect(result.success).toBe(false)
    })

    it('accepts content with all optional URL fields', () => {
      const content = {
        id: 'test-id',
        name: 'RHEL 8 STIG InSpec Profile',
        slug: 'rhel-8-stig',
        contentType: 'validation',
        github: 'https://github.com/mitre/rhel-8-stig',
        documentationUrl: 'https://docs.example.com',
        referenceUrl: 'https://cyber.mil/stigs',
      }
      const result = contentInsertSchema.safeParse(content)
      expect(result.success).toBe(true)
    })
  })

  describe('contentSelectSchema', () => {
    it('parses database select result', () => {
      const dbRow = {
        id: 'abc123',
        name: 'RHEL 8 STIG InSpec Profile',
        slug: 'rhel-8-stig',
        description: 'A profile',
        longDescription: null,
        version: '1.0.0',
        contentType: 'validation',
        status: 'active',
        target: null,
        standard: null,
        technology: null,
        vendor: null,
        maintainer: null,
        github: 'https://github.com/mitre/rhel-8-stig',
        documentationUrl: null,
        referenceUrl: null,
        readmeUrl: null,
        readmeMarkdown: null,
        controlCount: 250,
        stigId: 'RHEL-08',
        benchmarkVersion: 'V1R3',
        automationLevel: null,
        isFeatured: false,
        featuredOrder: null,
        license: 'Apache-2.0',
        releaseDate: null,
        deprecatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = contentSelectSchema.safeParse(dbRow)
      expect(result.success).toBe(true)
    })
  })
})
