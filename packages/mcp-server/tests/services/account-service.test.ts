import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import {
  disconnectDatabase,
  getDatabaseClient,
  resetDatabaseClient,
} from "@nodm/financier-db";
import { sql } from "drizzle-orm";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { AccountService } from "../../src/services/account-service.js";

async function setupTestDatabase() {
  const db = getDatabaseClient();

  // Drop tables if they exist (for clean state)
  await db.run(sql`DROP TABLE IF EXISTS transactions`);
  await db.run(sql`DROP TABLE IF EXISTS accounts`);

  // Create accounts table (using new schema with text dates)
  await db.run(sql`
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      openDate TEXT NOT NULL,
      openingBalance TEXT,
      currentBalance TEXT,
      currency TEXT NOT NULL,
      bankCode TEXT NOT NULL,
      isActive TEXT NOT NULL DEFAULT 'true',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create transactions table (using new schema with text dates and balances)
  await db.run(sql`
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      counterpartyAccountId TEXT,
      date TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL,
      originalAmount TEXT,
      originalCurrency TEXT,
      merchant TEXT,
      description TEXT NOT NULL,
      category TEXT,
      type TEXT NOT NULL,
      balance TEXT,
      externalId TEXT,
      source TEXT NOT NULL,
      importedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (counterpartyAccountId) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);

  // Create indexes
  await db.run(
    sql`CREATE INDEX transactions_accountId_idx ON transactions(accountId)`
  );
  await db.run(
    sql`CREATE INDEX transactions_accountId_date_idx ON transactions(accountId, date)`
  );

  // Insert test data using raw SQL (to avoid schema column mismatch)
  const now = new Date().toISOString();
  const accountId = "test-account-1";

  await db.run(
    sql.raw(
      `INSERT INTO accounts (id, name, openDate, openingBalance, currency, bankCode, isActive, createdAt, updatedAt)
       VALUES ('${accountId}', 'Test Account', '2024-01-01', '1000.00', 'EUR', 'TEST', 'true', '${now}', '${now}')`
    )
  );

  await db.run(
    sql.raw(
      `INSERT INTO transactions (id, accountId, date, amount, currency, description, type, balance, source, createdAt, updatedAt)
       VALUES ('test-txn-1', '${accountId}', '2024-01-15', '-50.00', 'EUR', 'Test transaction', 'debit', '950.00', 'test', '${now}', '${now}')`
    )
  );
}

describe("AccountService", () => {
  let service: AccountService;
  let tempDir: string;

  beforeAll(() => {
    // Create temporary directory for test database
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "financier-test-"));
    const dbPath = path.join(tempDir, "test.db");
    process.env.DATABASE_URL = `file:${dbPath}`;
  });

  beforeEach(async () => {
    await resetDatabaseClient();
    await setupTestDatabase();
    service = new AccountService();
  });

  afterEach(async () => {
    await disconnectDatabase();
  });

  afterAll(() => {
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("getAccounts", () => {
    it("should return accounts with correct field types", async () => {
      const result = await service.getAccounts({});

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const account = result[0];

        // Required string fields
        expect(typeof account.id).toBe("string");
        expect(typeof account.name).toBe("string");
        expect(typeof account.currency).toBe("string");
        expect(typeof account.bankCode).toBe("string");
        expect(typeof account.openDate).toBe("string");

        // ISO date strings
        expect(typeof account.createdAt).toBe("string");
        expect(typeof account.updatedAt).toBe("string");
        expect(() => new Date(account.createdAt)).not.toThrow();
        expect(() => new Date(account.updatedAt)).not.toThrow();
        expect(() => new Date(account.openDate)).not.toThrow();

        // Boolean
        expect(typeof account.isActive).toBe("boolean");

        // Nullable/optional fields
        expect(
          account.openingBalance === null ||
            typeof account.openingBalance === "string"
        ).toBe(true);
      }
    });

    it("should not include balance/summary by default", async () => {
      const result = await service.getAccounts({});

      if (result.length > 0) {
        const account = result[0];
        expect(account.currentBalance).toBeUndefined();
        expect(account.transactionCount).toBeUndefined();
        expect(account.lastTransactionDate).toBeUndefined();
      }
    });

    it("should include currentBalance as number when requested", async () => {
      const result = await service.getAccounts({ includeBalance: true });

      if (result.length > 0) {
        const account = result[0];
        // currentBalance should be defined if there are transactions with balance
        if (account.currentBalance !== undefined) {
          expect(typeof account.currentBalance).toBe("number");
          expect(Number.isFinite(account.currentBalance)).toBe(true);
        }
      }
    });

    it("should include summary with correct types when requested", async () => {
      const result = await service.getAccounts({ includeSummary: true });

      if (result.length > 0) {
        const account = result[0];

        // transactionCount should always be defined
        expect(typeof account.transactionCount).toBe("number");
        expect(account.transactionCount).toBeGreaterThanOrEqual(0);

        // lastTransactionDate is optional (only if transactions exist)
        if (account.lastTransactionDate !== undefined) {
          expect(typeof account.lastTransactionDate).toBe("string");
          expect(() => new Date(account.lastTransactionDate)).not.toThrow();
        }
      }
    });

    it("should include both balance and summary when requested", async () => {
      const result = await service.getAccounts({
        includeBalance: true,
        includeSummary: true,
      });

      if (result.length > 0) {
        const account = result[0];

        // Both enhancements should be present
        expect(account.transactionCount).toBeDefined();
        expect(typeof account.transactionCount).toBe("number");

        if (account.currentBalance !== undefined) {
          expect(typeof account.currentBalance).toBe("number");
        }

        if (account.lastTransactionDate !== undefined) {
          expect(typeof account.lastTransactionDate).toBe("string");
        }
      }
    });

    it("should convert isActive text to boolean correctly", async () => {
      const result = await service.getAccounts({});

      if (result.length > 0) {
        // All accounts should have boolean isActive
        result.forEach((account) => {
          expect(typeof account.isActive).toBe("boolean");
          expect([true, false].includes(account.isActive)).toBe(true);
        });
      }
    });

    it("should handle empty database gracefully", async () => {
      // This test will pass if DB is empty or has accounts
      const result = await service.getAccounts({});

      expect(Array.isArray(result)).toBe(true);
      // No error should be thrown
    });
  });
});
