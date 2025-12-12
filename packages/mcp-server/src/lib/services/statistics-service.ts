import type {
  GetStatisticsInput,
  GroupedData,
} from "@nodm/financier-types";
import { getDatabaseClient, transactions } from "@nodm/financier-db";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@nodm/financier-db/schema";
import { parseDate } from "../utils/date-utils.js";

export class StatisticsService {
  constructor(
    private db: BetterSQLite3Database<typeof schema> = getDatabaseClient()
  ) {}

  /**
   * Get statistics with optional grouping
   */
  async getStatistics(input: GetStatisticsInput): Promise<{
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netChange: number;
      transactionCount: number;
    };
    groupedData?: GroupedData[];
  }> {
    const dateFrom = parseDate(input.dateFrom);
    const dateTo = parseDate(input.dateTo);
    // Add one day to include the entire end date
    const dateToEnd = new Date(dateTo);
    dateToEnd.setUTCDate(dateToEnd.getUTCDate() + 1);

    const conditions = [
      gte(transactions.date, dateFrom),
      lte(transactions.date, dateToEnd),
    ];

    if (input.accountId) {
      conditions.push(eq(transactions.accountId, input.accountId));
    }

    const whereClause = and(...conditions);

    // Get summary statistics
    const summaryRows = await this.db
      .select({
        type: transactions.type,
        total: sql<number>`SUM(CAST(${transactions.amount} AS REAL))`.as(
          "total"
        ),
        count: count(),
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.type);

    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;

    for (const row of summaryRows) {
      const amount = row.total ?? 0;
      transactionCount += row.count;

      if (row.type === "credit") {
        totalIncome += amount;
      } else if (row.type === "debit") {
        totalExpenses += Math.abs(amount); // Amounts are negative for debits
      }
    }

    const netChange = totalIncome - totalExpenses;

    const result: {
      summary: {
        totalIncome: number;
        totalExpenses: number;
        netChange: number;
        transactionCount: number;
      };
      groupedData?: GroupedData[];
    } = {
      summary: {
        totalIncome,
        totalExpenses,
        netChange,
        transactionCount,
      },
    };

    // Get grouped data if requested
    if (input.groupBy) {
      result.groupedData = await this.getGroupedData(
        whereClause,
        input.groupBy,
        totalIncome,
        totalExpenses
      );
    }

    return result;
  }

  /**
   * Get grouped statistics data
   */
  private async getGroupedData(
    whereClause: ReturnType<typeof and>,
    groupBy: "category" | "merchant" | "month" | "type",
    totalIncome: number,
    totalExpenses: number
  ): Promise<GroupedData[]> {
    let groupByField: typeof transactions.category | typeof transactions.merchant | typeof transactions.type | ReturnType<typeof sql>;
    let groupByExpr: ReturnType<typeof sql>;

    if (groupBy === "category") {
      groupByField = transactions.category;
      groupByExpr = sql`${transactions.category}`;
    } else if (groupBy === "merchant") {
      groupByField = transactions.merchant;
      groupByExpr = sql`${transactions.merchant}`;
    } else if (groupBy === "type") {
      groupByField = transactions.type;
      groupByExpr = sql`${transactions.type}`;
    } else {
      // month grouping - format date as YYYY-MM
      groupByExpr = sql`strftime('%Y-%m', datetime(${transactions.date}, 'unixepoch'))`;
    }

    const groupedRows = await this.db
      .select({
        key: groupBy === "month" ? groupByExpr : groupByField,
        totalAmount: sql<number>`SUM(CAST(${transactions.amount} AS REAL))`.as(
          "totalAmount"
        ),
        transactionCount: count(),
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(groupBy === "month" ? groupByExpr : groupByField);

    const groupedData: GroupedData[] = groupedRows
      .map((row) => {
        const key = row.key?.toString() ?? "Unknown";
        const totalAmount = row.totalAmount ?? 0;
        const transactionCount = row.transactionCount;

        // Calculate percentage based on whether it's income or expense
        const isIncome = totalAmount > 0;
        const totalForPercentage = isIncome ? totalIncome : totalExpenses;
        const percentage =
          totalForPercentage > 0
            ? (Math.abs(totalAmount) / totalForPercentage) * 100
            : 0;

        return {
          key,
          totalAmount: Math.abs(totalAmount),
          transactionCount,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by amount descending

    return groupedData;
  }
}

