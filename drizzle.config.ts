import { defineConfig } from "drizzle-kit";

const DATABASE_URL = "postgresql://neondb_owner:npg_enNyPYF4H2VW@ep-small-unit-a8k45mqj-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
