import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";
import { fetchNeonBatch } from "./neonTransport";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
neonConfig.fetchFunction = fetchNeonBatch;
export const db = drizzle(sql, { schema });