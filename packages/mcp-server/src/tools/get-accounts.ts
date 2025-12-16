import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getAccountsInputSchema,
  getAccountsOutputSchema,
} from "../schemas/tool-schemas.js";
import { AccountService } from "../services/account-service.js";

export function registerGetAccountsTool(server: McpServer) {
  const accountService = new AccountService();

  server.registerTool(
    "get_accounts",
    {
      description:
        "List all accounts with optional balance and transaction summary",
      inputSchema: getAccountsInputSchema,
      outputSchema: getAccountsOutputSchema,
    },
    async (args) => {
      try {
        const accounts = await accountService.getAccounts(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ accounts }),
            },
          ],
          structuredContent: { accounts },
        };
      } catch (error) {
        console.error("[ERROR] get_accounts failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: errorMessage,
                accounts: [],
              }),
            },
          ],
          structuredContent: {
            accounts: [],
          },
          isError: true,
        };
      }
    }
  );
}
