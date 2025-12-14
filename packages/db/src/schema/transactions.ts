import { sql } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { accounts } from "./accounts.js";

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    counterpartyAccountId: text("counterpartyAccountId").references(
      () => accounts.id,
      { onDelete: "set null" }
    ),
    date: text("date").notNull(),
    amount: text("amount").notNull(),
    currency: text("currency").notNull(),
    originalAmount: text("originalAmount"),
    originalCurrency: text("originalCurrency"),
    merchant: text("merchant"),
    description: text("description").notNull(),
    category: text("category"),
    type: text("type").notNull(),
    balance: text("balance"),
    externalId: text("externalId"),
    source: text("source").notNull(),
    importedAt: text("importedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updatedAt")
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [
    index("transactions_accountId_idx").on(table.accountId),
    index("transactions_counterpartyAccountId_idx").on(
      table.counterpartyAccountId
    ),
    index("transactions_accountId_date_idx").on(table.accountId, table.date),
    index("transactions_date_idx").on(table.date),
    index("transactions_merchant_idx").on(table.merchant),
    index("transactions_category_idx").on(table.category),
    unique("transactions_accountId_date_externalId_key").on(
      table.accountId,
      table.date,
      table.externalId
    ),
  ]
);
