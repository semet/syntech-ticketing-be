import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts', // Adjust path to your schema
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
