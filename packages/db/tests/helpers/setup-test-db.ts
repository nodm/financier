import { sql } from "drizzle-orm";
import { getDatabaseClient } from "../../src/lib/client.js";

/**
 * Create database tables for testing
 */
export function setupTestDatabase() {
  const db = getDatabaseClient();

  // Create accounts table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      openDate integer,
      openingBalance text,
      currentBalance text,
      currency text NOT NULL,
      bankCode text NOT NULL,
      isActive integer DEFAULT 1 NOT NULL,
      createdAt integer DEFAULT (unixepoch()) NOT NULL,
      updatedAt integer NOT NULL
    )
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS accounts_bankCode_idx ON accounts (bankCode)
  `);

  // Create transactions table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id text PRIMARY KEY NOT NULL,
      accountId text NOT NULL,
      counterpartyAccountId text,
      date integer NOT NULL,
      amount text NOT NULL,
      currency text NOT NULL,
      originalAmount text,
      originalCurrency text,
      merchant text,
      description text NOT NULL,
      category text,
      type text NOT NULL,
      balance text,
      externalId text,
      source text NOT NULL,
      importedAt integer DEFAULT (unixepoch()) NOT NULL,
      createdAt integer DEFAULT (unixepoch()) NOT NULL,
      updatedAt integer NOT NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON UPDATE no action ON DELETE restrict,
      FOREIGN KEY (counterpartyAccountId) REFERENCES accounts(id) ON UPDATE no action ON DELETE set null
    )
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_accountId_idx ON transactions (accountId)
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_counterpartyAccountId_idx ON transactions (counterpartyAccountId)
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_accountId_date_idx ON transactions (accountId, date)
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date)
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_merchant_idx ON transactions (merchant)
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions (category)
  `);

  db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS transactions_accountId_date_externalId_key ON transactions (accountId, date, externalId)
  `);
}
