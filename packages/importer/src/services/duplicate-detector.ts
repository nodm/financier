import type { getDatabaseClient } from "@nodm/financier-db";
import { transactions } from "@nodm/financier-db";
import type { RawTransactionData } from "@nodm/financier-types";
import { and, eq } from "drizzle-orm";
import { normalizeDateToISO } from "../utils/date-utils.js";

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
  const date = normalizeDateToISO(transaction.date);
  return `${accountId}|${date}|${transaction.externalId || ""}`;
}

export async function isDuplicate(
  db: ReturnType<typeof getDatabaseClient>,
  transaction: RawTransactionData,
  accountId: string
): Promise<boolean> {
  const date = normalizeDateToISO(transaction.date);

  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.externalId, transaction.externalId),
        eq(transactions.date, date)
      )
    )
    .limit(1);

  return !!existing;
}

export async function filterDuplicates(
  db: ReturnType<typeof getDatabaseClient>,
  allTransactions: Array<RawTransactionData>,
  defaultAccountId: string
): Promise<FilterDuplicatesResult> {
  const newTransactions: Array<RawTransactionData> = [];
  const duplicateTransactions: Array<RawTransactionData> = [];
  // Track keys we've already seen in this batch to detect intra-batch duplicates
  const seenInBatch = new Set<string>();

  for (const transaction of allTransactions) {
    const targetAccountId = transaction.accountNumber || defaultAccountId;
    const key = getTransactionKey(transaction, targetAccountId);

    // Skip if we've already seen this transaction in the current batch
    if (seenInBatch.has(key)) {
      duplicateTransactions.push(transaction);
      continue;
    }

    // Check against database
    const duplicate = await isDuplicate(db, transaction, targetAccountId);
    if (duplicate) {
      duplicateTransactions.push(transaction);
    } else {
      newTransactions.push(transaction);
      seenInBatch.add(key);
    }
  }

  return { newTransactions, duplicateTransactions };
}
