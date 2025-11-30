import { sql } from "drizzle-orm";
import {
  index,
  integer,
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
    date: integer("date", { mode: "timestamp" }).notNull(),
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
    importedAt: integer("importedAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    accountIdIdx: index("transactions_accountId_idx").on(table.accountId),
    counterpartyIdx: index("transactions_counterpartyAccountId_idx").on(
      table.counterpartyAccountId
    ),
    accountDateIdx: index("transactions_accountId_date_idx").on(
      table.accountId,
      table.date
    ),
    dateIdx: index("transactions_date_idx").on(table.date),
    merchantIdx: index("transactions_merchant_idx").on(table.merchant),
    categoryIdx: index("transactions_category_idx").on(table.category),
    uniqueConstraint: unique("transactions_accountId_date_externalId_key").on(
      table.accountId,
      table.date,
      table.externalId
    ),
  })
);
