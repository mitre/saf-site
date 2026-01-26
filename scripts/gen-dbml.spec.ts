import { describe, expect, it } from 'vitest'
import { findAllRefs, generateTableGroups } from './gen-dbml'

describe('gen-dbml', () => {
  describe('findAllRefs', () => {
    it('finds simple FK references', () => {
      const schema = `
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
})

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
})
`
      const refs = findAllRefs(schema)
      expect(refs).toContain('ref: posts.userId > users.id')
    })

    it('finds references with .notNull()', () => {
      const schema = `
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
})

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id),
})
`
      const refs = findAllRefs(schema)
      expect(refs).toContain('ref: items.categoryId > categories.id')
    })

    it('finds multiple references in same table', () => {
      const schema = `
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
})

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
})

export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  teamId: text('team_id').references(() => teams.id),
})
`
      const refs = findAllRefs(schema)
      expect(refs).toContain('ref: memberships.userId > users.id')
      expect(refs).toContain('ref: memberships.teamId > teams.id')
    })

    it('returns empty array when no references', () => {
      const schema = `
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
})
`
      const refs = findAllRefs(schema)
      expect(refs).toEqual([])
    })

    it('handles variable name different from table name', () => {
      const schema = `
export const contentTable = sqliteTable('content', {
  id: text('id').primaryKey(),
})

export const tagsTable = sqliteTable('content_tags', {
  contentId: text('content_id').references(() => contentTable.id),
})
`
      const refs = findAllRefs(schema)
      expect(refs).toContain('ref: content_tags.contentId > content.id')
    })
  })

  describe('generateTableGroups', () => {
    it('groups core content tables', () => {
      const schema = `
export const content = sqliteTable('content', {})
export const targets = sqliteTable('targets', {})
export const contentTags = sqliteTable('content_tags', {})
`
      const groups = generateTableGroups(schema)
      expect(groups).toContain('TableGroup core_content')
      expect(groups).toContain('content')
      expect(groups).toContain('targets')
      expect(groups).toContain('content_tags')
    })

    it('groups tool tables', () => {
      const schema = `
export const tools = sqliteTable('tools', {})
export const toolTypes = sqliteTable('tool_types', {})
export const distributions = sqliteTable('distributions', {})
`
      const groups = generateTableGroups(schema)
      expect(groups).toContain('TableGroup tools_distributions')
      expect(groups).toContain('tools')
      expect(groups).toContain('tool_types')
      expect(groups).toContain('distributions')
    })

    it('groups learning tables', () => {
      const schema = `
export const courses = sqliteTable('courses', {})
export const media = sqliteTable('media', {})
export const courseModules = sqliteTable('course_modules', {})
`
      const groups = generateTableGroups(schema)
      expect(groups).toContain('TableGroup learning')
      expect(groups).toContain('courses')
      expect(groups).toContain('media')
      expect(groups).toContain('course_modules')
    })

    it('puts unmatched tables in reference group', () => {
      const schema = `
export const randomTable = sqliteTable('random_stuff', {})
export const otherTable = sqliteTable('other_things', {})
`
      const groups = generateTableGroups(schema)
      expect(groups).toContain('TableGroup reference')
      expect(groups).toContain('random_stuff')
      expect(groups).toContain('other_things')
    })

    it('returns empty string when no tables', () => {
      const schema = `// No tables here`
      const groups = generateTableGroups(schema)
      expect(groups).toBe('')
    })
  })
})
