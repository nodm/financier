import { accounts, getDatabaseClient, transactions } from "@nodm/financier-db";
import { count, desc, eq } from "drizzle-orm";

export class AccountService {
  async getAccounts(input: {
    includeBalance?: boolean;
    includeSummary?: boolean;
  }) {
    // Get DB client from package (singleton)
    const db = getDatabaseClient();

    const allAccounts = await db.select().from(accounts);

    // TODO(Phase 8): Optimize N+1 query problem
    // Current: 1 + 2N queries (1 for accounts, 2 per account for enhancements)
    // Solution: Batch queries with GROUP BY for transaction counts and latest transactions
    // Defer until Phase 8 benchmarking reveals if this is a bottleneck
    // Enhance with balance and summary if requested
    return Promise.all(
      allAccounts.map(async (account) => {
        const enhancements: {
          currentBalance?: number;
          transactionCount?: number;
          lastTransactionDate?: string;
        } = {};

        if (input.includeBalance || input.includeSummary) {
          // Query latest transaction for this account
          const [latest] = await db
            .select()
            .from(transactions)
            .where(eq(transactions.accountId, account.id))
            .orderBy(desc(transactions.date))
            .limit(1);

          if (latest) {
            if (input.includeBalance && latest.balance) {
              enhancements.currentBalance = Number.parseFloat(latest.balance);
            }
            if (input.includeSummary) {
              enhancements.lastTransactionDate = latest.date;
            }
          }
        }

        if (input.includeSummary) {
          const [{ total }] = await db
            .select({ total: count() })
            .from(transactions)
            .where(eq(transactions.accountId, account.id));
          enhancements.transactionCount = total;
        }

        return {
          id: account.id,
          name: account.name,
          openDate: account.openDate,
          openingBalance: account.openingBalance ?? null,
          currency: account.currency,
          bankCode: account.bankCode,
          isActive: account.isActive === "true",
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          ...enhancements,
        };
      })
    );
  }
}
