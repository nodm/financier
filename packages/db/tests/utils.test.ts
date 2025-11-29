import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { resetDatabaseClient } from "../src/lib/client.js";
import {
  databaseExists,
  ensureDatabaseDirectory,
  getDatabaseDir,
  getDatabasePath,
  initializeDatabase,
} from "../src/lib/utils.js";

describe("Database Utils", () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "financier-test-"));
    originalEnv = process.env.FINANCIER_DATA_DIR;
    process.env.FINANCIER_DATA_DIR = testDir;
    process.env.DATABASE_URL = `file:${join(testDir, "data.db")}`;
  });

  afterEach(async () => {
    await resetDatabaseClient();
    if (originalEnv) {
      process.env.FINANCIER_DATA_DIR = originalEnv;
    } else {
      delete process.env.FINANCIER_DATA_DIR;
    }
    delete process.env.DATABASE_URL;
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("getDatabaseDir", () => {
    it("should return custom directory from FINANCIER_DATA_DIR env var", () => {
      // Act
      const dbDir = getDatabaseDir();

      // Assert
      expect(dbDir).toBe(testDir);
    });

    it("should return default ~/.financier when no env var set", () => {
      // Arrange
      delete process.env.FINANCIER_DATA_DIR;

      // Act
      const dbDir = getDatabaseDir();

      // Assert
      expect(dbDir).toBe(join(homedir(), ".financier"));
    });
  });

  describe("getDatabasePath", () => {
    it("should return path to data.db in database directory", () => {
      // Act
      const dbPath = getDatabasePath();

      // Assert
      expect(dbPath).toBe(join(testDir, "data.db"));
    });
  });

  describe("ensureDatabaseDirectory", () => {
    it("should create database directory if it does not exist", async () => {
      // Arrange
      const newDir = join(testDir, "newdir");
      process.env.FINANCIER_DATA_DIR = newDir;

      // Act
      await ensureDatabaseDirectory();

      // Assert
      expect(existsSync(newDir)).toBe(true);
    });

    it("should not error if directory already exists", async () => {
      // Act & Assert
      await expect(ensureDatabaseDirectory()).resolves.not.toThrow();
      await expect(ensureDatabaseDirectory()).resolves.not.toThrow();
    });
  });

  describe("databaseExists", () => {
    it("should return false when database file does not exist", () => {
      // Act
      const exists = databaseExists();

      // Assert
      expect(exists).toBe(false);
    });

    it("should return true when database file exists", async () => {
      // Arrange
      await initializeDatabase();

      // Act
      const exists = databaseExists();

      // Assert
      expect(exists).toBe(true);
    });
  });

  describe("initializeDatabase", () => {
    it("should create database directory and connect", async () => {
      // Act
      await initializeDatabase();

      // Assert
      expect(existsSync(testDir)).toBe(true);
      expect(databaseExists()).toBe(true);
    });

    it("should verify connection with simple query", async () => {
      // Act & Assert
      await expect(initializeDatabase()).resolves.not.toThrow();
    });
  });
});
