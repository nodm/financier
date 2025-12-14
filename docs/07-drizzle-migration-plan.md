# Drizzle ORM Migration Plan

> **✅ MIGRATION COMPLETED** - This document is kept for historical reference. The migration from Prisma to Drizzle ORM has been successfully completed. See [02-database-schema.md](./02-database-schema.md) for current schema documentation.

## Executive Summary

Migration from Prisma to Drizzle ORM for improved type safety, zero-cost abstractions, and lighter runtime. Drizzle provides SQL-like query builder with full TypeScript inference while maintaining SQLite compatibility.

**Estimated Complexity**: Medium (3-5 days)
**Risk Level**: Low (small codebase, existing tests)
**Breaking Changes**: Internal only (no API changes)

## Why Drizzle?

### Advantages over Prisma
- **Zero dependencies**: No code generation step, smaller bundle
- **SQL-like syntax**: More transparent queries, easier debugging
- **Better type inference**: Full end-to-end TypeScript without generated types
- **Lighter runtime**: ~40KB vs Prisma's ~2MB
- **Direct SQL access**: Write raw SQL when needed without escape hatches
- **Faster queries**: No additional abstraction layer overhead

### Trade-offs
- **Manual migrations**: No auto-migration generation (must write SQL)
- **Smaller ecosystem**: Fewer third-party tools/integrations
- **Learning curve**: Different API paradigm from Prisma

## Current State Analysis

### Prisma Usage Map

**packages/db**
- `src/lib/client.ts`: PrismaClient singleton with better-sqlite3 adapter
- `src/lib/utils.ts`: Database path/initialization utilities
- `src/index.ts`: Exports PrismaClient, Prisma namespace
- `prisma/schema.prisma`: Schema definition (Account, Transaction models)
- `prisma/migrations/`: Single migration (init)

**packages/importer**
- `src/services/transaction-importer.ts`:
  - `prisma.account.findUnique()` - check account existence
  - `prisma.account.create()` - create missing accounts
  - `prisma.transaction.createMany()` - bulk insert transactions
  - `prisma.$disconnect()` - cleanup
- `src/services/duplicate-detector.ts`:
  - `prisma.transaction.findFirst()` - check for duplicates

**packages/mcp-server**
- Not yet implemented (placeholder only)

### Database Schema

```sql
-- accounts table
id TEXT PRIMARY KEY (IBAN)
name TEXT NOT NULL
openDate DATETIME
openingBalance DECIMAL
currentBalance DECIMAL
currency TEXT NOT NULL
bankCode TEXT NOT NULL
isActive BOOLEAN DEFAULT true
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
updatedAt DATETIME

-- transactions table
id TEXT PRIMARY KEY (UUID)
accountId TEXT NOT NULL (FK -> accounts.id)
counterpartyAccountId TEXT (FK -> accounts.id)
date DATETIME NOT NULL
amount DECIMAL NOT NULL
currency TEXT NOT NULL
originalAmount DECIMAL
originalCurrency TEXT
merchant TEXT
description TEXT NOT NULL
category TEXT
type TEXT NOT NULL
balance DECIMAL
externalId TEXT
source TEXT NOT NULL
importedAt DATETIME DEFAULT CURRENT_TIMESTAMP
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
updatedAt DATETIME

-- Indexes
accounts: bankCode
transactions: accountId, counterpartyAccountId, accountId+date, date, merchant, category
transactions: UNIQUE(accountId, date, externalId)
```

### Query Patterns

1. **Find unique**: `prisma.account.findUnique({ where: { id } })`
2. **Create**: `prisma.account.create({ data })`
3. **Create many**: `prisma.transaction.createMany({ data })`
4. **Find first**: `prisma.transaction.findFirst({ where })`
5. **Disconnect**: `prisma.$disconnect()`

## Migration Strategy

### Phase 1: Setup & Schema Definition

**Duration**: 0.5 days

1. **Install Drizzle dependencies**
   ```bash
   cd packages/db
   npm install drizzle-orm better-sqlite3
   npm install -D drizzle-kit @types/better-sqlite3
   ```

2. **Create Drizzle config** (`packages/db/drizzle.config.ts`)
   ```typescript
   import { defineConfig } from "drizzle-kit";

   export default defineConfig({
     dialect: "sqlite",
     schema: "./src/schema/index.ts",
     out: "./drizzle",
     dbCredentials: {
       url: process.env.DATABASE_URL || "~/.financier/data.db"
     }
   });
   ```

