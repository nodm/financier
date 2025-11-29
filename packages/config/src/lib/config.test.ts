import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { getDatabasePath, loadConfig, saveConfig } from "./config.js";

describe("config", () => {
  const testConfigDir = join(process.cwd(), "test-output", "config-test");

  beforeEach(async () => {
    // Clean up test directory
    if (existsSync(testConfigDir)) {
      await rm(testConfigDir, { recursive: true });
    }
    await mkdir(testConfigDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    if (existsSync(testConfigDir)) {
      await rm(testConfigDir, { recursive: true });
    }
  });

  describe("loadConfig", () => {
    it("should create default config if file does not exist", async () => {
      const config = await loadConfig(testConfigDir);

      expect(config.configDir).toBe(testConfigDir);
      expect(config.databasePath).toBe("data.db");
      expect(config.import.batchSize).toBe(1000);
      expect(config.import.skipDuplicates).toBe(true);
      expect(config.mcp.defaultPageSize).toBe(100);
      expect(config.mcp.maxPageSize).toBe(1000);
    });

    it("should create config.json file", async () => {
      await loadConfig(testConfigDir);

      const configPath = join(testConfigDir, "config.json");
      expect(existsSync(configPath)).toBe(true);
    });

    it("should load existing config from file", async () => {
      // Create config with custom values
      const customConfig = {
        databasePath: "custom.db",
        import: {
          batchSize: 500,
          skipDuplicates: false,
        },
        mcp: {
          defaultPageSize: 50,
          maxPageSize: 500,
        },
      };

      await mkdir(testConfigDir, { recursive: true });
      await saveConfig({ ...customConfig, configDir: testConfigDir });

      // Load config
      const config = await loadConfig(testConfigDir);

      expect(config.databasePath).toBe("custom.db");
      expect(config.import.batchSize).toBe(500);
      expect(config.import.skipDuplicates).toBe(false);
    });

    it("should validate config with Zod schema", async () => {
      const config = await loadConfig(testConfigDir);

      // Should have all required fields
      expect(config.configDir).toBeDefined();
      expect(config.databasePath).toBeDefined();
      expect(config.import).toBeDefined();
      expect(config.mcp).toBeDefined();
    });
  });

  describe("saveConfig", () => {
    it("should save config to file", async () => {
      const config = await loadConfig(testConfigDir);

      config.databasePath = "test.db";
      config.import.batchSize = 2000;

      await saveConfig(config);

      // Read file and verify
      const configPath = join(testConfigDir, "config.json");
      const fileContent = await readFile(configPath, "utf-8");
      const savedConfig = JSON.parse(fileContent);

      expect(savedConfig.databasePath).toBe("test.db");
      expect(savedConfig.import.batchSize).toBe(2000);
    });

    it("should not save configDir to file", async () => {
      const config = await loadConfig(testConfigDir);
      await saveConfig(config);

      const configPath = join(testConfigDir, "config.json");
      const fileContent = await readFile(configPath, "utf-8");
      const savedConfig = JSON.parse(fileContent);

      expect(savedConfig.configDir).toBeUndefined();
    });
  });

  describe("getDatabasePath", () => {
    it("should return absolute path when databasePath is relative", async () => {
      const config = await loadConfig(testConfigDir);
      config.databasePath = "data.db";

      const dbPath = getDatabasePath(config);

      expect(dbPath).toBe(join(testConfigDir, "data.db"));
    });

    it("should return databasePath when it is absolute", async () => {
      const config = await loadConfig(testConfigDir);
      config.databasePath = "/absolute/path/data.db";

      const dbPath = getDatabasePath(config);

      expect(dbPath).toBe("/absolute/path/data.db");
    });
  });
});
