import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './docs/.vitepress/database/schema.ts',
  out: './drizzle',
  driver: 'pglite',
  dbCredentials: {
    // PGlite file-based database for local editing
    // Stores database in .pglite/ directory
    url: './.pglite'
  }
})