3. **Define schema** (`packages/db/src/schema/`)
   - `accounts.ts`: Account table schema
   - `transactions.ts`: Transaction table schema with relations
   - `index.ts`: Export all schemas

4. **Update package.json scripts**
   ```json
   {
     "scripts": {
       "db:generate": "drizzle-kit generate",
       "db:migrate": "drizzle-kit migrate",
       "db:push": "drizzle-kit push",
       "db:studio": "drizzle-kit studio"
     }
   }
   ```

### Phase 2: Schema Implementation

**Duration**: 1 day

**File**: `packages/db/src/schema/accounts.ts`
```typescript
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    openDate: integer("openDate", { mode: "timestamp" }),
    openingBalance: text("openingBalance"), // Store as TEXT for precision
    currentBalance: text("currentBalance"),
    currency: text("currency").notNull(),
    bankCode: text("bankCode").notNull(),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(sql`1`),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    bankCodeIdx: index("accounts_bankCode_idx").on(table.bankCode),
  })
);
```

**File**: `packages/db/src/schema/transactions.ts`
```typescript
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { accounts } from "./accounts.js";

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    counterpartyAccountId: text("counterpartyAccountId")
      .references(() => accounts.id, { onDelete: "set null" }),
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
    importedAt: integer("importedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    accountIdIdx: index("transactions_accountId_idx").on(table.accountId),
    counterpartyIdx: index("transactions_counterpartyAccountId_idx").on(table.counterpartyAccountId),
    accountDateIdx: index("transactions_accountId_date_idx").on(table.accountId, table.date),
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
```

**File**: `packages/db/src/schema/index.ts`
```typescript
export { accounts } from "./accounts.js";
export { transactions } from "./transactions.js";
```

### Phase 3: Client Replacement

**Duration**: 0.5 days

**File**: `packages/db/src/lib/client.ts`
```typescript
import { DatabaseError } from "@nodm/financier-types";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema/index.js";
import { getDatabasePath } from "./utils.js";

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqliteClient: Database.Database | null = null;

export function getDatabaseClient(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    try {
      const databaseUrl = process.env.DATABASE_URL || `file:${getDatabasePath()}`;

      const dbPath = databaseUrl.startsWith("file://")
        ? databaseUrl.slice(7)
        : databaseUrl.startsWith("file:")
          ? databaseUrl.slice(5)
          : databaseUrl;

      sqliteClient = new Database(dbPath, {
        verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
        timeout: 5000,
      });

      db = drizzle(sqliteClient, { schema });
    } catch (error) {
      throw new DatabaseError(
        "Failed to initialize database client",
        error instanceof Error ? error : undefined
      );
    }
  }
  return db;
}

export async function disconnectDatabase(): Promise<void> {
  if (sqliteClient) {
    sqliteClient.close();
    sqliteClient = null;
    db = null;
  }
}

export async function resetDatabaseClient(): Promise<void> {
  await disconnectDatabase();
}
```

**File**: `packages/db/src/index.ts`
```typescript
export * from "./schema/index.js";
export {
  disconnectDatabase,
  getDatabaseClient,
  resetDatabaseClient,
} from "./lib/client.js";
export {
  databaseExists,
  ensureDatabaseDirectory,
  getDatabaseDir,
  getDatabasePath,
  initializeDatabase,
} from "./lib/utils.js";
```

### Phase 4: Query Migration (Importer)

**Duration**: 1 day

**File**: `packages/importer/src/services/transaction-importer.ts`

**Before**:
```typescript
const existing = await prisma.account.findUnique({
  where: { id: accountId },
});
```

**After**:
```typescript
import { eq } from "drizzle-orm";
import { accounts } from "@nodm/financier-db";

const [existing] = await db
  .select()
  .from(accounts)
  .where(eq(accounts.id, accountId));
```

**Before**:
```typescript
await prisma.account.create({
  data: {
    id: accountId,
    name: `Account ${accountId.slice(-4)}`,
    currency: 'EUR',
    bankCode,
  },
});
```

**After**:
```typescript
await db.insert(accounts).values({
  id: accountId,
  name: `Account ${accountId.slice(-4)}`,
  currency: 'EUR',
  bankCode,
  updatedAt: new Date(),
});
```

