#!/usr/bin/env node

import { startServer } from "./server.js";

startServer().catch((error) => {
  console.error("[ERROR] Failed to start MCP server:", error);
  process.exit(1);
});
