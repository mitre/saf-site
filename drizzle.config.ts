import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './docs/.vitepress/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // PGlite file-based database for local editing
    // This creates a local Postgres database in the .pglite directory
    url: 'file://.pglite/data'
  }
})
