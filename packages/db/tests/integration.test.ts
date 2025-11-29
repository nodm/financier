import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import {
  disconnectDatabase,
  getDatabaseClient,
  resetDatabaseClient,
} from "../src/lib/client.js";
import { initializeDatabase } from "../src/lib/utils.js";

describe("Database Integration", () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeAll(async () => {
    testDir = mkdtempSync(join(tmpdir(), "financier-test-"));
    originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(testDir, "test.db")}`;
    await initializeDatabase();
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
    const result = await client.$queryRaw`SELECT 1 as value`;

    // Assert - SQLite returns BigInt for integers
    expect(result).toEqual([{ value: 1n }]);
  });

  it("should allow executing raw queries", async () => {
    // Arrange
    const client = getDatabaseClient();

    // Act
    const result = await client.$queryRaw`SELECT sqlite_version() as version`;

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("version");
  });

  it("should properly disconnect after executing queries", async () => {
    // Arrange
    const client = getDatabaseClient();
    await client.$queryRaw`SELECT 1`;

    // Act
    await disconnectDatabase();

    // Assert - new client should be different instance
    const newClient = getDatabaseClient();
    expect(newClient).not.toBe(client);
  });
});
