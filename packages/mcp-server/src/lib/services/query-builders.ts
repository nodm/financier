import type { QueryTransactionsInput } from "@nodm/financier-types";
import { transactions } from "@nodm/financier-db";
import { and, asc, desc, eq, gte, lte, like, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { parseDate } from "../utils/date-utils.js";

/**
 * Build where conditions for transaction queries
 */
export function buildTransactionWhereConditions(
  input: QueryTransactionsInput
): SQL[] {
  const conditions: SQL[] = [];

  // Date range filter
  if (input.dateFrom) {
    const dateFrom = parseDate(input.dateFrom);
    conditions.push(gte(transactions.date, dateFrom));
  }
  if (input.dateTo) {
    const dateTo = parseDate(input.dateTo);
    // Add one day to include the entire end date
    const dateToEnd = new Date(dateTo);
    dateToEnd.setUTCDate(dateToEnd.getUTCDate() + 1);
    conditions.push(lte(transactions.date, dateToEnd));
  }

  // Account filter
  if (input.accountId) {
    conditions.push(eq(transactions.accountId, input.accountId));
  }

  // Category filter
  if (input.category) {
    conditions.push(eq(transactions.category, input.category));
  }

  // Type filter
  if (input.type) {
    conditions.push(eq(transactions.type, input.type));
  }

  // Amount range filters
  // Note: amounts are stored as text in SQLite, so we need to cast for comparison
  if (input.minAmount !== undefined) {
    conditions.push(
      sql`CAST(${transactions.amount} AS REAL) >= ${input.minAmount}`
    );
  }
  if (input.maxAmount !== undefined) {
    conditions.push(
      sql`CAST(${transactions.amount} AS REAL) <= ${input.maxAmount}`
    );
  }

  // Merchant filter (partial match, case-insensitive)
  if (input.merchant) {
    conditions.push(
      like(transactions.merchant, `%${input.merchant}%`)
    );
  }

  // Full-text search in description and merchant
  if (input.search) {
    const searchPattern = `%${input.search}%`;
    conditions.push(
      or(
        like(transactions.description, searchPattern),
        like(transactions.merchant, searchPattern)
      )!
    );
  }

  return conditions;
}

/**
 * Build order by clause for transaction queries
 */
export function buildTransactionOrderBy(
  input: QueryTransactionsInput
): ReturnType<typeof desc> | ReturnType<typeof asc> {
  const sortOrder = input.sortOrder || "desc";
  const sortBy = input.sortBy || "date";

  if (sortBy === "date") {
    return sortOrder === "asc"
      ? asc(transactions.date)
      : desc(transactions.date);
  }

  if (sortBy === "amount") {
    // Cast amount to REAL for sorting
    const amountExpr = sql`CAST(${transactions.amount} AS REAL)`;
    return sortOrder === "asc"
      ? sql`${amountExpr} ASC`
      : sql`${amountExpr} DESC`;
  }

  if (sortBy === "merchant") {
    return sortOrder === "asc"
      ? asc(transactions.merchant)
      : desc(transactions.merchant);
  }

  // Default: sort by date descending
  return desc(transactions.date);
}

