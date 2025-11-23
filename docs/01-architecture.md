# Architecture Documentation

## System Architecture

### High-Level Design

```
┌────────────────────────────────────────────────────────────┐
│                         User Layer                         │
│  ┌──────────────┐              ┌──────────────────────┐    │
│  │  CLI Tools   │              │   LLM Applications   │    │
│  │  (Terminal)  │              │  (Claude Desktop)    │    │
│  └──────┬───────┘              └─────────┬────────────┘    │
└─────────┼────────────────────────────────┼─────────────────┘
          │                                │
          │                                │
┌─────────▼─────────┐           ┌──────────▼──────────────┐
│    Importer       │           │     MCP Server          │
│  (CLI Process)    │           │  (Long-running daemon)  │
└─────────┬─────────┘           └──────────┬──────────────┘
          │                                │
          │                                │
          └─────────┬──────────────────────┘
                    │
          ┌─────────▼──────────┐
          │    Database Layer  │
          │  (Prisma Client)   │
          └─────────┬──────────┘
                    │
          ┌─────────▼───────────┐
          │   SQLite Database   │
          │ ~/.financier/data.db│
          └─────────────────────┘
```

## Package Architecture

### Dependency Graph

```
@nodm/financier-importer ─┐
                          │
                          ├──> @nodm/financier-db ──> @nodm/financier-types
                          │                                   │
@nodm/financier-mcp-server┘                                   │
                                                              │
                                                           ┌──▼──┐
                                                           │ zod │
                                                           └─────┘
```

### Package Details

#### @nodm/financier-types

**Purpose**: Shared type definitions and validation schemas

**Exports**:
```typescript
// Types
export type BankCode = 'BANK1' | 'BANK2' | 'BANK3' | 'BANK4';
export type TransactionType = 'debit' | 'credit' | 'transfer';
export type Currency = 'EUR' | 'USD' | 'GBP' | ...;

// Zod Schemas
export const CreateTransactionInputSchema: z.ZodSchema;
export const TransactionSchema: z.ZodSchema;
export const AccountSchema: z.ZodSchema;
export const ImportResultSchema: z.ZodSchema;

// Inferred Types
export type CreateTransactionInput = z.infer;
export type Transaction = z.infer;
export type Account = z.infer;

// Error Classes
export class FinancierError extends Error;
export class ValidationError extends FinancierError;
```

**Directory Structure**:
```
packages/types/
├── src/
│   ├── index.ts
│   ├── schemas/
│   │   ├── transaction.ts
│   │   ├── account.ts
│   │   └── import-result.ts
│   ├── types/
│   │   ├── bank.ts
│   │   ├── currency.ts
│   │   └── transaction.ts
│   └── errors/
│       └── index.ts
├── package.json
└── tsconfig.json
```

#### @nodm/financier-db

**Purpose**: Database schema, client, and migrations

**Exports**:
```typescript
// Prisma Client
export { PrismaClient } from '@prisma/client';

// Generated Types
export type { Transaction, Account, Prisma } from '@prisma/client';

// Database Utilities
export function getDatabaseClient(): PrismaClient;
export function ensureDatabaseExists(): Promise;
export function runMigrations(): Promise;
```

**Directory Structure**:
```
packages/db/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── (migration files)
├── src/
│   ├── index.ts
│   └── client.ts
├── package.json
└── tsconfig.json
```

**Prisma Schema Location**: `packages/db/prisma/schema.prisma`

**Database Location**: `~/.financier/data.db` (created automatically)

#### @nodm/financier-importer

**Purpose**: CLI tool for importing bank CSV files

**CLI Interface**:
```bash
financier import  [options]

Options:
  --dry-run          Show what would be imported without saving
  --account      Override account ID detection
  --verbose          Show detailed processing information
  -h, --help         Display help
```

**Core Responsibilities**:
1. Parse CSV files using papaparse
2. Detect bank format from headers
3. Handle multi-account CSVs (account boundary detection)
4. Validate transactions using Zod schemas
5. Check for duplicates
6. Insert validated transactions into database

