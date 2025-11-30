import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseError } from "@nodm/financier-types";
import { sql } from "drizzle-orm";
import { getDatabaseClient } from "./client.js";

/**
 * Get database directory path
 */
export function getDatabaseDir(): string {
  return process.env.FINANCIER_DATA_DIR || join(homedir(), ".financier");
}

/**
 * Get database file path
 */
export function getDatabasePath(): string {
  return join(getDatabaseDir(), "data.db");
}

/**
 * Ensure database directory exists
 */
export async function ensureDatabaseDirectory(): Promise<void> {
  const dbDir = dirname(getDatabasePath());

  try {
    await mkdir(dbDir, { recursive: true });
  } catch (error) {
    throw new DatabaseError(
      `Failed to create database directory: ${dbDir}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Check if database file exists
 */
export function databaseExists(): boolean {
  return existsSync(getDatabasePath());
}

/**
 * Initialize database (ensure directory exists and connect)
 */
export async function initializeDatabase(): Promise<void> {
  await ensureDatabaseDirectory();

  const client = getDatabaseClient();

  try {
    // Verify connection with simple query
    client.run(sql`SELECT 1`);
  } catch (error) {
    throw new DatabaseError(
      "Failed to initialize database",
      error instanceof Error ? error : undefined
    );
  }
}
