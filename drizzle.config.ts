import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "node:path";

// Load environment variables from .env.local or .env
const envFiles = [".env.local", ".env"];
for (const file of envFiles) {
  config({
    path: path.resolve(process.cwd(), file),
    override: true,
  });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Please ensure the database is provisioned and DATABASE_URL is set in .env.local or .env");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
