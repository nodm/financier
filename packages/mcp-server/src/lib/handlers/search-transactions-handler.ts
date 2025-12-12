import { formatErrorResponse, logError } from "../errors.js";
import { TransactionService } from "../services/transaction-service.js";
import type { SearchTransactionsOutput } from "../types/mcp.js";
import { validateSearchTransactionsInput } from "../types/mcp-schemas.js";

export async function handleSearchTransactions(
  args: unknown
): Promise<SearchTransactionsOutput> {
  try {
    // Validate input
    const input = validateSearchTransactionsInput(args);

    // Search transactions
    const service = new TransactionService();
    const result = await service.searchTransactions(
      input.query,
      input.accountId,
      input.limit
    );

    return {
      success: true,
      data: {
        transactions: result.transactions,
        total: result.total,
      },
    };
  } catch (error) {
    logError(error, "search_transactions");
    return formatErrorResponse(error);
  }
}
