import crypto from "node:crypto";
import { getDatabaseClient, type PrismaClient } from "@nodm/financier-db";
import { type ImportResult, TransactionType } from "@nodm/financier-types";
import { getParser } from "../parsers/parser-factory.js";
import { filterDuplicates } from "./duplicate-detector.js";

export interface ImportOptions {
  dryRun?: boolean;
  accountId?: string;
  verbose?: boolean;
}

export async function importCSV(
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const {
    dryRun = false,
    accountId: overrideAccountId,
    verbose = false,
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

  if (dryRun) {
    return {
      success: true,
      statistics: {
        totalRows: transactions.length,
        imported: 0,
        duplicates: 0,
        failed: 0,
        accounts: [accountId],
      },
      errors: [],
    };
  }

  // Connect to database
  const prisma = getDatabaseClient();

  try {
    // Ensure account exists
    await ensureAccount(prisma, accountId, parser.bankCode);

    if (verbose) {
      console.log(`[INFO] Checking for duplicates...`);
    }

    // Filter duplicates
    const newTransactions = await filterDuplicates(
      prisma,
      transactions,
      accountId
    );
    const duplicates = transactions.length - newTransactions.length;

    if (verbose) {
      console.log(`[INFO] Skipping ${duplicates} duplicates`);
      console.log(
        `[INFO] Importing ${newTransactions.length} new transactions`
      );
    }

    // Insert transactions
    if (newTransactions.length > 0) {
      await prisma.transaction.createMany({
        data: newTransactions.map((t) => {
          const amount =
            typeof t.amount === "string"
              ? Number.parseFloat(t.amount)
              : t.amount;
          const type =
            amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT;

          return {
            id: crypto.randomUUID(),
            accountId,
            counterpartyAccountId: null,
            externalId: t.externalId,
            date: typeof t.date === "string" ? new Date(t.date) : t.date,
            amount,
            currency: typeof t.currency === "string" ? t.currency : t.currency,
            originalAmount: null,
            originalCurrency: null,
            merchant: t.merchant || null,
            description: "",
            category: t.category || null,
            type,
            balance: t.balance
              ? typeof t.balance === "string"
                ? Number.parseFloat(t.balance)
                : t.balance
              : null,
            source: parser.bankCode,
          };
        }),
      });
    }

    return {
      success: true,
      statistics: {
        totalRows: transactions.length,
        imported: newTransactions.length,
        duplicates,
        failed: 0,
        accounts: [accountId],
      },
      errors: [],
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureAccount(
  prisma: PrismaClient,
  accountId: string,
  bankCode: string
): Promise<void> {
  const existing = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!existing) {
    await prisma.account.create({
      data: {
        id: accountId,
        name: `Account ${accountId.slice(-4)}`,
        currency: "EUR",
        bankCode,
      },
    });
  }
}
