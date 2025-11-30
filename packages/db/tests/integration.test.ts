import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { sql } from "drizzle-orm";
import {
  disconnectDatabase,
  getDatabaseClient,
  resetDatabaseClient,
} from "../src/lib/client.js";
import { initializeDatabase } from "../src/lib/utils.js";
import { setupTestDatabase } from "./helpers/setup-test-db.js";

describe("Database Integration", () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeAll(async () => {
    testDir = mkdtempSync(join(tmpdir(), "financier-test-"));
    originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(testDir, "test.db")}`;
    await initializeDatabase();
    setupTestDatabase();
  });

  afterAll(async () => {
    await resetDatabaseClient();
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
    rmSync(testDir, { recursive: true, force: true });
  });

  it("should initialize database and connect successfully", async () => {
    // Arrange
    const client = getDatabaseClient();

    // Act
    const result = client.get<{ value: number }>(sql`SELECT 1 as value`);

    // Assert
    expect(result).toEqual({ value: 1 });
  });

  it("should allow executing raw queries", async () => {
    // Arrange
    const client = getDatabaseClient();

    // Act
    const result = client.get<{ version: string }>(
      sql`SELECT sqlite_version() as version`
    );

    // Assert
    expect(result).toHaveProperty("version");
  });

  it("should properly disconnect after executing queries", async () => {
    // Arrange
    const client = getDatabaseClient();
    client.run(sql`SELECT 1`);

    // Act
    await disconnectDatabase();

    // Assert - new client should be different instance
    const newClient = getDatabaseClient();
    expect(newClient).not.toBe(client);
  });
});