**Before**:
```typescript
await prisma.transaction.createMany({
  data: newTransactions.map((t) => ({ /* ... */ })),
});
```

**After**:
```typescript
import { transactions } from "@nodm/financier-db";

await db.insert(transactions).values(
  newTransactions.map((t) => ({ /* ... */ }))
);
```

**File**: `packages/importer/src/services/duplicate-detector.ts`

**Before**:
```typescript
const existing = await prisma.transaction.findFirst({
  where: {
    accountId,
    externalId: transaction.externalId,
    date: transaction.date,
  },
});
```

**After**:
```typescript
import { and, eq } from "drizzle-orm";
import { transactions } from "@nodm/financier-db";

const [existing] = await db
  .select()
  .from(transactions)
  .where(
    and(
      eq(transactions.accountId, accountId),
      eq(transactions.externalId, transaction.externalId),
      eq(transactions.date, transaction.date)
    )
  )
  .limit(1);
```

### Phase 5: Migration Path

**Duration**: 0.5 days

**Option A: Fresh Migration (Recommended)**
- Generate new Drizzle migration from schema
- Users run migration on existing databases
- Preserves all data

**Option B: Schema Introspection**
- Use `drizzle-kit introspect` to generate schema from existing DB
- Compare with hand-written schema
- Validate compatibility

**Steps**:
1. Generate migration: `npm run db:generate`
2. Review migration SQL in `packages/db/drizzle/`
3. Test on copy of production database
4. Document rollback procedure
5. Create migration guide for users

**Rollback Strategy**:
- Keep Prisma dependencies as devDependencies temporarily
- Tag release before migration
- Provide downgrade path in docs

### Phase 6: Testing & Validation

**Duration**: 1 day

1. **Update existing tests**
   - `packages/importer/tests/services/duplicate-detector.test.ts`
   - Verify all test cases pass with Drizzle queries

2. **Add integration tests**
   - Test full import flow end-to-end
   - Test transaction with exact same data produces same DB state
   - Compare query results between Prisma/Drizzle (side-by-side)

3. **Performance benchmarks**
   - Import 10K transactions (Prisma vs Drizzle)
   - Measure memory usage
   - Measure query latency

4. **Manual testing**
   - Run importer CLI on real CSV files
   - Verify duplicate detection works
   - Check database integrity

### Phase 7: Cleanup & Documentation

**Duration**: 0.5 days

1. **Remove Prisma dependencies**
   ```bash
   npm uninstall @prisma/client @prisma/adapter-better-sqlite3 prisma
   ```

2. **Delete Prisma artifacts**
   - Remove `packages/db/prisma/` directory
   - Remove Prisma scripts from package.json
   - Update .gitignore (remove `prisma/generated`)

3. **Update package.json**
   ```json
   {
     "dependencies": {
       "drizzle-orm": "^0.36.0",
       "better-sqlite3": "^12.4.6"
     },
     "devDependencies": {
       "drizzle-kit": "^0.28.0",
       "@types/better-sqlite3": "^7.6.13"
     }
   }
   ```

## Documentation Updates

### Files to Update

1. **CLAUDE.md**
   - Replace Prisma commands with Drizzle equivalents
   - Update database section
   - Update architecture diagram
   - Update TypeScript conventions (if needed)

2. **docs/01-architecture.md**
   - Replace ORM reference from Prisma to Drizzle
   - Update dependency graph
   - Update technology stack

3. **docs/02-database-schema.md**
   - Replace Prisma schema with Drizzle schema
   - Update migration instructions
   - Add Drizzle-specific notes

4. **docs/05-development-setup.md**
   - Replace Prisma setup steps with Drizzle
   - Update commands for migrations/studio
   - Add Drizzle Kit usage guide

5. **docs/06-implementation-plan.md**
   - Mark Phase 2 (Database Package) as updated
   - Add note about Drizzle migration

6. **README.md** (if exists)
   - Update tech stack section
   - Update getting started commands

### New Documentation

**File**: `docs/08-drizzle-guide.md`

Topics:
- Why Drizzle over Prisma
- Schema definition patterns
- Query patterns used in codebase
- Migration workflow
- Common operations (CRUD examples)
- Troubleshooting

## Risk Assessment

### High Risk
- None identified

### Medium Risk
- **Type mismatches**: Decimal → TEXT conversion for precision
  - Mitigation: Add runtime validation, comprehensive tests
