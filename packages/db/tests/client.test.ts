import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  disconnectDatabase,
  getDatabaseClient,
  resetDatabaseClient,
} from "../src/lib/client.js";
import { setupTestDatabase } from "./helpers/setup-test-db.js";

describe("Database Client", () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Create temporary directory for test database
    testDir = mkdtempSync(join(tmpdir(), "financier-test-"));
    originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(testDir, "test.db")}`;
    setupTestDatabase();
  });

  afterEach(async () => {
    // Clean up
    await resetDatabaseClient();
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("getDatabaseClient", () => {
    it("should return a Drizzle client instance", () => {
      // Act
      const client = getDatabaseClient();

      // Assert
      expect(client).toBeDefined();
      expect(client.select).toBeDefined();
      expect(client.insert).toBeDefined();
    });

    it("should return the same instance on multiple calls (singleton)", () => {
      // Act
      const client1 = getDatabaseClient();
      const client2 = getDatabaseClient();

      // Assert
      expect(client1).toBe(client2);
    });

    it("should use DATABASE_URL environment variable", () => {
      // Arrange
      const customPath = join(testDir, "custom.db");
      process.env.DATABASE_URL = `file:${customPath}`;

      // Act
      const client = getDatabaseClient();

      // Assert
      expect(client).toBeDefined();
    });

    it("should handle file:// protocol URLs", () => {
      // Arrange
      process.env.DATABASE_URL = `file://${join(testDir, "protocol.db")}`;

      // Act
      const client = getDatabaseClient();

      // Assert
      expect(client).toBeDefined();
    });

    it("should fallback to getDatabasePath() when DATABASE_URL is not set", async () => {
      // Arrange
      delete process.env.DATABASE_URL;
      process.env.FINANCIER_DATA_DIR = testDir;
      await resetDatabaseClient();

      // Act
      const client = getDatabaseClient();

      // Assert
      expect(client).toBeDefined();
      expect(client.select).toBeDefined();
    });
  });

  describe("disconnectDatabase", () => {
    it("should disconnect from database", async () => {
      // Arrange
      const client = getDatabaseClient();

      // Act
      await disconnectDatabase();

      // Assert - getting client again should return new instance
      const newClient = getDatabaseClient();
      expect(newClient).not.toBe(client);
    });

    it("should handle disconnect when not connected", async () => {
      // Act & Assert - should not throw
      await expect(disconnectDatabase()).resolves.not.toThrow();
    });
  });

  describe("resetDatabaseClient", () => {
    it("should reset the database client", async () => {
      // Arrange
      const client = getDatabaseClient();

      // Act
      await resetDatabaseClient();
      const newClient = getDatabaseClient();

      // Assert
      expect(newClient).not.toBe(client);
    });
  });
});