**Directory Structure**:
```
packages/importer/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── cli.ts                      # Commander setup
│   ├── parsers/
│   │   ├── base-parser.ts          # Abstract parser
│   │   ├── bank1-parser.ts
│   │   ├── bank2-parser.ts
│   │   ├── bank3-parser.ts
│   │   ├── bank4-parser.ts
│   │   └── parser-factory.ts       # Bank detection
│   ├── services/
│   │   ├── csv-reader.ts           # Papaparse wrapper
│   │   ├── transaction-importer.ts # DB insertion logic
│   │   └── duplicate-detector.ts   # Deduplication
│   └── errors/
│       ├── import-error.ts
│       └── unsupported-bank-error.ts
├── package.json
└── tsconfig.json
```

**Bank Detection Strategy**:
```typescript
// parser-factory.ts
function detectBank(headers: string[]): BankCode {
  // Check header patterns unique to each bank
  // Throw UnsupportedBankError if no match
}
```

**Account Boundary Detection**:
```typescript
// For CSVs with multiple accounts separated by delimiter rows
const ACCOUNT_SEPARATOR_PATTERN = /SĄSKAITOS\s+\(([A-Z0-9]+)\)\s+IŠRAŠAS/;
```

#### @nodm/financier-mcp-server

**Purpose**: MCP server exposing financial data to LLMs

**MCP Tools** (Read-only in v1):
1. `query_transactions` - Filter transactions by various criteria
2. `get_accounts` - List all accounts with current balances
3. `search_transactions` - Full-text search across transactions
4. `get_statistics` - Aggregated spending/income statistics

**Directory Structure**:
```
packages/mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── server.ts                # MCP server setup
│   ├── tools/
│   │   ├── query-transactions.ts
│   │   ├── get-accounts.ts
│   │   ├── search-transactions.ts
│   │   └── get-statistics.ts
│   ├── services/
│   │   ├── transaction-service.ts
│   │   └── account-service.ts
│   └── errors/
│       ├── database-error.ts
│       └── query-error.ts
├── package.json
└── tsconfig.json
```

**Tool Specifications**:

```typescript
// query_transactions
interface QueryTransactionsInput {
  dateFrom?: string;        // ISO 8601
  dateTo?: string;          // ISO 8601
  accountId?: string;
  category?: string;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;           // Default: 100
  offset?: number;          // For pagination
}

// get_accounts
interface GetAccountsInput {
  includeBalance?: boolean; // Default: true
}

// search_transactions
interface SearchTransactionsInput {
  query: string;            // Full-text search
  limit?: number;           // Default: 50
}

// get_statistics
interface GetStatisticsInput {
  dateFrom: string;         // Required
  dateTo: string;           // Required
  accountId?: string;
  groupBy?: 'category' | 'merchant' | 'month';
}
```

## Data Flow Details

### Import Flow

```
1. User runs: financier import statement.csv
2. Importer reads CSV file using papaparse
3. Detect bank from CSV headers
4. Parse CSV based on bank format
5. For each row:
   a. Extract account number (for multi-account CSVs)
   b. Map CSV fields to transaction structure
   c. Validate using Zod schema
   d. Check for duplicates (externalId + accountId + date)
   e. If not duplicate, prepare for insertion
6. Begin database transaction
7. Ensure account exists (create if needed)
8. Insert all validated transactions
9. Commit transaction
10. Report results (imported count, skipped duplicates, errors)
```

### Query Flow

```
1. LLM sends MCP request to server
2. MCP server validates tool call parameters
3. Server calls appropriate service method
4. Service queries database using Prisma
5. Results are validated against Zod schemas (optional)
6. Results formatted for LLM consumption
7. MCP server returns formatted response
8. LLM processes and presents to user
```

## Error Handling Strategy

### Error Hierarchy

```
FinancierError (base class)
├── ValidationError
│   ├── InvalidTransactionError
│   └── InvalidAccountError
├── ImportError
│   ├── UnsupportedBankError
│   ├── CSVParseError
│   └── DuplicateTransactionError (not thrown, just reported)
├── DatabaseError
│   ├── ConnectionError
│   ├── MigrationError
│   └── TransactionError
└── QueryError
    ├── InvalidParameterError
    └── ResourceNotFoundError
```

### Error Handling Patterns

