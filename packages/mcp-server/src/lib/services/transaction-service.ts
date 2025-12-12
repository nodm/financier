import { getDatabaseClient, transactions } from "@nodm/financier-db";
import type * as schema from "@nodm/financier-db/schema";
import type { Transaction } from "@nodm/financier-types";
import { TransactionType } from "@nodm/financier-types";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { QueryTransactionsInput } from "../types/mcp.js";
import {
  buildTransactionOrderBy,
  buildTransactionWhereConditions,
} from "./query-builders.js";

export class TransactionService {
  constructor(
    private db: BetterSQLite3Database<typeof schema> = getDatabaseClient()
  ) {}

  /**
   * Query transactions with filters
   */
  async queryTransactions(input: QueryTransactionsInput): Promise<{
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
  }> {
    const conditions = buildTransactionWhereConditions(input);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const limit = input.limit ?? 100;
    const offset = input.offset ?? 0;

    // Execute queries in parallel
    const [results, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(buildTransactionOrderBy(input))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(transactions).where(whereClause),
    ]);

    // Convert database rows to Transaction objects
    const transactionList: Transaction[] = results.map((row) => ({
      id: row.id,
      accountId: row.accountId,
      counterpartyAccountId: row.counterpartyAccountId ?? null,
      date: row.date,
      amount: parseFloat(row.amount),
      currency: row.currency,
      originalAmount: row.originalAmount
        ? parseFloat(row.originalAmount)
        : null,
      originalCurrency: row.originalCurrency ?? null,
      merchant: row.merchant ?? null,
      description: row.description,
      category: row.category ?? null,
      type:
        row.type === "debit"
          ? TransactionType.DEBIT
          : row.type === "credit"
            ? TransactionType.CREDIT
            : TransactionType.DEBIT,
      balance: row.balance ? parseFloat(row.balance) : null,
      externalId: row.externalId ?? null,
      source: row.source,
      importedAt: row.importedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      transactions: transactionList,
      total,
      hasMore: total > offset + results.length,
    };
  }

  /**
   * Search transactions by query string
   */
  async searchTransactions(
    query: string,
    accountId?: string,
    limit: number = 50
  ): Promise<{
    transactions: Transaction[];
    total: number;
  }> {
    const searchCondition = or(
      like(transactions.description, `%${query}%`),
      like(transactions.merchant, `%${query}%`)
    );
    const conditions = [];
    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (accountId) {
      conditions.push(eq(transactions.accountId, accountId));
    }

    const whereClause = and(...conditions);

    const [results, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(desc(transactions.date))
        .limit(limit),
      this.db.select({ total: count() }).from(transactions).where(whereClause),
    ]);

    const transactionList: Transaction[] = results.map((row) => ({
      id: row.id,
      accountId: row.accountId,
      counterpartyAccountId: row.counterpartyAccountId ?? null,
      date: row.date,
      amount: parseFloat(row.amount),
      currency: row.currency,
      originalAmount: row.originalAmount
        ? parseFloat(row.originalAmount)
        : null,
      originalCurrency: row.originalCurrency ?? null,
      merchant: row.merchant ?? null,
      description: row.description,
      category: row.category ?? null,
      type:
        row.type === "debit"
          ? TransactionType.DEBIT
          : row.type === "credit"
            ? TransactionType.CREDIT
            : TransactionType.DEBIT,
      balance: row.balance ? parseFloat(row.balance) : null,
      externalId: row.externalId ?? null,
      source: row.source,
      importedAt: row.importedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      transactions: transactionList,
      total,
    };
  }
}
