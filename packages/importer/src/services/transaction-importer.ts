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
import { normalizeDateToISO } from "../utils/date-utils.js";
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

    // Validate all accounts exist before importing (even in dry-run mode)
    if (newTransactions.length > 0) {
      for (const accId of accountIds) {
        await validateAccount(db, accId);
      }
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

    // Sort transactions by date to ensure correct balance calculation
    const sortedTransactions = newTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Process each transaction in its own database transaction
    if (sortedTransactions.length > 0) {
      for (const t of sortedTransactions) {
        const amount =
          typeof t.amount === "string" ? Number.parseFloat(t.amount) : t.amount;
        const type =
          amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
        const targetAccountId =
          overrideAccountId || t.accountNumber || parsedAccountId;

        db.transaction((tx) => {
          // 1. Get current account balance
          const account = tx
            .select({ currentBalance: accounts.currentBalance })
            .from(accounts)
            .where(eq(accounts.id, targetAccountId))
            .get();

          if (!account) {
            throw new Error(
              `Account ${targetAccountId} not found during balance update`
            );
          }

          const current = Number.parseFloat(account.currentBalance);
          const newBalance = current + amount;

          // 2. Validate counterparty account exists (for FK constraint)
          let validatedCounterpartyId: string | null = null;
          if (t.counterpartyAccountId) {
            const counterpartyExists = tx
              .select({ id: accounts.id })
              .from(accounts)
              .where(eq(accounts.id, t.counterpartyAccountId))
              .get();
            validatedCounterpartyId = counterpartyExists ? t.counterpartyAccountId : null;
          }

          // 3. Create transaction with calculated balance
          const mappedTransaction = {
            id: crypto.randomUUID(),
            accountId: targetAccountId,
            counterpartyAccountId: validatedCounterpartyId,
            externalId: t.externalId,
            date: normalizeDateToISO(t.date),
            // Amount stored as string for decimal precision (avoid floating-point errors)
            amount: amount.toString(),
            currency: typeof t.currency === "string" ? t.currency : t.currency,
            originalAmount: null,
            originalCurrency: null,
            merchant: t.merchant || null,
            description: t.description || "",
            category: t.category || null,
            type,
            balance: newBalance.toString(),
            source: parser.bankCode,
            updatedAt: new Date().toISOString(),
          };

          // 4. Insert transaction
          tx.insert(transactionsTable).values(mappedTransaction).run();

          // 5. Update account balance
          tx.update(accounts)
            .set({
              currentBalance: newBalance.toString(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(accounts.id, targetAccountId))
            .run();
        });
      }
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

async function validateAccount(
  db: ReturnType<typeof getDatabaseClient>,
  accountId: string
): Promise<void> {
  const [existing] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!existing) {
    throw new Error(
      `Account ${accountId} does not exist. Please create account before importing.`
    );
  }
}
