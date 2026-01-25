import type { DrizzleColumn, DrizzleFK } from './gen-pb-migrations'
import { describe, expect, it } from 'vitest'
import {
  drizzleColumnToPocketbaseField,
  generateMigrationFile,
  TYPE_MAP,
} from './gen-pb-migrations'

describe('genPbMigrations', () => {
  describe('tYPE_MAP', () => {
    it('maps SQLiteText to text', () => {
      expect(TYPE_MAP.SQLiteText).toBe('text')
    })

    it('maps SQLiteInteger to number', () => {
      expect(TYPE_MAP.SQLiteInteger).toBe('number')
    })

    it('maps SQLiteBoolean to bool', () => {
      expect(TYPE_MAP.SQLiteBoolean).toBe('bool')
    })

    it('maps SQLiteTimestamp to date', () => {
      expect(TYPE_MAP.SQLiteTimestamp).toBe('date')
    })

    it('maps SQLiteReal to number', () => {
      expect(TYPE_MAP.SQLiteReal).toBe('number')
    })
  })

  describe('drizzleColumnToPocketbaseField', () => {
    it('converts text column', () => {
      const col: DrizzleColumn = {
        name: 'title',
        columnType: 'SQLiteText',
        notNull: true,
        primary: false,
        isUnique: false,
        hasDefault: false,
      }
      const result = drizzleColumnToPocketbaseField(col, [], new Map())

      expect(result.name).toBe('title')
      expect(result.type).toBe('text')
      expect(result.required).toBe(true)
    })

    it('converts integer column with onlyInt option', () => {
      const col: DrizzleColumn = {
        name: 'count',
        columnType: 'SQLiteInteger',
        notNull: false,
        primary: false,
        isUnique: false,
        hasDefault: false,
      }
      const result = drizzleColumnToPocketbaseField(col, [], new Map())

      expect(result.name).toBe('count')
      expect(result.type).toBe('number')
      expect(result.required).toBe(false)
      expect(result.options?.onlyInt).toBe(true)
    })

    it('converts boolean column', () => {
      const col: DrizzleColumn = {
        name: 'is_active',
        columnType: 'SQLiteBoolean',
        notNull: true,
        primary: false,
        isUnique: false,
        hasDefault: false,
      }
      const result = drizzleColumnToPocketbaseField(col, [], new Map())

      expect(result.type).toBe('bool')
      expect(result.required).toBe(true)
    })

    it('converts timestamp column to date', () => {
      const col: DrizzleColumn = {
        name: 'created_at',
        columnType: 'SQLiteTimestamp',
        notNull: false,
        primary: false,
        isUnique: false,
        hasDefault: true,
      }
      const result = drizzleColumnToPocketbaseField(col, [], new Map())

      expect(result.type).toBe('date')
    })

    it('converts FK column to relation type', () => {
      const col: DrizzleColumn = {
        name: 'user_id',
        columnType: 'SQLiteText',
        notNull: true,
        primary: false,
        isUnique: false,
        hasDefault: false,
      }
      const fks: DrizzleFK[] = [{
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
      }]
      const collectionIdMap = new Map([['users', 'pbc_users123']])

      const result = drizzleColumnToPocketbaseField(col, fks, collectionIdMap)

      expect(result.type).toBe('relation')
      expect(result.required).toBe(true)
      expect(result.options?.collectionId).toBe('pbc_users123')
      expect(result.options?.cascadeDelete).toBe(true)
      expect(result.options?.maxSelect).toBe(1)
    })

    it('uses table name when collection ID not in map', () => {
      const col: DrizzleColumn = {
        name: 'category_id',
        columnType: 'SQLiteText',
        notNull: false,
        primary: false,
        isUnique: false,
        hasDefault: false,
      }
      const fks: DrizzleFK[] = [{
        fromColumn: 'category_id',
        toTable: 'categories',
        toColumn: 'id',
      }]

      const result = drizzleColumnToPocketbaseField(col, fks, new Map())

      expect(result.type).toBe('relation')
      expect(result.options?.collectionId).toBe('categories')
    })

    it('falls back to text for unknown column types', () => {
      const col: DrizzleColumn = {
        name: 'unknown_field',
        columnType: 'SQLiteUnknownType',
        notNull: false,
        primary: false,
        isUnique: false,
        hasDefault: false,
      }
      const result = drizzleColumnToPocketbaseField(col, [], new Map())

      expect(result.type).toBe('text')
    })
  })

  describe('generateMigrationFile', () => {
    it('generates create migration with correct structure', () => {
      const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'count', type: 'number', required: false, options: { onlyInt: true } },
      ]

      const result = generateMigrationFile('create', 'items', fields, 'pbc_items123')

      expect(result).toContain('/// <reference path="../pb_data/types.d.ts" />')
      expect(result).toContain('migrate((app) => {')
      expect(result).toContain('const collection = new Collection({')
      expect(result).toContain('"name": "items"')
      expect(result).toContain('"id": "pbc_items123"')
      expect(result).toContain('"type": "base"')
      expect(result).toContain('return app.save(collection)')
      // Rollback function
      expect(result).toContain('return app.delete(collection)')
    })

    it('generates create migration with system ID field', () => {
      const fields = [
        { name: 'name', type: 'text', required: true },
      ]

      const result = generateMigrationFile('create', 'users', fields)

      // Should have system ID field
      expect(result).toContain('"name": "id"')
      expect(result).toContain('"primaryKey": true')
      expect(result).toContain('"system": true')
      expect(result).toContain('"autogeneratePattern": "[a-z0-9]{15}"')
    })

    it('generates delete migration', () => {
      const result = generateMigrationFile('delete', 'old_table', [], 'pbc_old123')

      expect(result).toContain('/// <reference path="../pb_data/types.d.ts" />')
      expect(result).toContain('app.findCollectionByNameOrId("pbc_old123")')
      expect(result).toContain('return app.delete(collection)')
      expect(result).toContain('// Rollback: recreate the collection')
    })

    it('generates update migration placeholder', () => {
      const result = generateMigrationFile('update', 'my_table', [])

      expect(result).toContain('/// <reference path="../pb_data/types.d.ts" />')
      expect(result).toContain('// TODO: Implement update migration for my_table')
    })

    it('skips user-provided ID field (uses system ID)', () => {
      const fields = [
        { name: 'id', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
      ]

      const result = generateMigrationFile('create', 'items', fields)

      // Should only have one id field (system one), not duplicate
      const idMatches = result.match(/"name": "id"/g)
      expect(idMatches?.length).toBe(1)
    })

    it('includes relation field options', () => {
      const fields = [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'pbc_users123',
            cascadeDelete: true,
            maxSelect: 1,
            minSelect: 0,
          },
        },
      ]

      const result = generateMigrationFile('create', 'posts', fields)

      expect(result).toContain('"type": "relation"')
      expect(result).toContain('"collectionId": "pbc_users123"')
      expect(result).toContain('"cascadeDelete": true')
      expect(result).toContain('"maxSelect": 1')
    })

    it('generates auto collection ID when not provided', () => {
      const result = generateMigrationFile('create', 'new_table', [])

      // Should have a generated ID starting with pbc_
      expect(result).toMatch(/"id": "pbc_\d+"/)
    })
  })
})
