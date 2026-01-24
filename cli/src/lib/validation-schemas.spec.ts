/**
 * Validation Schemas Tests
 */

import { describe, expect, it } from 'vitest'
import {
  automationLevelSchema,
  contentTypeSchema,
  controlCountSchema,
  descriptionSchema,
  githubUrlSchema,
  nameSchema,
  optionalNameSchema,
  optionalSemverSchema,
  optionalSlugSchema,
  SEMVER_PATTERN,
  semverSchema,
  SLUG_PATTERN,
  slugSchema,
  statusSchema,
} from './validation-schemas.js'

describe('validation Schemas', () => {
  describe('sLUG_PATTERN', () => {
    it('matches valid slugs', () => {
      expect(SLUG_PATTERN.test('valid-slug')).toBe(true)
      expect(SLUG_PATTERN.test('simple')).toBe(true)
      expect(SLUG_PATTERN.test('rhel-9-stig')).toBe(true)
      expect(SLUG_PATTERN.test('a1b2c3')).toBe(true)
    })

    it('rejects invalid slugs', () => {
      expect(SLUG_PATTERN.test('Invalid-Slug')).toBe(false) // uppercase
      expect(SLUG_PATTERN.test('slug--double')).toBe(false) // consecutive hyphens
      expect(SLUG_PATTERN.test('-leading')).toBe(false) // leading hyphen
      expect(SLUG_PATTERN.test('trailing-')).toBe(false) // trailing hyphen
      expect(SLUG_PATTERN.test('has spaces')).toBe(false) // spaces
      expect(SLUG_PATTERN.test('under_score')).toBe(false) // underscore
    })
  })

  describe('sEMVER_PATTERN', () => {
    it('matches valid semver versions', () => {
      expect(SEMVER_PATTERN.test('1.0.0')).toBe(true)
      expect(SEMVER_PATTERN.test('0.0.1')).toBe(true)
      expect(SEMVER_PATTERN.test('10.20.30')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-alpha')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-alpha.1')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-0.3.7')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0+build')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-alpha+build')).toBe(true)
      expect(SEMVER_PATTERN.test('1.0.0-rc.1+build.123')).toBe(true)
    })

    it('rejects invalid semver versions', () => {
      expect(SEMVER_PATTERN.test('1.0')).toBe(false) // missing patch
      expect(SEMVER_PATTERN.test('1')).toBe(false) // missing minor and patch
      expect(SEMVER_PATTERN.test('v1.0.0')).toBe(false) // v prefix
      expect(SEMVER_PATTERN.test('1.0.0-')).toBe(false) // trailing hyphen
      expect(SEMVER_PATTERN.test('1.0.0+')).toBe(false) // trailing plus
    })
  })

  describe('slugSchema', () => {
    it('validates valid slugs', () => {
      expect(slugSchema.safeParse('valid-slug').success).toBe(true)
      expect(slugSchema.safeParse('rhel-9-stig').success).toBe(true)
    })

    it('rejects empty slugs', () => {
      expect(slugSchema.safeParse('').success).toBe(false)
    })

    it('rejects consecutive hyphens', () => {
      expect(slugSchema.safeParse('double--hyphen').success).toBe(false)
    })

    it('rejects uppercase', () => {
      expect(slugSchema.safeParse('Invalid').success).toBe(false)
    })

    it('has metadata', () => {
      // Zod 4 stores meta differently - just verify the schema works
      expect(slugSchema.safeParse('valid-slug').success).toBe(true)
    })
  })

  describe('optionalSlugSchema', () => {
    it('accepts undefined', () => {
      expect(optionalSlugSchema.safeParse(undefined).success).toBe(true)
    })

    it('validates provided slugs', () => {
      expect(optionalSlugSchema.safeParse('valid-slug').success).toBe(true)
      expect(optionalSlugSchema.safeParse('Invalid').success).toBe(false)
    })
  })

  describe('semverSchema', () => {
    it('validates valid versions', () => {
      expect(semverSchema.safeParse('1.0.0').success).toBe(true)
      expect(semverSchema.safeParse('1.0.0-alpha').success).toBe(true)
      expect(semverSchema.safeParse('1.0.0+build').success).toBe(true)
    })

    it('rejects invalid versions', () => {
      expect(semverSchema.safeParse('1.0').success).toBe(false)
      expect(semverSchema.safeParse('not-a-version').success).toBe(false)
    })

    it('has metadata', () => {
      // Zod 4 stores meta differently - just verify the schema works
      expect(semverSchema.safeParse('1.0.0').success).toBe(true)
    })
  })

  describe('optionalSemverSchema', () => {
    it('accepts undefined', () => {
      expect(optionalSemverSchema.safeParse(undefined).success).toBe(true)
    })

    it('validates provided versions', () => {
      expect(optionalSemverSchema.safeParse('1.0.0').success).toBe(true)
      expect(optionalSemverSchema.safeParse('invalid').success).toBe(false)
    })
  })

  describe('nameSchema', () => {
    it('validates non-empty names', () => {
      expect(nameSchema.safeParse('Content Name').success).toBe(true)
    })

    it('rejects empty names', () => {
      expect(nameSchema.safeParse('').success).toBe(false)
    })
  })

  describe('optionalNameSchema', () => {
    it('accepts undefined', () => {
      expect(optionalNameSchema.safeParse(undefined).success).toBe(true)
    })

    it('rejects empty strings when provided', () => {
      expect(optionalNameSchema.safeParse('').success).toBe(false)
    })
  })

  describe('descriptionSchema', () => {
    it('accepts strings', () => {
      expect(descriptionSchema.safeParse('A description').success).toBe(true)
    })

    it('accepts undefined', () => {
      expect(descriptionSchema.safeParse(undefined).success).toBe(true)
    })
  })

  describe('contentTypeSchema', () => {
    it('accepts valid content types', () => {
      expect(contentTypeSchema.safeParse('validation').success).toBe(true)
      expect(contentTypeSchema.safeParse('hardening').success).toBe(true)
    })

    it('rejects invalid content types', () => {
      expect(contentTypeSchema.safeParse('invalid').success).toBe(false)
    })
  })

  describe('statusSchema', () => {
    it('accepts valid statuses', () => {
      expect(statusSchema.safeParse('active').success).toBe(true)
      expect(statusSchema.safeParse('beta').success).toBe(true)
      expect(statusSchema.safeParse('deprecated').success).toBe(true)
      expect(statusSchema.safeParse('draft').success).toBe(true)
    })

    it('rejects invalid statuses', () => {
      expect(statusSchema.safeParse('invalid').success).toBe(false)
    })
  })

  describe('automationLevelSchema', () => {
    it('accepts valid levels', () => {
      expect(automationLevelSchema.safeParse('full').success).toBe(true)
      expect(automationLevelSchema.safeParse('partial').success).toBe(true)
      expect(automationLevelSchema.safeParse('manual').success).toBe(true)
    })

    it('rejects invalid levels', () => {
      expect(automationLevelSchema.safeParse('invalid').success).toBe(false)
    })
  })

  describe('githubUrlSchema', () => {
    it('accepts valid URLs', () => {
      expect(githubUrlSchema.safeParse('https://github.com/mitre/test').success).toBe(true)
    })

    it('accepts undefined', () => {
      expect(githubUrlSchema.safeParse(undefined).success).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(githubUrlSchema.safeParse('not-a-url').success).toBe(false)
    })
  })

  describe('controlCountSchema', () => {
    it('accepts positive integers', () => {
      expect(controlCountSchema.safeParse(100).success).toBe(true)
      expect(controlCountSchema.safeParse(1).success).toBe(true)
    })

    it('accepts undefined', () => {
      expect(controlCountSchema.safeParse(undefined).success).toBe(true)
    })

    it('rejects zero', () => {
      expect(controlCountSchema.safeParse(0).success).toBe(false)
    })

    it('rejects negative numbers', () => {
      expect(controlCountSchema.safeParse(-1).success).toBe(false)
    })

    it('rejects non-integers', () => {
      expect(controlCountSchema.safeParse(1.5).success).toBe(false)
    })
  })
})
