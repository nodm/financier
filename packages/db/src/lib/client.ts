import { DatabaseError } from "@nodm/financier-types";
import * as BetterSqlite3Module from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import * as schema from "../schema/index.js";
import { getDatabasePath } from "./utils.js";

// Handle ESM/CJS interop - better-sqlite3 is a CommonJS module
// Tested with better-sqlite3@7.x - may need adjustment for different versions
type BetterSqlite3Type = typeof import("better-sqlite3");
const Database = (
  "default" in BetterSqlite3Module
    ? (BetterSqlite3Module as { default: BetterSqlite3Type }).default
    : BetterSqlite3Module
) as BetterSqlite3Type;

// Runtime check: ensure Database is a constructor function
if (typeof Database !== "function") {
  throw new Error(
    "better-sqlite3 Database constructor not found. " +
      "Check the module export structure and version compatibility. " +
      "Tested with better-sqlite3@7.x. " +
      "If you recently upgraded better-sqlite3, update the ESM/CJS interop logic."
  );
}

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqliteClient: ReturnType<typeof Database> | null = null;

/**
 * Get or create Drizzle client singleton
 */
export function getDatabaseClient(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    try {
      const databaseUrl =
        process.env.DATABASE_URL || `file:${getDatabasePath()}`;

      // Parse file: or file:// URLs correctly
      const dbPath = databaseUrl.startsWith("file://")
        ? databaseUrl.slice(7)
        : databaseUrl.startsWith("file:")
          ? databaseUrl.slice(5)
          : databaseUrl;

      sqliteClient = new Database(dbPath, {
        verbose:
          process.env.NODE_ENV === "development" ? console.log : undefined,
        timeout: 5000,
      });

      db = drizzle({ client: sqliteClient, schema });
    } catch (error) {
      throw new DatabaseError(
        "Failed to initialize database client",
        error instanceof Error ? error : undefined
      );
    }
  }
  return db;
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (sqliteClient) {
    sqliteClient.close();
    sqliteClient = null;
    db = null;
  }
}

/**
 * Reset database client (useful for testing)
 */
export async function resetDatabaseClient(): Promise<void> {
  await disconnectDatabase();
}
