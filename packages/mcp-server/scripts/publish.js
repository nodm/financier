#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(packageRoot, "../..");

console.log("🚀 Starting publish process...");

try {
  // Step 1: Build all dependencies
  console.log("📦 Building dependencies...");
  execSync("npx nx run-many -t build --projects=@nodm/financier-types,@nodm/financier-db", {
    cwd: workspaceRoot,
    stdio: "inherit",
  });

  // Step 2: Build MCP server
  console.log("📦 Building MCP server...");
  execSync("npx nx build mcp-server", {
    cwd: workspaceRoot,
    stdio: "inherit",
  });

  // Step 3: Bundle internal dependencies
  console.log("📦 Bundling internal dependencies...");
  execSync("node scripts/bundle.js", {
    cwd: packageRoot,
    stdio: "inherit",
  });

  // Step 4: Publish to npm
  console.log("📤 Publishing to npm...");
  execSync("npm publish", {
    cwd: packageRoot,
    stdio: "inherit",
  });

  console.log("✅ Publish complete!");
} catch (error) {
  console.error("❌ Publish failed:", error.message);
  process.exit(1);
}

