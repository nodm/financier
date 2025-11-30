import crypto from "node:crypto";
import {
  accounts,
  disconnectDatabase,
  getDatabaseClient,
  transactions as transactionsTable,
} from "@nodm/financier-db";
import { type ImportResult, TransactionType } from "@nodm/financier-types";
import { eq } from "drizzle-orm";
import { getParser } from "../parsers/parser-factory.js";
import { filterDuplicates } from "./duplicate-detector.js";

export interface ImportOptions {
  dryRun?: boolean;
  accountId?: string;
  verbose?: boolean;
  showDuplicates?: boolean;
}

export async function importCSV(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const {
    dryRun = false,
    accountId: overrideAccountId,
    verbose = false,
    showDuplicates = false,
  } = options;

  if (verbose) {
    console.log(`[INFO] Parsing CSV: ${filePath}`);
  }

  // Get appropriate parser
  const parser = await getParser(filePath);

  if (verbose) {
    console.log(`[INFO] Detected bank: ${parser.bankCode}`);
  }

  // Parse CSV
  const { accountId: parsedAccountId, transactions } =
    await parser.parse(filePath);
  const accountId = overrideAccountId || parsedAccountId;

  if (verbose) {
    console.log(`[INFO] Account: ${accountId}`);
    console.log(`[INFO] Parsed ${transactions.length} transactions`);
  }

  // Determine all accounts involved
  const accountIds = new Set<string>();
  if (overrideAccountId) {
    accountIds.add(overrideAccountId);
  } else {
    if (parsedAccountId) accountIds.add(parsedAccountId);
    transactions.forEach((t) => {
      if (t.accountNumber) accountIds.add(t.accountNumber);
    });
  }

  // Connect to database (needed for both dry-run and actual import to check duplicates)
  const db = getDatabaseClient();

  try {
    // Ensure all accounts exist (skip in dry-run mode)
    if (!dryRun) {
      for (const accId of accountIds) {
        await ensureAccount(db, accId, parser.bankCode);
      }
    }

    if (verbose) {
      console.log(`[INFO] Checking for duplicates...`);
    }

    // Filter duplicates
    const { newTransactions, duplicateTransactions } = await filterDuplicates(
      db,
      transactions,
      accountId
    );
    const duplicates = duplicateTransactions.length;

    if (verbose) {
      console.log(`[INFO] Found ${duplicates} duplicates`);
      console.log(
        `[INFO] ${dryRun ? "Would import" : "Importing"} ${
          newTransactions.length
        } new transactions`
      );
    }

    if (dryRun) {
      return {
        success: true,
        statistics: {
          totalRows: transactions.length,
          imported: newTransactions.length,
          duplicates,
          failed: 0,
          accounts: Array.from(accountIds),
        },
        errors: [],
        duplicateTransactions: showDuplicates
          ? duplicateTransactions
          : undefined,
      };
    }

    // Insert transactions
    if (newTransactions.length > 0) {
      await db.insert(transactionsTable).values(
        newTransactions.map((t) => {
          const amount =
            typeof t.amount === "string"
              ? Number.parseFloat(t.amount)
              : t.amount;
          const type =
            amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
          const targetAccountId =
            overrideAccountId || t.accountNumber || parsedAccountId;

          return {
            id: crypto.randomUUID(),
            accountId: targetAccountId,
            counterpartyAccountId: null,
            externalId: t.externalId,
            date: typeof t.date === "string" ? new Date(t.date) : t.date,
            amount: amount.toString(),
            currency: typeof t.currency === "string" ? t.currency : t.currency,
            originalAmount: null,
            originalCurrency: null,
            merchant: t.merchant || null,
            description: t.description || "",
            category: t.category || null,
            type,
            balance: t.balance
              ? typeof t.balance === "string"
                ? t.balance
                : t.balance.toString()
              : null,
            source: parser.bankCode,
            updatedAt: new Date(),
          };
        })
      );
    }

    return {
      success: true,
      statistics: {
        totalRows: transactions.length,
        imported: newTransactions.length,
        duplicates,
        failed: 0,
        accounts: Array.from(accountIds),
      },
      errors: [],
      duplicateTransactions: showDuplicates ? duplicateTransactions : undefined,
    };
  } finally {
    await disconnectDatabase();
  }
}

async function ensureAccount(
  db: ReturnType<typeof getDatabaseClient>,
  accountId: string,
  bankCode: string
): Promise<void> {
  const [existing] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!existing) {
    await db.insert(accounts).values({
      id: accountId,
      name: `Account ${accountId.slice(-4)}`,
      currency: "EUR",
      bankCode,
      updatedAt: new Date(),
    });
  }
}
