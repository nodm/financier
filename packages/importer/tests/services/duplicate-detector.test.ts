import { getDatabaseClient } from "@nodm/financier-db";
import type { RawTransactionData } from "@nodm/financier-types";
import {
  filterDuplicates,
  isDuplicate,
} from "../../src/services/duplicate-detector.js";

describe("duplicate-detector", () => {
  const prisma = getDatabaseClient();
  const testAccountId = "LT999999999999999999";

  beforeEach(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({
      where: { accountId: testAccountId },
    });
    await prisma.account.deleteMany({
      where: { id: testAccountId },
    });

    // Create test account
    await prisma.account.create({
      data: {
        id: testAccountId,
        name: "Test Account",
        currency: "EUR",
        bankCode: "SEB",
      },
    });
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({
      where: { accountId: testAccountId },
    });
    await prisma.account.deleteMany({
      where: { id: testAccountId },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("isDuplicate", () => {
    it("should return false for new transaction", async () => {
      const transaction: RawTransactionData = {
        externalId: "TEST001",
        date: new Date("2025-01-15"),
        amount: 100,
        currency: "EUR",
      };

      const result = await isDuplicate(prisma, transaction, testAccountId);

      expect(result).toBe(false);
    });

    it("should return true for existing transaction", async () => {
      // Insert transaction
      await prisma.transaction.create({
        data: {
          accountId: testAccountId,
          externalId: "TEST001",
          date: new Date("2025-01-15"),
          amount: 100,
          currency: "EUR",
          description: "",
          type: "CREDIT",
          source: "SEB",
        },
      });

      const transaction: RawTransactionData = {
        externalId: "TEST001",
        date: new Date("2025-01-15"),
        amount: 100,
        currency: "EUR",
      };

      const result = await isDuplicate(prisma, transaction, testAccountId);

      expect(result).toBe(true);
    });

    it("should not match transaction with different external ID", async () => {
      await prisma.transaction.create({
        data: {
          accountId: testAccountId,
          externalId: "TEST001",
          date: new Date("2025-01-15"),
          amount: 100,
          currency: "EUR",
          description: "",
          type: "CREDIT",
          source: "SEB",
        },
      });

      const transaction: RawTransactionData = {
        externalId: "TEST002",
        date: new Date("2025-01-15"),
        amount: 100,
        currency: "EUR",
      };

      const result = await isDuplicate(prisma, transaction, testAccountId);

      expect(result).toBe(false);
    });
  });

  describe("filterDuplicates", () => {
    it("should filter out duplicate transactions", async () => {
      // Insert one transaction
      await prisma.transaction.create({
        data: {
          accountId: testAccountId,
          externalId: "TEST001",
          date: new Date("2025-01-15"),
          amount: 100,
          currency: "EUR",
          description: "",
          type: "CREDIT",
          source: "SEB",
        },
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

      const result = await filterDuplicates(
        prisma,
        transactions,
        testAccountId
      );

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

      const result = await filterDuplicates(
        prisma,
        transactions,
        testAccountId
      );

      expect(result.newTransactions).toHaveLength(2);
      expect(result.duplicateTransactions).toHaveLength(0);
    });

    it("should return empty array if all are duplicates", async () => {
      await prisma.transaction.createMany({
        data: [
          {
            accountId: testAccountId,
            externalId: "TEST001",
            date: new Date("2025-01-15"),
            amount: 100,
            currency: "EUR",
            description: "",
            type: "CREDIT",
            source: "SEB",
          },
          {
            accountId: testAccountId,
            externalId: "TEST002",
            date: new Date("2025-01-16"),
            amount: 200,
            currency: "EUR",
            description: "",
            type: "CREDIT",
            source: "SEB",
          },
        ],
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

      const result = await filterDuplicates(
        prisma,
        transactions,
        testAccountId
      );

      expect(result.newTransactions).toHaveLength(0);
      expect(result.duplicateTransactions).toHaveLength(2);
    });
  });
});
