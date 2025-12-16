import { transactions, getDatabaseClient } from "@nodm/financier-db";
import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { DatabaseError } from "../errors/index.js";

export class StatisticsService {
  async getStatistics(input: {
    dateFrom: string;
    dateTo: string;
    accountId?: string;
    groupBy?: "category" | "merchant" | "month" | "type";
  }) {
    const db = getDatabaseClient();
    const conditions: Array<SQL> = [
      gte(transactions.date, input.dateFrom),
      lte(transactions.date, input.dateTo),
    ];

    if (input.accountId) {
      conditions.push(eq(transactions.accountId, input.accountId));
    }

    const where = and(...conditions);

    try {
      // Summary aggregation (amounts are TEXT, use CAST)
      const [summaryRow] = await db
        .select({
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN CAST(${transactions.amount} AS REAL) ELSE 0 END), 0)`,
          totalExpenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN CAST(${transactions.amount} AS REAL) ELSE 0 END), 0)`,
          transactionCount: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .where(where);

      const totalIncome = Number.parseFloat(summaryRow?.totalIncome ?? "0");
      const totalExpenses = Number.parseFloat(
        summaryRow?.totalExpenses ?? "0"
      );

      const summary = {
        totalIncome,
        totalExpenses,
        netChange: totalIncome - totalExpenses,
        transactionCount: summaryRow?.transactionCount ?? 0,
      };

      // Grouped data (if requested)
      let groupedData:
        | Array<{
            key: string;
            totalIncome: number;
            totalExpenses: number;
            netChange: number;
            transactionCount: number;
            percentage: number;
          }>
        | undefined;

      if (input.groupBy) {
        const groupColumn = this.getGroupColumn(input.groupBy);

        const rows = await db
          .select({
            key: groupColumn,
            totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN CAST(${transactions.amount} AS REAL) ELSE 0 END), 0)`,
            totalExpenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN CAST(${transactions.amount} AS REAL) ELSE 0 END), 0)`,
            transactionCount: sql<number>`COUNT(*)`,
          })
          .from(transactions)
          .where(where)
          .groupBy(groupColumn);

        // Calculate percentages and netChange in TypeScript
        groupedData = rows.map((row) => {
          const income = Number.parseFloat(row.totalIncome ?? "0");
          const expenses = Number.parseFloat(row.totalExpenses ?? "0");
          return {
            key: String(row.key ?? "Unknown"),
            totalIncome: income,
            totalExpenses: expenses,
            netChange: income - expenses,
            transactionCount: row.transactionCount,
            percentage:
              totalExpenses > 0 ? (expenses / totalExpenses) * 100 : 0,
          };
        });
      }

      return { summary, groupedData };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getGroupColumn(
    groupBy: "category" | "merchant" | "month" | "type"
  ): SQL | typeof transactions.category | typeof transactions.merchant | typeof transactions.type {
    switch (groupBy) {
      case "month":
        return sql`strftime('%Y-%m', ${transactions.date})`;
      case "category":
        return transactions.category;
      case "merchant":
        return transactions.merchant;
      case "type":
        return transactions.type;
    }
  }
}