- **Date handling**: Prisma DateTime → Drizzle timestamp mode
  - Mitigation: Test all date comparisons, timezone handling

### Low Risk
- **Unique constraint behavior**: Should be identical in SQLite
- **Foreign key cascade**: Explicitly defined in both ORMs
- **Index performance**: Same underlying SQLite indexes

## Rollback Plan

If critical issues discovered post-migration:

1. Revert to tagged release before migration
2. Restore Prisma dependencies
3. Run Prisma migrations
4. Document issues in GitHub issue
5. Fix in separate branch, re-attempt migration

**Rollback Window**: 30 days after migration

## Success Criteria

- [ ] All existing tests pass
- [ ] Import CLI works with sample CSV files
- [ ] Duplicate detection functions correctly
- [ ] No performance regression (within 5%)
- [ ] Bundle size reduced by >1.5MB
- [ ] All documentation updated
- [ ] No TypeScript errors
- [ ] CI/CD pipeline passes

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Setup & Config | 0.5 days | None |
| 2. Schema Definition | 1 day | Phase 1 |
| 3. Client Replacement | 0.5 days | Phase 2 |
| 4. Query Migration | 1 day | Phase 3 |
| 5. Migration Path | 0.5 days | Phase 4 |
| 6. Testing | 1 day | Phase 5 |
| 7. Cleanup & Docs | 0.5 days | Phase 6 |
| **Total** | **5 days** | |

## Implementation Checklist

### Pre-Migration
- [ ] Create feature branch: `nodm/migrate-to-drizzle`
- [ ] Tag current main branch: `v0.0.1-pre-drizzle`
- [ ] Backup production database
- [ ] Run full test suite on Prisma implementation

### Phase 1: Setup
- [ ] Install drizzle-orm, drizzle-kit
- [ ] Create drizzle.config.ts
- [ ] Update .gitignore for Drizzle artifacts

### Phase 2: Schema
- [ ] Create src/schema/accounts.ts
- [ ] Create src/schema/transactions.ts
- [ ] Create src/schema/index.ts
- [ ] Generate migration with drizzle-kit

### Phase 3: Client
- [ ] Rewrite src/lib/client.ts with Drizzle
- [ ] Update src/index.ts exports
- [ ] Test singleton pattern

### Phase 4: Queries
- [ ] Update transaction-importer.ts
- [ ] Update duplicate-detector.ts
- [ ] Update type imports

### Phase 5: Migration
- [ ] Test migration on copy of DB
- [ ] Verify data integrity
- [ ] Document migration steps

### Phase 6: Testing
- [ ] Update all test files
- [ ] Add integration tests
- [ ] Run performance benchmarks
- [ ] Manual CSV import testing

### Phase 7: Cleanup
- [ ] Remove Prisma dependencies
- [ ] Delete prisma/ directory
- [ ] Update all documentation
- [ ] Create docs/08-drizzle-guide.md

### Post-Migration
- [ ] Create PR with full diff
- [ ] Code review
- [ ] Merge to main
- [ ] Tag release: `v0.1.0-drizzle`
- [ ] Monitor for issues (30 days)

## Open Questions

1. **Decimal precision**: Store as TEXT or INTEGER (cents)?
   - Recommendation: TEXT for exact decimal representation

2. **Migration tool**: Keep drizzle-kit or custom migration runner?
   - Recommendation: Keep drizzle-kit for Studio and introspection

3. **Timestamp storage**: INTEGER (Unix) or TEXT (ISO 8601)?
   - Recommendation: INTEGER with Drizzle's timestamp mode for performance

4. **Schema co-location**: Keep separate files or single schema.ts?
   - Recommendation: Separate files for maintainability

5. **Type generation**: Export inferred types from schema?
   - Recommendation: Yes, export `type Account = typeof accounts.$inferSelect`

## Notes

- Maintain backward compatibility at API level (same exports from @nodm/financier-db)
- No breaking changes for packages/importer or packages/mcp-server
- Consider running Prisma + Drizzle side-by-side during migration phase for validation
- Drizzle Studio available as replacement for Prisma Studio
- SQLite dialect differences: none expected (same underlying database)

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle SQLite Guide](https://orm.drizzle.team/docs/get-started-sqlite)
- [Migration from Prisma](https://orm.drizzle.team/docs/migration-from-prisma)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
