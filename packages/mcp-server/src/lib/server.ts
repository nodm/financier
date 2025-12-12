import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDatabaseClient } from "@nodm/financier-db";
import { handleGetAccounts } from "./handlers/get-accounts-handler.js";
import { handleGetStatistics } from "./handlers/get-statistics-handler.js";
import { handleQueryTransactions } from "./handlers/query-transactions-handler.js";
import { handleSearchTransactions } from "./handlers/search-transactions-handler.js";

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  // Initialize database client (connection is lazy, this ensures it's ready)
  getDatabaseClient();

  // Create MCP server
  const server = new Server(
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

  // Register tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "query_transactions",
          description:
            "Query transactions with filters (date range, account, category, amount, merchant, etc.)",
          inputSchema: {
            type: "object",
            properties: {
              dateFrom: {
                type: "string",
                description: "ISO 8601 date (YYYY-MM-DD)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              dateTo: {
                type: "string",
                description: "ISO 8601 date (YYYY-MM-DD)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              accountId: {
                type: "string",
                description: "Filter by specific account ID (IBAN)",
              },
              category: {
                type: "string",
                description: "Filter by category",
              },
              type: {
                type: "string",
                enum: ["debit", "credit", "transfer"],
                description: "Filter by transaction type",
              },
              minAmount: {
                type: "number",
                description: "Minimum transaction amount",
              },
              maxAmount: {
                type: "number",
                description: "Maximum transaction amount",
              },
              merchant: {
                type: "string",
                description: "Filter by merchant (partial match)",
              },
              search: {
                type: "string",
                description: "Full-text search in description",
              },
              limit: {
                type: "number",
                description: "Max results (default: 100, max: 1000)",
                minimum: 1,
                maximum: 1000,
              },
              offset: {
                type: "number",
                description: "Pagination offset (default: 0)",
                minimum: 0,
              },
              sortBy: {
                type: "string",
                enum: ["date", "amount", "merchant"],
                description: "Sort field",
              },
              sortOrder: {
                type: "string",
                enum: ["asc", "desc"],
                description: "Sort order (default: desc)",
              },
            },
          },
        },
        {
          name: "get_accounts",
          description:
            "List all accounts with optional balance and summary information",
          inputSchema: {
            type: "object",
            properties: {
              includeBalance: {
                type: "boolean",
                description: "Calculate current balance (default: true)",
              },
              includeSummary: {
                type: "boolean",
                description: "Include transaction counts (default: true)",
              },
            },
          },
        },
        {
          name: "search_transactions",
          description:
            "Full-text search across transaction descriptions and merchants",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (required)",
                minLength: 1,
              },
              accountId: {
                type: "string",
                description: "Limit to specific account",
              },
              limit: {
                type: "number",
                description: "Max results (default: 50, max: 500)",
                minimum: 1,
                maximum: 500,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_statistics",
          description: "Aggregate and analyze transaction data",
          inputSchema: {
            type: "object",
            properties: {
              dateFrom: {
                type: "string",
                description: "ISO 8601 date (required)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              dateTo: {
                type: "string",
                description: "ISO 8601 date (required)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              accountId: {
                type: "string",
                description: "Specific account or all accounts",
              },
              groupBy: {
                type: "string",
                enum: ["category", "merchant", "month", "type"],
                description: "Grouping option",
              },
            },
            required: ["dateFrom", "dateTo"],
          },
        },
      ],
    };
  });

  // Register tools/call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case "query_transactions":
          result = await handleQueryTransactions(args);
          break;
        case "get_accounts":
          result = await handleGetAccounts(args);
          break;
        case "search_transactions":
          result = await handleSearchTransactions(args);
          break;
        case "get_statistics":
          result = await handleGetStatistics(args);
          break;
        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `Unknown tool: ${name}`,
                  code: "UNKNOWN_TOOL",
                }),
              },
            ],
            isError: true,
          };
      }

      // Format response as JSON text content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      console.error(`Error handling tool call ${name}:`, error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              code: "INTERNAL_ERROR",
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (MCP protocol uses stdout for communication)
  console.error("MCP Server running on stdio");
}
