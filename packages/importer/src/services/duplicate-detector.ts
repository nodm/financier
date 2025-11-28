import type { PrismaClient } from "@nodm/financier-db";
import type { RawTransactionData } from "@nodm/financier-types";

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
  accountId: string
): Promise<Array<RawTransactionData>> {
  const filtered: Array<RawTransactionData> = [];

  for (const transaction of transactions) {
    const duplicate = await isDuplicate(prisma, transaction, accountId);
    if (!duplicate) {
      filtered.push(transaction);
    }
  }

  return filtered;
}
