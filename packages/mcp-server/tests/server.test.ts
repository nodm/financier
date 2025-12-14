import { describe, expect, it } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetAccountsTool } from "../src/tools/get-accounts.js";

describe("MCP Server", () => {
  it("should create server without errors", () => {
    const server = new McpServer(
      { name: "financier-mcp-server", version: "0.1.0" },
      { capabilities: { tools: {} } }
    );

    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(McpServer);
  });

  it("should register get_accounts tool without errors", () => {
    const server = new McpServer(
      { name: "test-server", version: "0.0.1" },
      { capabilities: { tools: {} } }
    );

    // Should not throw when registering tool
    expect(() => {
      registerGetAccountsTool(server);
    }).not.toThrow();
  });

  // Phase 7: Add integration tests for tool execution with actual MCP protocol calls
});
