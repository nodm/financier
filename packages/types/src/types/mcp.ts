import type { Account } from "./account.js";
import type { Transaction } from "./transaction.js";

/**
 * Input for query_transactions tool
 */
export interface QueryTransactionsInput {
  /** ISO 8601 date (YYYY-MM-DD) */
  dateFrom?: string;
  /** ISO 8601 date (YYYY-MM-DD) */
  dateTo?: string;
  /** Filter by specific account ID (IBAN) */
  accountId?: string;
  /** Filter by category */
  category?: string;
  /** Filter by transaction type */
  type?: "debit" | "credit" | "transfer";
  /** Minimum transaction amount */
  minAmount?: number;
  /** Maximum transaction amount */
  maxAmount?: number;
  /** Filter by merchant (partial match) */
  merchant?: string;
  /** Full-text search in description */
  search?: string;
  /** Max results (default: 100, max: 1000) */
  limit?: number;
  /** Pagination offset (default: 0) */
  offset?: number;
  /** Sort field */
  sortBy?: "date" | "amount" | "merchant";
  /** Sort order (default: desc) */
  sortOrder?: "asc" | "desc";
}

/**
 * Output for query_transactions tool
 */
export interface QueryTransactionsOutput {
  success: boolean;
  data?: {
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
  code?: string;
}

/**
 * Input for get_accounts tool
 */
export interface GetAccountsInput {
  /** Calculate current balance (default: true) */
  includeBalance?: boolean;
  /** Include transaction counts (default: true) */
  includeSummary?: boolean;
}

/**
 * Account with optional summary data
 */
export interface AccountWithSummary extends Account {
  /** Current balance from latest transaction */
  currentBalance?: number;
  /** Total transaction count */
  transactionCount?: number;
  /** Last transaction date */
  lastTransactionDate?: Date;
}

/**
 * Output for get_accounts tool
 */
export interface GetAccountsOutput {
  success: boolean;
  data?: {
    accounts: AccountWithSummary[];
  };
  error?: string;
  code?: string;
}

/**
 * Input for search_transactions tool
 */
export interface SearchTransactionsInput {
  /** Search query (required) */
  query: string;
  /** Limit to specific account */
  accountId?: string;
  /** Max results (default: 50, max: 500) */
  limit?: number;
}

/**
 * Output for search_transactions tool
 */
export interface SearchTransactionsOutput {
  success: boolean;
  data?: {
    transactions: Transaction[];
    total: number;
  };
  error?: string;
  code?: string;
}

/**
 * Input for get_statistics tool
 */
export interface GetStatisticsInput {
  /** ISO 8601 date (required) */
  dateFrom: string;
  /** ISO 8601 date (required) */
  dateTo: string;
  /** Specific account or all accounts */
  accountId?: string;
  /** Grouping option */
  groupBy?: "category" | "merchant" | "month" | "type";
}

/**
 * Grouped data for statistics
 */
export interface GroupedData {
  /** Category, merchant, month, or type */
  key: string;
  /** Total amount */
  totalAmount: number;
  /** Transaction count */
  transactionCount: number;
  /** Percentage of total expenses/income */
  percentage: number;
}

/**
 * Output for get_statistics tool
 */
export interface GetStatisticsOutput {
  success: boolean;
  data?: {
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netChange: number;
      transactionCount: number;
    };
    groupedData?: GroupedData[];
  };
  error?: string;
  code?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

