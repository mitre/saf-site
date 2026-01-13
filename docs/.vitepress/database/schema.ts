import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Status enum values
export const STATUS_ACTIVE = 'active'
export const STATUS_INACTIVE = 'inactive'
export const STATUS_BETA = 'beta'
export const STATUS_DEPRECATED = 'deprecated'
export const STATUS_DRAFT = 'draft'
export const STATUS_SUNSET = 'sunset'

// Tags table
export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  description: text('description'),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Organizations (defined before teams due to FK reference)
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Teams
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organization: text('organization').references(() => organizations.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Technologies
export const technologies = pgTable('technologies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  logo: text('logo'),
  category: text('category'),
  type: text('type'), // 'validation', 'hardening', or 'both'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Standards
export const standards = pgTable('standards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  type: text('type'), // CIS, STIG, etc.
  category: text('category'),
  vendor: text('vendor'),
  version: text('version'),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Profiles
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version'),
  platform: text('platform'),
  framework: text('framework'),
  technology: text('technology').references(() => technologies.id),
  vendor: text('vendor'),
  organization: text('organization').references(() => organizations.id),
  team: text('team').references(() => teams.id),
  github: text('github'),
  details: text('details'),
  standard: text('standard').references(() => standards.id),
  standardVersion: text('standard_version'),
  shortDescription: text('short_description'),
  requirements: text('requirements'),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Profiles Tags Junction Table
export const profilesTags = pgTable('profiles_tags', {
  profileId: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.profileId, table.tagId] })
}))

// Hardening Profiles
export const hardeningProfiles = pgTable('hardening_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version'),
  platform: text('platform'),
  type: text('type'), // Ansible, Chef, Terraform, etc.
  technology: text('technology').references(() => technologies.id),
  vendor: text('vendor'),
  organization: text('organization').references(() => organizations.id),
  team: text('team').references(() => teams.id),
  github: text('github'),
  details: text('details'),
  standard: text('standard').references(() => standards.id),
  standardVersion: text('standard_version'),
  shortDescription: text('short_description'),
  requirements: text('requirements'),
  category: text('category'),
  difficulty: text('difficulty'), // easy, medium, hard
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Hardening Profiles Tags Junction Table
export const hardeningProfilesTags = pgTable('hardening_profiles_tags', {
  hardeningProfileId: text('hardening_profile_id').notNull().references(() => hardeningProfiles.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.hardeningProfileId, table.tagId] })
}))

// Validation-to-Hardening relationship
export const validationToHardening = pgTable('validation_to_hardening', {
  validationProfileId: text('validation_profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  hardeningProfileId: text('hardening_profile_id').notNull().references(() => hardeningProfiles.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.validationProfileId, table.hardeningProfileId] })
}))

// Tools
export const tools = pgTable('tools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version'),
  description: text('description'),
  website: text('website'),
  logo: text('logo'),
  technology: text('technology').references(() => technologies.id),
  organization: text('organization').references(() => organizations.id),
  github: text('github'),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// Capabilities
export const capabilities = pgTable('capabilities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  status: text('status').notNull().default(STATUS_ACTIVE)
})

// ============ RELATIONS ============

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organizationRef: one(organizations, {
    fields: [teams.organization],
    references: [organizations.id]
  })
}))

export const organizationsRelations = relations(organizations, ({ many }) => ({
  teams: many(teams),
  profiles: many(profiles),
  hardeningProfiles: many(hardeningProfiles),
  tools: many(tools)
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  organizationRef: one(organizations, {
    fields: [profiles.organization],
    references: [organizations.id]
  }),
  teamRef: one(teams, {
    fields: [profiles.team],
    references: [teams.id]
  }),
  technologyRef: one(technologies, {
    fields: [profiles.technology],
    references: [technologies.id]
  }),
  standardRef: one(standards, {
    fields: [profiles.standard],
    references: [standards.id]
  }),
  tags: many(profilesTags)
}))

export const hardeningProfilesRelations = relations(hardeningProfiles, ({ one, many }) => ({
  organizationRef: one(organizations, {
    fields: [hardeningProfiles.organization],
    references: [organizations.id]
  }),
  teamRef: one(teams, {
    fields: [hardeningProfiles.team],
    references: [teams.id]
  }),
  technologyRef: one(technologies, {
    fields: [hardeningProfiles.technology],
    references: [technologies.id]
  }),
  standardRef: one(standards, {
    fields: [hardeningProfiles.standard],
    references: [standards.id]
  }),
  tags: many(hardeningProfilesTags)
}))

export const toolsRelations = relations(tools, ({ one }) => ({
  organizationRef: one(organizations, {
    fields: [tools.organization],
    references: [organizations.id]
  }),
  technologyRef: one(technologies, {
    fields: [tools.technology],
    references: [technologies.id]
  })
}))

export const technologiesRelations = relations(technologies, ({ many }) => ({
  profiles: many(profiles),
  hardeningProfiles: many(hardeningProfiles),
  tools: many(tools)
}))

export const standardsRelations = relations(standards, ({ many }) => ({
  profiles: many(profiles),
  hardeningProfiles: many(hardeningProfiles)
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  profiles: many(profilesTags),
  hardeningProfiles: many(hardeningProfilesTags)
}))

export const profilesTagsRelations = relations(profilesTags, ({ one }) => ({
  profile: one(profiles, {
    fields: [profilesTags.profileId],
    references: [profiles.id]
  }),
  tag: one(tags, {
    fields: [profilesTags.tagId],
    references: [tags.id]
  })
}))

export const hardeningProfilesTagsRelations = relations(hardeningProfilesTags, ({ one }) => ({
  hardeningProfile: one(hardeningProfiles, {
    fields: [hardeningProfilesTags.hardeningProfileId],
    references: [hardeningProfiles.id]
  }),
  tag: one(tags, {
    fields: [hardeningProfilesTags.tagId],
    references: [tags.id]
  })
}))

// ============ ZOD SCHEMAS ============

export const insertTagSchema = createInsertSchema(tags)
export const selectTagSchema = createSelectSchema(tags)

export const insertOrganizationSchema = createInsertSchema(organizations)
export const selectOrganizationSchema = createSelectSchema(organizations)

export const insertTeamSchema = createInsertSchema(teams)
export const selectTeamSchema = createSelectSchema(teams)

export const insertTechnologySchema = createInsertSchema(technologies)
export const selectTechnologySchema = createSelectSchema(technologies)

export const insertStandardSchema = createInsertSchema(standards)
export const selectStandardSchema = createSelectSchema(standards)

export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)

export const insertHardeningProfileSchema = createInsertSchema(hardeningProfiles)
export const selectHardeningProfileSchema = createSelectSchema(hardeningProfiles)

export const insertToolSchema = createInsertSchema(tools)
export const selectToolSchema = createSelectSchema(tools)

export const insertCapabilitySchema = createInsertSchema(capabilities)
export const selectCapabilitySchema = createSelectSchema(capabilities)

// Type exports
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert

export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert

export type Technology = typeof technologies.$inferSelect
export type NewTechnology = typeof technologies.$inferInsert

export type Standard = typeof standards.$inferSelect
export type NewStandard = typeof standards.$inferInsert

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export type HardeningProfile = typeof hardeningProfiles.$inferSelect
export type NewHardeningProfile = typeof hardeningProfiles.$inferInsert

export type Tool = typeof tools.$inferSelect
export type NewTool = typeof tools.$inferInsert

export type Capability = typeof capabilities.$inferSelect
export type NewCapability = typeof capabilities.$inferInsert
