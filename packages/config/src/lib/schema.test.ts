import { describe, expect, it } from "@jest/globals";
import { configSchema } from "./schema.js";

describe("configSchema", () => {
  it("should validate valid config", () => {
    const config = {
      configDir: "/home/user/.financier",
      databasePath: "data.db",
      import: {
        batchSize: 1000,
        skipDuplicates: true,
      },
      mcp: {
        defaultPageSize: 100,
        maxPageSize: 1000,
      },
    };

    const result = configSchema.safeParse(config);

    expect(result.success).toBe(true);
  });

  it("should apply default values for optional fields", () => {
    const config = {
      configDir: "/home/user/.financier",
    };

    const result = configSchema.parse(config);

    expect(result.databasePath).toBe("data.db");
    expect(result.import.batchSize).toBe(1000);
    expect(result.import.skipDuplicates).toBe(true);
    expect(result.mcp.defaultPageSize).toBe(100);
    expect(result.mcp.maxPageSize).toBe(1000);
  });

  it("should reject invalid batchSize", () => {
    const config = {
      configDir: "/home/user/.financier",
      import: {
        batchSize: -1,
      },
    };

    const result = configSchema.safeParse(config);

    expect(result.success).toBe(false);
  });

  it("should reject invalid maxPageSize", () => {
    const config = {
      configDir: "/home/user/.financier",
      mcp: {
        maxPageSize: 0,
      },
    };

    const result = configSchema.safeParse(config);

    expect(result.success).toBe(false);
  });

  it("should apply default configDir", () => {
    const config = {
      databasePath: "data.db",
    };

    const result = configSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.configDir).toContain(".financier");
    }
  });
});