**In Importer**:
```typescript
try {
  const result = await importCSV(filePath);
  console.log(`Imported ${result.imported} transactions`);
  if (result.skipped > 0) {
    console.warn(`Skipped ${result.skipped} duplicates`);
  }
} catch (error) {
  if (error instanceof UnsupportedBankError) {
    console.error('Could not detect bank format. Supported banks: ...');
    process.exit(1);
  }
  if (error instanceof ValidationError) {
    console.error(`Invalid data: ${error.message}`);
    process.exit(1);
  }
  throw error; // Unexpected errors
}
```

**In MCP Server**:
```typescript
try {
  const transactions = await queryTransactions(params);
  return { success: true, data: transactions };
} catch (error) {
  if (error instanceof QueryError) {
    return { success: false, error: error.message };
  }
  if (error instanceof DatabaseError) {
    return { success: false, error: 'Database error occurred' };
  }
  throw error; // Log and rethrow unexpected errors
}
```

## Database Strategy

### Location and Initialization

- **Path**: `~/.financier/data.db`
- **Creation**: Automatic on first use
- **Migrations**: Run automatically via Prisma Migrate

### Connection Management

**In Importer** (short-lived):
```typescript
const db = getDatabaseClient();
await importTransactions(db, transactions);
await db.$disconnect();
```

**In MCP Server** (long-lived):
```typescript
const db = getDatabaseClient();
// Keep connection open for the server lifetime
// Prisma handles connection pooling automatically
```

### Schema Management

- Schema defined in `@nodm/financier-db/prisma/schema.prisma`
- Migrations generated via `prisma migrate dev`
- Migrations applied automatically on first run
- Future: Migration CLI command for manual control

## Configuration

### User Configuration File

**Location**: `~/.financier/config.json`

**Initial structure** (future enhancement):
```json
{
  "database": {
    "path": "~/.financier/data.db"
  },
  "importer": {
    "defaultCurrency": "EUR",
    "duplicateHandling": "skip"
  },
  "mcpServer": {
    "port": 3000,
    "logLevel": "info"
  }
}
```

Currently: No configuration file, use hardcoded defaults.

## Performance Considerations

### Importer
- Batch inserts for large CSVs (use Prisma `createMany`)
- Transaction batching (1000 records per batch)
- Memory-efficient CSV streaming for large files
- Index on `(accountId, date, externalId)` for duplicate detection

### MCP Server
- Query result limits (default 100, max 1000)
- Pagination support for large result sets
- Database indexes on frequently queried fields
- Consider caching for statistics queries (future)

## Testing Strategy

### Unit Tests
- All parsers (bank format detection, CSV parsing)
- Validation schemas (Zod)
- Database utilities
- MCP tool handlers

### Integration Tests
- Import workflow (CSV → DB)
- Query workflows (DB → MCP response)
- Multi-account CSV handling
- Duplicate detection

### Test Database
- Use separate `test.db` file
- Reset before each test suite
- Mock CSV files in `tests/fixtures/`

## Deployment Architecture

### Development
```
Local machine:
  - nx workspace
  - SQLite at ~/.financier/data.db
  - Run importer via: nx run importer:start
  - Run MCP server via: nx run mcp-server:start
```

### Production (Initial - Local Installation)
```
User's machine:
  - npm install -g @nodm/financier-importer
  - npm install -g @nodm/financier-mcp-server
  - Configure MCP server in Claude Desktop
  - SQLite at ~/.financier/data.db
```

### Future (Cloud Deployment)
```
Cloud:
  - PostgreSQL database
  - MCP server deployed as service
  - Web UI for management
  - OAuth for authentication
```

## Security Architecture

### Current (Local-Only)
- No authentication required
- Relies on OS-level file permissions
- No network exposure
- Data never leaves user's machine

### Future (Cloud)
- JWT authentication for MCP server
- Database encryption at rest
- TLS for all communications
- Row-level security in PostgreSQL
- Audit logging

## Observability

### Logging
- **Current**: Console-based with log levels (error, warn, info, debug)
- **Future**: Structured logging with pino or winston
- **Log Location**: stdout/stderr for now

### Monitoring
- **Current**: None
- **Future**: 
  - Import success/failure metrics
  - Query performance metrics
  - Error rate tracking

### Debugging
- TypeScript source maps enabled
- Verbose mode in importer (`--verbose` flag)
- Debug logs in MCP server (configurable)
