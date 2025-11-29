import type { PrismaClient } from "@nodm/financier-db";
import type { RawTransactionData } from "@nodm/financier-types";

/**
 * Result of filtering duplicates
 */
export interface FilterDuplicatesResult {
  /** Transactions that are new (not duplicates) */
  newTransactions: Array<RawTransactionData>;
  /** Transactions that are duplicates */
  duplicateTransactions: Array<RawTransactionData>;
}

/**
 * Generate a unique key for a transaction based on the unique constraint fields
 */
function getTransactionKey(
  transaction: RawTransactionData,
  accountId: string
): string {
  const date =
    transaction.date instanceof Date
      ? transaction.date.toISOString()
      : new Date(transaction.date).toISOString();
  return `${accountId}|${date}|${transaction.externalId || ""}`;
}

export async function isDuplicate(
  prisma: PrismaClient,
  transaction: RawTransactionData,
  accountId: string
): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({
    where: {
      accountId,
      externalId: transaction.externalId,
      date: transaction.date,
    },
  });

  return !!existing;
}

export async function filterDuplicates(
  prisma: PrismaClient,
  transactions: Array<RawTransactionData>,
  defaultAccountId: string
): Promise<FilterDuplicatesResult> {
  const newTransactions: Array<RawTransactionData> = [];
  const duplicateTransactions: Array<RawTransactionData> = [];
  // Track keys we've already seen in this batch to detect intra-batch duplicates
  const seenInBatch = new Set<string>();

  for (const transaction of transactions) {
    const targetAccountId = transaction.accountNumber || defaultAccountId;
    const key = getTransactionKey(transaction, targetAccountId);

    // Skip if we've already seen this transaction in the current batch
    if (seenInBatch.has(key)) {
      duplicateTransactions.push(transaction);
      continue;
    }

    // Check against database
    const duplicate = await isDuplicate(prisma, transaction, targetAccountId);
    if (duplicate) {
      duplicateTransactions.push(transaction);
    } else {
      newTransactions.push(transaction);
      seenInBatch.add(key);
    }
  }

  return { newTransactions, duplicateTransactions };
}
