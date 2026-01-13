import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './docs/.vitepress/database/schema.ts',
  out: './drizzle',
  // PGlite connection - will be configured when we set up the database
  // For now, Drizzle Studio will work with the schema definitions
})
