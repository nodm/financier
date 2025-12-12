import type {
  SearchTransactionsInput,
  SearchTransactionsOutput,
} from "@nodm/financier-types";
import { validateSearchTransactionsInput } from "@nodm/financier-types";
import { formatErrorResponse, logError } from "../errors.js";
import { TransactionService } from "../services/transaction-service.js";

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

