/**
 * Database CLI Tests
 *
 * Tests for CLI argument parsing, help output, and command structure.
 * These tests verify the command interface without requiring Pocketbase.
 */

import { describe, it, expect } from 'vitest'
import { dbCommand } from './db.js'

// ============================================================================
// COMMAND STRUCTURE
// ============================================================================

describe('db command structure', () => {
  it('has correct name and description', () => {
    expect(dbCommand.name()).toBe('db')
    expect(dbCommand.description()).toContain('Database')
  })

  it('has all expected subcommands', () => {
    const subcommands = dbCommand.commands.map(cmd => cmd.name())

    expect(subcommands).toContain('status')
    expect(subcommands).toContain('export')
    expect(subcommands).toContain('validate')
    expect(subcommands).toContain('lookups')
    expect(subcommands).toContain('audit')
  })
})

// ============================================================================
// STATUS SUBCOMMAND
// ============================================================================

describe('db status subcommand', () => {
  const statusCmd = dbCommand.commands.find(cmd => cmd.name() === 'status')

  it('exists', () => {
    expect(statusCmd).toBeDefined()
  })

  it('has correct description', () => {
    expect(statusCmd?.description()).toContain('connection')
  })

  it('has no required arguments', () => {
    expect(statusCmd?.registeredArguments).toHaveLength(0)
  })
})

// ============================================================================
// EXPORT SUBCOMMAND
// ============================================================================

describe('db export subcommand', () => {
  const exportCmd = dbCommand.commands.find(cmd => cmd.name() === 'export')

  it('exists', () => {
    expect(exportCmd).toBeDefined()
  })

  it('has correct description', () => {
    expect(exportCmd?.description()).toContain('git-trackable')
  })
})

// ============================================================================
// VALIDATE SUBCOMMAND
// ============================================================================

describe('db validate subcommand', () => {
  const validateCmd = dbCommand.commands.find(cmd => cmd.name() === 'validate')

  it('exists', () => {
    expect(validateCmd).toBeDefined()
  })

  it('has correct description', () => {
    expect(validateCmd?.description()).toContain('integrity')
  })
})

// ============================================================================
// LOOKUPS SUBCOMMAND
// ============================================================================

describe('db lookups subcommand', () => {
  const lookupsCmd = dbCommand.commands.find(cmd => cmd.name() === 'lookups')

  it('exists', () => {
    expect(lookupsCmd).toBeDefined()
  })

  it('has correct description', () => {
    expect(lookupsCmd?.description()).toContain('FK lookup')
  })

  it('has optional collection argument', () => {
    const args = lookupsCmd?.registeredArguments
    expect(args).toHaveLength(1)
    expect(args?.[0].name()).toBe('collection')
    expect(args?.[0].required).toBe(false)
  })
})

// ============================================================================
// AUDIT SUBCOMMAND
// ============================================================================

describe('db audit subcommand', () => {
  const auditCmd = dbCommand.commands.find(cmd => cmd.name() === 'audit')

  it('exists', () => {
    expect(auditCmd).toBeDefined()
  })

  it('has correct description', () => {
    expect(auditCmd?.description()).toContain('naming convention')
  })

  it('has --fix option', () => {
    const fixOption = auditCmd?.options.find(opt => opt.long === '--fix')
    expect(fixOption).toBeDefined()
  })
})
