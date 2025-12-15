import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    openDate: text("openDate").notNull(),
    openingBalance: text("openingBalance").notNull().default("0"),
    currentBalance: text("currentBalance").notNull().default("0"),
    currency: text("currency").notNull(),
    bankCode: text("bankCode").notNull(),
    isActive: text("isActive").notNull().default("true"),
    createdAt: text("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updatedAt")
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [index("accounts_bankCode_idx").on(table.bankCode)]
);
