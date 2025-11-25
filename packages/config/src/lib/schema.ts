import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

/**
 * Configuration schema for The Financier application
 */
export const configSchema = z.object({
  /**
   * Database file path (relative to config directory or absolute)
   */
  databasePath: z.string().default("data.db"),

  /**
   * Configuration directory path (usually ~/.financier)
   */
  configDir: z.string().default(join(homedir(), ".financier")),

  /**
   * Import settings
   */
  import: z
    .object({
      /**
       * Batch size for bulk inserts
       */
      batchSize: z.number().int().positive().default(1000),

      /**
       * Skip duplicate transactions during import
       */
      skipDuplicates: z.boolean().default(true),
    })
    .default({ batchSize: 1000, skipDuplicates: true }),

  /**
   * MCP server settings
   */
  mcp: z
    .object({
      /**
       * Default page size for paginated queries
       */
      defaultPageSize: z.number().int().positive().default(100),

      /**
       * Maximum page size allowed
       */
      maxPageSize: z.number().int().positive().default(1000),
    })
    .default({ defaultPageSize: 100, maxPageSize: 1000 }),
});

export type Config = z.infer<typeof configSchema>;
