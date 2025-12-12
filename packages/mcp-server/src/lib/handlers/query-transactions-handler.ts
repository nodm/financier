import type {
  QueryTransactionsInput,
  QueryTransactionsOutput,
} from "../types/mcp.js";
import { validateQueryTransactionsInput } from "../types/mcp-schemas.js";
import { formatErrorResponse, logError } from "../errors.js";
import { TransactionService } from "../services/transaction-service.js";

export async function handleQueryTransactions(
  args: unknown
): Promise<QueryTransactionsOutput> {
  try {
    // Validate input
    const input = validateQueryTransactionsInput(args);

    // Query transactions
    const service = new TransactionService();
    const result = await service.queryTransactions(input);

    return {
      success: true,
      data: {
        transactions: result.transactions,
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  } catch (error) {
    logError(error, "query_transactions");
    return formatErrorResponse(error);
  }
}

