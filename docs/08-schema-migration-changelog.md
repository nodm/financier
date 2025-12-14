# Schema Migration Changelog

## Migration 0002 (December 14, 2025) - Balance Fields to Text

**Migration File**: `packages/db/drizzle/0002_clammy_orphan.sql`

### Changes

- Changed `openingBalance` from `numeric` to `text`
- Changed `currentBalance` from `numeric` to `text`

### Rationale

- Consistency with `amount` field in transactions table
- All monetary values now use text type for decimal precision
- Simplifies data model and type handling

### Impact

- ✅ No data loss - SQLite converts numeric to text transparently
- ✅ All packages updated to handle text balances
- ✅ Tests updated and passing

---

## Migration 0001 (December 14, 2025) - Date Format Standardization

**Migration File**: `packages/db/drizzle/0001_gray_odin.sql`

### Changes

#### Accounts Table
- Changed `openDate` from nullable `integer` (Unix timestamp) to required `text` (ISO 8601)
- Changed `isActive` from `integer` (boolean 0/1) to `text` (default 'true')
- Changed `createdAt` from `integer` with `(unixepoch())` to `text` with `CURRENT_TIMESTAMP`
- Changed `updatedAt` from `integer` to `text` with ISO string updates

#### Transactions Table
- Changed `date` from `integer` (Unix timestamp) to `text` (ISO 8601)
- Changed `importedAt` from `integer` with `(unixepoch())` to `text` with `CURRENT_TIMESTAMP`
- Changed `createdAt` from `integer` with `(unixepoch())` to `text` with `CURRENT_TIMESTAMP`
- Changed `updatedAt` from `integer` to `text` with ISO string updates

### Rationale

**Human Readability**
- ISO 8601 strings are directly readable in database tools
- No conversion needed for debugging or manual queries
- Example: `2025-12-14T08:00:00.000Z` vs `1765699200`

**Portability**
- ISO 8601 is a universal standard
- Easier migration to other databases if needed
- No timezone conversion issues

**Simplicity**
- JavaScript Date objects naturally convert to/from ISO strings
- No need for special timestamp mode in Drizzle
- Consistent with JSON serialization

### Impact

- ✅ No data loss - dates converted from Unix timestamps to ISO strings
- ✅ All packages updated (db, importer, mcp-server)
- ✅ Tests updated to use ISO date format
- ✅ All tests passing

### Code Changes

**Schema Updates**
- Removed `integer` imports from schema files
- Updated type definitions from `integer("field", { mode: "timestamp" })` to `text("field")`
- Updated defaults from `sql\`(unixepoch())\`` to `sql\`CURRENT_TIMESTAMP\``
- Updated `$onUpdate()` callbacks to return `new Date().toISOString()`

**Importer Package**
- Changed from `normalizeDate()` to `normalizeDateToISO()` for database operations
- Updated all `new Date()` calls to `new Date().toISOString()` for inserts
- Added `openDate` field (required) when creating accounts

**Tests**
- Updated all date literals in tests to use `.toISOString()`
- Updated test assertions to expect ISO string format

### Migration Application

```bash
# Backup database
cp ~/.financier/data.db ~/.financier/data.db.backup-$(date +%Y%m%d-%H%M%S)

# Apply migrations manually (drizzle-kit had issues with existing schema)
sqlite3 ~/.financier/data.db < packages/db/drizzle/0001_gray_odin.sql
sqlite3 ~/.financier/data.db < packages/db/drizzle/0002_clammy_orphan.sql

# Record migrations in tracking table
sqlite3 ~/.financier/data.db "INSERT INTO __drizzle_migrations (hash, created_at) VALUES 
  (1765698032534, $(date +%s)000), 
  (1765698524504, $(date +%s)000);"
```

---

## Migration 0000 (Initial) - Schema Creation

**Migration File**: `packages/db/drizzle/0000_low_phantom_reporter.sql`

### Changes

Initial database schema with accounts and transactions tables.

**Note**: This migration was marked as applied retroactively since the database was created manually before implementing Drizzle migrations.

---

## Future Considerations

### Potential Schema Changes

1. **Categories Table**
   - Separate table for transaction categories
   - Support for category hierarchy
   - Custom user-defined categories

2. **Tags System**
   - Many-to-many relationship via junction table
   - Flexible transaction organization

3. **Budgets Table**
   - Monthly/annual budget tracking
   - Category-level budgets
   - Budget alerts

4. **Recurring Transactions**
   - Pattern detection and tracking
   - Subscription management

### Migration Best Practices

- Always backup database before applying migrations
- Test migrations on copy of production data first
- Record migration hash in `__drizzle_migrations` table
- Update all affected packages and tests
- Document breaking changes in this changelog
