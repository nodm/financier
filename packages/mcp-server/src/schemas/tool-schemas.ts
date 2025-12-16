import { z } from "zod";

// Input schemas
export const getAccountsInputSchema = {
  includeBalance: z
    .boolean()
    .optional()
    .describe("Include current balance from latest transaction"),
  includeSummary: z
    .boolean()
    .optional()
    .describe("Include transaction count and last transaction date"),
};

// Output schemas
export const getAccountsOutputSchema = {
  accounts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      openDate: z.string().describe("ISO 8601 date string"),
      openingBalance: z.string().nullable(),
      currentBalance: z.number().optional(),
      currency: z.string(),
      bankCode: z.string(),
      isActive: z.boolean(),
      transactionCount: z.number().optional(),
      lastTransactionDate: z
        .string()
        .optional()
        .describe("ISO 8601 date string"),
      createdAt: z.string().describe("ISO 8601 date-time string"),
      updatedAt: z.string().describe("ISO 8601 date-time string"),
    })
  ),
};

// Transaction schema for output validation
const transactionSchema = z.object({
  id: z.string(),
  accountId: z.string().uuid(),
  counterpartyAccountId: z.string().uuid().nullable(),
  date: z.string().describe("ISO 8601 date string"),
  amount: z.string(),
  currency: z.string(),
  originalAmount: z.string().nullable(),
  originalCurrency: z.string().nullable(),
  merchant: z.string().nullable(),
  description: z.string(),
  category: z.string().nullable(),
  type: z.enum(["debit", "credit"]),
  balance: z.string().nullable(),
  externalId: z.string().nullable(),
  source: z.string(),
  importedAt: z.string().describe("ISO 8601 date-time string"),
  createdAt: z.string().describe("ISO 8601 date-time string"),
  updatedAt: z.string().describe("ISO 8601 date-time string"),
});

// query_transactions schemas
export const queryTransactionsInputSchema = {
  dateFrom: z.string().optional().describe("ISO 8601 date string (YYYY-MM-DD)"),
  dateTo: z.string().optional().describe("ISO 8601 date string (YYYY-MM-DD)"),
  accountId: z.string().uuid().optional(),
  category: z.string().optional(),
  type: z.enum(["debit", "credit"]).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  merchant: z.string().optional(),
  search: z.string().optional().describe("Search in description and merchant"),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["date", "amount", "merchant"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

export const queryTransactionsOutputSchema = {
  transactions: z.array(transactionSchema),
  total: z.number().int(),
  hasMore: z.boolean(),
};

// search_transactions schemas
export const searchTransactionsInputSchema = {
  query: z.string().min(1).describe("Search query for description/merchant"),
  accountId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(500).default(50),
};

export const searchTransactionsOutputSchema = {
  transactions: z.array(transactionSchema),
  total: z.number().int(),
};

// get_statistics schemas
export const getStatisticsInputSchema = {
  dateFrom: z.string().describe("ISO 8601 date string (YYYY-MM-DD)"),
  dateTo: z.string().describe("ISO 8601 date string (YYYY-MM-DD)"),
  accountId: z.string().uuid().optional(),
  groupBy: z
    .enum(["category", "merchant", "month", "type"])
    .optional()
    .describe("Group results by category, merchant, month (YYYY-MM), or type"),
};

export const getStatisticsOutputSchema = {
  summary: z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netChange: z.number(),
    transactionCount: z.number().int(),
  }),
  groupedData: z
    .array(
      z.object({
        key: z.string(),
        totalIncome: z.number(),
        totalExpenses: z.number(),
        netChange: z.number(),
        transactionCount: z.number().int(),
        percentage: z.number(),
      })
    )
    .optional(),
};
