import { z } from "zod";
import type {
  GetAccountsInput,
  GetStatisticsInput,
  QueryTransactionsInput,
  SearchTransactionsInput,
} from "../types/mcp.js";

/**
 * Zod schema for query_transactions input
 */
export const queryTransactionsInputSchema = z
  .object({
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    accountId: z.string().optional(),
    category: z.string().optional(),
    type: z.enum(["debit", "credit", "transfer"]).optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    merchant: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
    sortBy: z.enum(["date", "amount", "merchant"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
      }
      return true;
    },
    {
      message: "dateFrom must be before or equal to dateTo",
      path: ["dateFrom"],
    }
  )
  .refine(
    (data) => {
      if (
        data.minAmount !== undefined &&
        data.maxAmount !== undefined
      ) {
        return data.minAmount <= data.maxAmount;
      }
      return true;
    },
    {
      message: "minAmount must be less than or equal to maxAmount",
      path: ["minAmount"],
    }
  );

/**
 * Zod schema for get_accounts input
 */
export const getAccountsInputSchema = z.object({
  includeBalance: z.boolean().optional(),
  includeSummary: z.boolean().optional(),
});

/**
 * Zod schema for search_transactions input
 */
export const searchTransactionsInputSchema = z.object({
  query: z.string().min(1),
  accountId: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

/**
 * Zod schema for get_statistics input
 */
export const getStatisticsInputSchema = z
  .object({
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    accountId: z.string().optional(),
    groupBy: z.enum(["category", "merchant", "month", "type"]).optional(),
  })
  .refine(
    (data) => {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    },
    {
      message: "dateFrom must be before or equal to dateTo",
      path: ["dateFrom"],
    }
  );

/**
 * Type-safe validation functions
 */
export function validateQueryTransactionsInput(
  input: unknown
): QueryTransactionsInput {
  return queryTransactionsInputSchema.parse(input);
}

export function validateGetAccountsInput(input: unknown): GetAccountsInput {
  return getAccountsInputSchema.parse(input);
}

export function validateSearchTransactionsInput(
  input: unknown
): SearchTransactionsInput {
  return searchTransactionsInputSchema.parse(input);
}

export function validateGetStatisticsInput(
  input: unknown
): GetStatisticsInput {
  return getStatisticsInputSchema.parse(input);
}

