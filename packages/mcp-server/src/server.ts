import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetAccountsTool } from "./tools/get-accounts.js";
// Phase 7: Import other tool registration functions

export async function startServer() {
  // Create MCP server
  const server = new McpServer(
    {
      name: "financier-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register all tools
  registerGetAccountsTool(server);
  // Phase 7: Register other tools here

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[INFO] MCP Server running on stdio");
}
