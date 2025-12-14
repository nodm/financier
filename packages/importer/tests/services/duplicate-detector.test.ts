import { randomUUID } from "node:crypto";
import {
  accounts,
  disconnectDatabase,
  getDatabaseClient,
  transactions as transactionsTable,
} from "@nodm/financier-db";
import type { RawTransactionData } from "@nodm/financier-types";
import { eq } from "drizzle-orm";
import {
  filterDuplicates,
  isDuplicate,
} from "../../src/services/duplicate-detector.js";

describe("duplicate-detector", () => {
  const db = getDatabaseClient();
  const testAccountId = "LT999999999999999999";

  beforeEach(async () => {
    // Clean up test data
    await db
      .delete(transactionsTable)
      .where(eq(transactionsTable.accountId, testAccountId));
    await db.delete(accounts).where(eq(accounts.id, testAccountId));

    // Create test account
    await db.insert(accounts).values({
      id: testAccountId,
      name: "Test Account",
      openDate: new Date().toISOString(),
      currency: "EUR",
      bankCode: "SEB",
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(async () => {
    await db
      .delete(transactionsTable)
      .where(eq(transactionsTable.accountId, testAccountId));
    await db.delete(accounts).where(eq(accounts.id, testAccountId));
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("isDuplicate", () => {
    it("should return false for new transaction", async () => {
      const transaction: RawTransactionData = {
        externalId: "TEST001",
        date: new Date("2025-01-15"),
        amount: 100,
        currency: "EUR",
      };

      const result = await isDuplicate(db, transaction, testAccountId);

      expect(result).toBe(false);
    });

    it("should return true for existing transaction", async () => {
      // Insert transaction
      await db.insert(transactionsTable).values({
        id: randomUUID(),
        accountId: testAccountId,
        externalId: "TEST001",
        date: new Date("2025-01-15").toISOString(),
        amount: "100",
        currency: "EUR",
        description: "",
        type: "CREDIT",
        source: "SEB",
        updatedAt: new Date().toISOString(),
      });

      const transaction: RawTransactionData = {
        externalId: "TEST001",
        date: new Date("2025-01-15"),
        amount: 100,
        currency: "EUR",
      };

      const result = await isDuplicate(db, transaction, testAccountId);

      expect(result).toBe(true);
    });

    it("should not match transaction with different external ID", async () => {
      await db.insert(transactionsTable).values({
        id: randomUUID(),
        accountId: testAccountId,
        externalId: "TEST001",
        date: new Date("2025-01-15").toISOString(),
        amount: "100",
        currency: "EUR",
        description: "",
        type: "CREDIT",
        source: "SEB",
        updatedAt: new Date().toISOString(),
      });

      const transaction: RawTransactionData = {
        externalId: "TEST002",
        date: new Date("2025-01-15"),
        amount: 100,
        currency: "EUR",
      };

      const result = await isDuplicate(db, transaction, testAccountId);

      expect(result).toBe(false);
    });
  });

  describe("filterDuplicates", () => {
    it("should filter out duplicate transactions", async () => {
      // Insert one transaction
      await db.insert(transactionsTable).values({
        id: randomUUID(),
        accountId: testAccountId,
        externalId: "TEST001",
        date: new Date("2025-01-15").toISOString(),
        amount: "100",
        currency: "EUR",
        description: "",
        type: "CREDIT",
        source: "SEB",
        updatedAt: new Date().toISOString(),
      });

      const transactions: Array<RawTransactionData> = [
        {
          externalId: "TEST001",
          date: new Date("2025-01-15"),
          amount: 100,
          currency: "EUR",
        },
        {
          externalId: "TEST002",
          date: new Date("2025-01-16"),
          amount: 200,
          currency: "EUR",
        },
      ];

      const result = await filterDuplicates(db, transactions, testAccountId);

      expect(result.newTransactions).toHaveLength(1);
      expect(result.newTransactions[0].externalId).toBe("TEST002");
      expect(result.duplicateTransactions).toHaveLength(1);
      expect(result.duplicateTransactions[0].externalId).toBe("TEST001");
    });

    it("should return all transactions if none are duplicates", async () => {
      const transactions: Array<RawTransactionData> = [
        {
          externalId: "TEST001",
          date: new Date("2025-01-15"),
          amount: 100,
          currency: "EUR",
        },
        {
          externalId: "TEST002",
          date: new Date("2025-01-16"),
          amount: 200,
          currency: "EUR",
        },
      ];

      const result = await filterDuplicates(db, transactions, testAccountId);

      expect(result.newTransactions).toHaveLength(2);
      expect(result.duplicateTransactions).toHaveLength(0);
    });

    it("should return empty array if all are duplicates", async () => {
      await db.insert(transactionsTable).values([
        {
          id: randomUUID(),
          accountId: testAccountId,
          externalId: "TEST001",
          date: new Date("2025-01-15").toISOString(),
          amount: "100",
          currency: "EUR",
          description: "",
          type: "CREDIT",
          source: "SEB",
          updatedAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          accountId: testAccountId,
          externalId: "TEST002",
          date: new Date("2025-01-16").toISOString(),
          amount: "200",
          currency: "EUR",
          description: "",
          type: "CREDIT",
          source: "SEB",
          updatedAt: new Date().toISOString(),
        },
      ]);

      const transactions: Array<RawTransactionData> = [
        {
          externalId: "TEST001",
          date: new Date("2025-01-15"),
          amount: 100,
          currency: "EUR",
        },
        {
          externalId: "TEST002",
          date: new Date("2025-01-16"),
          amount: 200,
          currency: "EUR",
        },
      ];

      const result = await filterDuplicates(db, transactions, testAccountId);

      expect(result.newTransactions).toHaveLength(0);
      expect(result.duplicateTransactions).toHaveLength(2);
    });
  });
});
