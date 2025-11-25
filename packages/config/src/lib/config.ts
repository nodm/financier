import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Config } from "./schema.js";
import { configSchema } from "./schema.js";

/**
 * Get the default configuration directory path
 */
export function getDefaultConfigDir(): string {
  return join(homedir(), ".financier");
}

/**
 * Load configuration from file or create default
 */
export async function loadConfig(configDir?: string): Promise<Config> {
  // Parse with schema defaults if configDir not provided
  const defaultConfig = configSchema.parse(
    configDir ? { configDir } : {}
  );
  const effectiveConfigDir = configDir ?? defaultConfig.configDir;
  const configPath = join(effectiveConfigDir, "config.json");

  // Ensure config directory exists
  if (!existsSync(effectiveConfigDir)) {
    await mkdir(effectiveConfigDir, { recursive: true });
  }

  // Load existing config or start with empty object
  let configData: Partial<Config> = {};

  if (existsSync(configPath)) {
    const fileContent = await readFile(configPath, "utf-8");
    configData = JSON.parse(fileContent);
  }

  // Merge with configDir and validate (Zod applies defaults)
  const config = configSchema.parse({
    ...configData,
    configDir: effectiveConfigDir,
  });

  // Create config file if it doesn't exist
  if (!existsSync(configPath)) {
    await saveConfig(config);
  }

  return config;
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: Config): Promise<void> {
  const configPath = join(config.configDir, "config.json");

  // Ensure directory exists
  await mkdir(config.configDir, { recursive: true });

  // Don't save configDir to file (it's derived from location)
  const { configDir: _configDir, ...configData } = config;

  await writeFile(configPath, JSON.stringify(configData, null, 2), "utf-8");
}

/**
 * Get the full database path (absolute)
 */
export function getDatabasePath(config: Config): string {
  if (config.databasePath.startsWith("/")) {
    return config.databasePath;
  }
  return join(config.configDir, config.databasePath);
}
