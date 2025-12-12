import type { Account } from "@nodm/financier-types";
import type {
  AccountWithSummary,
  GetAccountsInput,
} from "../types/mcp.js";
import { accounts, getDatabaseClient, transactions } from "@nodm/financier-db";
import { count, desc, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@nodm/financier-db/schema";

export class AccountService {
  constructor(
    private db: BetterSQLite3Database<typeof schema> = getDatabaseClient()
  ) {}

  /**
   * Get all accounts with optional balance and summary
   */
  async getAccounts(
    input: GetAccountsInput = {}
  ): Promise<AccountWithSummary[]> {
    const includeBalance = input.includeBalance ?? true;
    const includeSummary = input.includeSummary ?? true;

    // Get all accounts
    const accountRows = await this.db.select().from(accounts);

    // Get additional data for each account in parallel
    const accountsWithData = await Promise.all(
      accountRows.map(async (row) => {
        const account: Account = {
          id: row.id,
          name: row.name,
          openDate: row.openDate ?? null,
          openingBalance: row.openingBalance
            ? parseFloat(row.openingBalance)
            : null,
          currentBalance: row.currentBalance
            ? parseFloat(row.currentBalance)
            : null,
          currency: row.currency,
          bankCode: row.bankCode,
          isActive: row.isActive,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };

        const accountWithSummary: AccountWithSummary = {
          ...account,
        };

        // Get current balance from latest transaction if requested
        if (includeBalance) {
          const latestTransaction = await this.db
            .select({ balance: transactions.balance })
            .from(transactions)
            .where(eq(transactions.accountId, row.id))
            .orderBy(desc(transactions.date))
            .limit(1);

          if (latestTransaction[0]?.balance) {
            accountWithSummary.currentBalance = parseFloat(
              latestTransaction[0].balance
            );
          }
        }

        // Get transaction count if requested
        if (includeSummary) {
          const [{ transactionCount }] = await this.db
            .select({ transactionCount: count() })
            .from(transactions)
            .where(eq(transactions.accountId, row.id));

          accountWithSummary.transactionCount = transactionCount;

          // Get last transaction date
          const lastTransaction = await this.db
            .select({ date: transactions.date })
            .from(transactions)
            .where(eq(transactions.accountId, row.id))
            .orderBy(desc(transactions.date))
            .limit(1);

          if (lastTransaction[0]) {
            accountWithSummary.lastTransactionDate = lastTransaction[0].date;
          }
        }

        return accountWithSummary;
      })
    );

    return accountsWithData;
  }
}

