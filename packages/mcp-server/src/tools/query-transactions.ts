import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  queryTransactionsInputSchema,
  queryTransactionsOutputSchema,
} from "../schemas/tool-schemas.js";
import { TransactionService } from "../services/transaction-service.js";

export function registerQueryTransactionsTool(server: McpServer) {
  const transactionService = new TransactionService();

  server.registerTool(
    "query_transactions",
    {
      description:
        "Query transactions with filters, pagination, and sorting options",
      inputSchema: queryTransactionsInputSchema,
      outputSchema: queryTransactionsOutputSchema,
    },
    async (args) => {
      try {
        const result = await transactionService.queryTransactions(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        console.error("[ERROR] query_transactions failed:", error);
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
                hasMore: false,
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
