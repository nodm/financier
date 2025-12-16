import { transactions, getDatabaseClient } from "@nodm/financier-db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  like,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { DatabaseError } from "../errors/index.js";

export class TransactionService {
  async queryTransactions(input: {
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
    category?: string;
    type?: "debit" | "credit";
    minAmount?: number;
    maxAmount?: number;
    merchant?: string;
    search?: string;
    limit: number;
    offset: number;
    sortBy: "date" | "amount" | "merchant";
    sortOrder: "asc" | "desc";
  }) {
    const db = getDatabaseClient();
    const conditions: Array<SQL> = [];

    try {
      // Date range filters
      if (input.dateFrom) {
        conditions.push(gte(transactions.date, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(transactions.date, input.dateTo));
      }

      // Exact match filters
      if (input.accountId) {
        conditions.push(eq(transactions.accountId, input.accountId));
      }
      if (input.category) {
        conditions.push(eq(transactions.category, input.category));
      }
      if (input.type) {
        conditions.push(eq(transactions.type, input.type));
      }

      // Partial match for merchant
      if (input.merchant) {
        conditions.push(like(transactions.merchant, `%${input.merchant}%`));
      }

      // Amount range filters (amounts are TEXT, so use CAST)
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

      // Full-text search (description OR merchant)
      if (input.search) {
        const pattern = `%${input.search}%`;
        const searchCondition = or(
          like(transactions.description, pattern),
          like(transactions.merchant, pattern)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const where = conditions.length ? and(...conditions) : undefined;

      // Determine sort order
      let orderByClause;
      if (input.sortBy === "amount") {
        // For amount sorting, use CAST to ensure numeric sort
        orderByClause =
          input.sortOrder === "asc"
            ? sql`CAST(${transactions.amount} AS REAL) ASC`
            : sql`CAST(${transactions.amount} AS REAL) DESC`;
      } else {
        const column =
          input.sortBy === "merchant"
            ? transactions.merchant
            : transactions.date;
        orderByClause = input.sortOrder === "asc" ? asc(column) : desc(column);
      }

      // Fetch limit+1 to check if more results exist
      const results = await db
        .select()
        .from(transactions)
        .where(where)
        .orderBy(orderByClause)
        .limit(input.limit + 1)
        .offset(input.offset);

      const hasMore = results.length > input.limit;
      const transactionList = hasMore
        ? results.slice(0, input.limit)
        : results;

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(transactions)
        .where(where);

      return {
        transactions: transactionList,
        total,
        hasMore,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to query transactions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async searchTransactions(input: {
    query: string;
    accountId?: string;
    limit: number;
  }) {
    // Reuse queryTransactions with search-specific defaults
    return this.queryTransactions({
      search: input.query,
      accountId: input.accountId,
      limit: input.limit,
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    });
  }
}
