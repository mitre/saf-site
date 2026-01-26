import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './docs/.vitepress/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // SQLite database for local editing via libsql
    // Clean git diffs via sqlite-diffable
    url: 'file:.data/saf.db',
  },
})
