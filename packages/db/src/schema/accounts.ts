import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    openDate: integer("openDate", { mode: "timestamp" }),
    openingBalance: text("openingBalance"),
    currentBalance: text("currentBalance"),
    currency: text("currency").notNull(),
    bankCode: text("bankCode").notNull(),
    isActive: integer("isActive", { mode: "boolean" })
      .notNull()
      .default(sql`1`),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("accounts_bankCode_idx").on(table.bankCode)]
);
