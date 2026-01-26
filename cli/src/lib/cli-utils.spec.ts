/**
 * CLI Utilities Tests
 */

import { describe, expect, it } from 'vitest'
import {
  formatErrors,
  formatSuccess,
  formatWarnings,
  getOutputFormat,
  isNonInteractive,
  VALID_AUTOMATION_LEVELS,
  VALID_CONTENT_TYPES,
  VALID_STATUSES,
  validateAutomationLevel,
  validateContentType,
  validateStatus,
} from './cli-utils.js'

describe('cLI Utilities', () => {
  describe('getOutputFormat', () => {
    it('returns json when json option is true', () => {
      expect(getOutputFormat({ json: true })).toBe('json')
    })

    it('returns quiet when quiet option is true', () => {
      expect(getOutputFormat({ quiet: true })).toBe('quiet')
    })

    it('returns text when no format options', () => {
      expect(getOutputFormat({})).toBe('text')
    })

    it('prioritizes json over quiet', () => {
      expect(getOutputFormat({ json: true, quiet: true })).toBe('json')
    })
  })

  describe('isNonInteractive', () => {
    it('returns true when yes option is true', () => {
      expect(isNonInteractive({ yes: true })).toBe(true)
    })

    it('returns true when json option is true', () => {
      expect(isNonInteractive({ json: true })).toBe(true)
    })

    it('returns true when quiet option is true', () => {
      expect(isNonInteractive({ quiet: true })).toBe(true)
    })

    it('returns false when no non-interactive options', () => {
      expect(isNonInteractive({})).toBe(false)
    })

    it('returns false when other options are present', () => {
      expect(isNonInteractive({ dryRun: true, name: 'test' })).toBe(false)
    })
  })

  describe('formatErrors', () => {
    it('formats errors as JSON', () => {
      const result = formatErrors(['Error 1', 'Error 2'], 'json')
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.errors).toEqual(['Error 1', 'Error 2'])
    })

    it('returns empty string for quiet format', () => {
      expect(formatErrors(['Error'], 'quiet')).toBe('')
    })

    it('formats errors as text with markers', () => {
      const result = formatErrors(['Error 1', 'Error 2'], 'text')
      expect(result).toContain('Errors:')
      expect(result).toContain('Error 1')
      expect(result).toContain('Error 2')
    })
  })

  describe('formatSuccess', () => {
    it('formats success as JSON with id', () => {
      const result = formatSuccess('Record created', 'json', 'abc123')
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.id).toBe('abc123')
    })

    it('formats success as JSON without id', () => {
      const result = formatSuccess('Done', 'json')
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.id).toBeUndefined()
    })

    it('returns id for quiet format', () => {
      expect(formatSuccess('Created', 'quiet', 'abc123')).toBe('abc123')
    })

    it('returns empty string for quiet format without id', () => {
      expect(formatSuccess('Done', 'quiet')).toBe('')
    })

    it('formats success as text with checkmark', () => {
      const result = formatSuccess('Record created', 'text')
      expect(result).toContain('Record created')
    })
  })

  describe('formatWarnings', () => {
    it('returns empty string when no warnings', () => {
      expect(formatWarnings([])).toBe('')
    })

    it('formats warnings with markers', () => {
      const result = formatWarnings(['Warning 1', 'Warning 2'])
      expect(result).toContain('Warnings:')
      expect(result).toContain('Warning 1')
      expect(result).toContain('Warning 2')
    })
  })

  describe('validation helpers', () => {
    describe('validateContentType', () => {
      it('returns true for valid content types', () => {
        expect(validateContentType('validation')).toBe(true)
        expect(validateContentType('hardening')).toBe(true)
      })

      it('returns false for invalid content types', () => {
        expect(validateContentType('invalid')).toBe(false)
        expect(validateContentType(undefined)).toBe(false)
        expect(validateContentType('')).toBe(false)
      })
    })

    describe('validateStatus', () => {
      it('returns true for valid statuses', () => {
        expect(validateStatus('active')).toBe(true)
        expect(validateStatus('beta')).toBe(true)
        expect(validateStatus('deprecated')).toBe(true)
        expect(validateStatus('draft')).toBe(true)
      })

      it('returns false for invalid statuses', () => {
        expect(validateStatus('invalid')).toBe(false)
        expect(validateStatus(undefined)).toBe(false)
      })
    })

    describe('validateAutomationLevel', () => {
      it('returns true for valid automation levels', () => {
        expect(validateAutomationLevel('full')).toBe(true)
        expect(validateAutomationLevel('partial')).toBe(true)
        expect(validateAutomationLevel('manual')).toBe(true)
      })

      it('returns false for invalid automation levels', () => {
        expect(validateAutomationLevel('invalid')).toBe(false)
        expect(validateAutomationLevel(undefined)).toBe(false)
      })
    })
  })

  describe('constants', () => {
    it('exports valid content types', () => {
      expect(VALID_CONTENT_TYPES).toContain('validation')
      expect(VALID_CONTENT_TYPES).toContain('hardening')
    })

    it('exports valid statuses', () => {
      expect(VALID_STATUSES).toContain('active')
      expect(VALID_STATUSES).toContain('beta')
      expect(VALID_STATUSES).toContain('deprecated')
      expect(VALID_STATUSES).toContain('draft')
    })

    it('exports valid automation levels', () => {
      expect(VALID_AUTOMATION_LEVELS).toContain('full')
      expect(VALID_AUTOMATION_LEVELS).toContain('partial')
      expect(VALID_AUTOMATION_LEVELS).toContain('manual')
    })
  })
})
