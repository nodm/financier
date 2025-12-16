import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  searchTransactionsInputSchema,
  searchTransactionsOutputSchema,
} from "../schemas/tool-schemas.js";
import { TransactionService } from "../services/transaction-service.js";

export function registerSearchTransactionsTool(server: McpServer) {
  const transactionService = new TransactionService();

  server.registerTool(
    "search_transactions",
    {
      description:
        "Full-text search across transaction descriptions and merchants",
      inputSchema: searchTransactionsInputSchema,
      outputSchema: searchTransactionsOutputSchema,
    },
    async (args) => {
      try {
        const result = await transactionService.searchTransactions(args);
        // For search, return only transactions and total (no hasMore)
        const searchResult = {
          transactions: result.transactions,
          total: result.total,
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(searchResult),
            },
          ],
          structuredContent: searchResult,
        };
      } catch (error) {
        console.error("[ERROR] search_transactions failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: errorMessage,
                transactions: [],
                total: 0,
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
