import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getStatisticsInputSchema,
  getStatisticsOutputSchema,
} from "../schemas/tool-schemas.js";
import { StatisticsService } from "../services/statistics-service.js";

export function registerGetStatisticsTool(server: McpServer) {
  const statisticsService = new StatisticsService();

  server.registerTool(
    "get_statistics",
    {
      description:
        "Aggregate and analyze transaction data with optional grouping by category, merchant, month, or type",
      inputSchema: getStatisticsInputSchema,
      outputSchema: getStatisticsOutputSchema,
    },
    async (args) => {
      try {
        const result = await statisticsService.getStatistics(args);
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
        console.error("[ERROR] get_statistics failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: errorMessage,
                summary: {
                  totalIncome: 0,
                  totalExpenses: 0,
                  netChange: 0,
                  transactionCount: 0,
                },
              }),
            },
          ],
          structuredContent: {
            summary: {
              totalIncome: 0,
              totalExpenses: 0,
              netChange: 0,
              transactionCount: 0,
            },
          },
          isError: true,
        };
      }
    }
  );
}
