import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var _careerverseDb: any;
  // eslint-disable-next-line no-var
  var _careerversePglite: any;
}

export function getDb() {
  if (globalThis._careerverseDb) {
    return globalThis._careerverseDb;
  }

  const databaseUrl = process.env.DATABASE_URL || "";

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("sslmode=require") || databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
    });
    const instance = drizzlePg(pool, { schema });
    globalThis._careerverseDb = instance;
    return instance;
  }

  // Serverless or Local embedded PGlite database
  const isVercel = Boolean(process.env.VERCEL);
  const baseDir = isVercel ? "/tmp" : process.cwd();
  const dbDir = path.join(baseDir, ".pgdata");

  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch {
      // In-memory fallback if filesystem is read-only
    }
  }

  if (!globalThis._careerversePglite) {
    const targetDir = fs.existsSync(dbDir) ? dbDir : undefined;
    globalThis._careerversePglite = new PGlite(targetDir);
  }

  const instance = drizzlePglite(globalThis._careerversePglite, { schema });
  globalThis._careerverseDb = instance;
  return instance;
}

export const db = getDb();
export { schema };
export * from "./schema";
