# Importer Specification

## Overview

The Financier Importer is a CLI tool that reads bank CSV statements, validates transactions, and imports them into the local SQLite database. It automatically detects bank formats and handles multi-account CSV files.

**Package**: `@nodm/financier-importer`  
**Published**: Yes (public npm)  
**Installation**: `npm install -g @nodm/financier-importer`

## Purpose

Simplify the process of importing bank statements:

- Single command to import any supported bank CSV
- Automatic bank format detection
- Duplicate prevention
- Data validation and error reporting

## CLI Interface

### Command Structure

```bash
financier import  [options]
```

### Arguments

- `<csv-file>` - Path to the CSV file (required)

### Options

- `--dry-run` - Preview import without writing to database
- `--account <id>` - Override automatic account detection
- `--verbose` - Show detailed processing information
- `--skip-duplicates` - Skip duplicate transactions silently (default: true)
- `-h, --help` - Display help information
- `-v, --version` - Show version number

### Examples

```bash
# Basic import
financier import ~/Downloads/statement.csv

# Dry run to preview
financier import statement.csv --dry-run

# Verbose output for debugging
financier import statement.csv --verbose

# Override account ID
financier import statement.csv --account LT000000000000000123
```

### Exit Codes

- `0` - Success (all transactions imported or skipped as duplicates)
- `1` - Error (unsupported bank, validation failure, database error)
- `2` - Partial success (some transactions imported, some failed)

---

## Bank Detection

### Detection Strategy

Identify bank from CSV header row:

```typescript
function detectBank(headers: string[]): BankCode {
  // Each bank has unique header patterns

  if (
    headers.includes('Operacijos data') &&
    headers.includes('Gavėjas / Mokėtojas')
  ) {
    return 'BANK1';
  }

  if (headers.includes('Transaction Date') && headers.includes('Merchant')) {
    return 'BANK2';
  }

  // ... other banks

  throw new UnsupportedBankError('Could not detect bank format');
}
```

### Supported Banks

**Bank 1**: TBD (awaiting CSV samples)  
**Bank 2**: TBD (awaiting CSV samples)  
**Bank 3**: TBD (awaiting CSV samples)  
**Bank 4**: TBD (awaiting CSV samples)

Each bank will have:

- Unique header pattern for detection
- Custom parser implementation
- Field mapping configuration

---

## CSV Parsing

### Library: papaparse

```typescript
import Papa from 'papaparse';

function parseCSV(filePath: string): Promise {
  return new Promise((resolve, reject) => {
    Papa.parse(createReadStream(filePath), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => resolve(results),
      error: (error) => reject(new CSVParseError(error.message)),
    });
  });
}
```

### CSV Structure

#### Single-Account CSV

```csv
Date,Amount,Merchant,Description
2025-11-22,-50.00,Amazon,Order #123
2025-11-21,-15.00,Starbucks,Coffee
```

#### Multi-Account CSV

Some banks include multiple accounts in one file, separated by delimiter rows:

```csv
"SĄSKAITOS  (LT000000000000000004) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-10-01-2025-11-22)"
Date,Amount,Merchant,Description
2025-11-22,-50.00,Amazon,Order #123
2025-11-21,-15.00,Starbucks,Coffee

"SĄSKAITOS  (LT000000000000000005) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-10-01-2025-11-22)"
Date,Amount,Merchant,Description
2025-11-20,-100.00,Rent,Monthly rent
```

**Account Separator Pattern**:

```typescript
const ACCOUNT_SEPARATOR_PATTERN = /SĄSKAITOS\s+\(([A-Z0-9]+)\)\s+IŠRAŠAS/;

// Extract account number: LT000000000000000004
const match = line.match(ACCOUNT_SEPARATOR_PATTERN);
if (match) {
  const accountId = match[1];
}
```

---

## Parser Architecture

### Base Parser (Abstract)

**File**: `packages/importer/src/parsers/base-parser.ts`

```typescript
export abstract class BaseParser {
  abstract bankCode: BankCode;
  abstract requiredHeaders: string[];

  // Detect if this parser can handle the CSV
  canParse(headers: string[]): boolean {
    return this.requiredHeaders.every((h) => headers.includes(h));
  }

  // Parse entire CSV file
  abstract parse(filePath: string): Promise;

  // Map CSV row to transaction structure
  protected abstract mapRow(row: CSVRow, accountId: string): ParsedTransaction;

  // Extract account ID from CSV data
  protected abstract extractAccountId(data: CSVData): string;
}
```

### Bank-Specific Parsers

Each bank has its own parser:

**File**: `packages/importer/src/parsers/bank1-parser.ts`

```typescript
export class Bank1Parser extends BaseParser {
  bankCode = 'BANK1' as const;
  requiredHeaders = ['Operacijos data', 'Suma', 'Gavėjas / Mokėtojas'];

  async parse(filePath: string): Promise {
    const csvData = await parseCSV(filePath);
    const accountId = this.extractAccountId(csvData);

    const transactions = csvData.data.map((row) => this.mapRow(row, accountId));

    return { accountId, transactions };
  }

  protected mapRow(row: CSVRow, accountId: string): ParsedTransaction {
    return {
      accountId,
      date: parseDate(row['Operacijos data']),
      amount: parseAmount(row['Suma']),
      currency: row['Valiuta'] || 'EUR',
      merchant: row['Gavėjas / Mokėtojas'],
      description: row['Papildoma informacija'],
      type: parseTransactionType(row['Suma']),
      externalId: row['Operacijos ID'],
      source: this.bankCode,
    };
  }

  protected extractAccountId(data: CSVData): string {
    // Bank1-specific account extraction logic
  }
}
```

### Parser Factory

**File**: `packages/importer/src/parsers/parser-factory.ts`

```typescript
const PARSERS = [
  new Bank1Parser(),
  new Bank2Parser(),
  new Bank3Parser(),
  new Bank4Parser(),
];

export function getParser(filePath: string): BaseParser {
  const csvData = parseCSV(filePath);
  const headers = csvData.meta.fields;

  const parser = PARSERS.find((p) => p.canParse(headers));

  if (!parser) {
    throw new UnsupportedBankError(
      `Could not detect bank format. Headers: ${headers.join(', ')}`
    );
  }

  return parser;
}
```

---

## Data Validation

### Validation Pipeline

```typescript
import { CreateTransactionInputSchema } from '@nodm/financier-types';

function validateTransaction(data: ParsedTransaction): ValidatedTransaction {
  try {
    return CreateTransactionInputSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid transaction data: ${error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }
    throw error;
  }
}
```

### Validation Rules (Zod Schemas)

Defined in `@nodm/financier-types`:

```typescript
export const CreateTransactionInputSchema = z.object({
  accountId: z.string().min(1),
  date: z.string().datetime().or(z.date()),
  amount: z.number().refine((val) => val !== 0, 'Amount cannot be zero'),
  currency: z.string().length(3).toUpperCase(),
  merchant: z.string().optional(),
  description: z.string(),
  category: z.string().optional(),
  type: z.enum(['debit', 'credit', 'transfer']),
  balance: z.number().optional(),
  externalId: z.string().optional(),
  source: z.string(),
});
```

---

## Duplicate Detection

### Strategy

Check for duplicates before insertion using composite key:

- `accountId` + `date` + `externalId`

### Implementation

```typescript
import { and, eq } from 'drizzle-orm';
import { transactions } from '@nodm/financier-db';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

async function isDuplicate(
  db: BetterSQLite3Database,
  transaction: ValidatedTransaction
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, transaction.accountId),
        eq(transactions.date, transaction.date),
        eq(transactions.externalId, transaction.externalId)
      )
    )
    .limit(1);

  return existing !== undefined;
}
```

### Handling Missing externalId

If bank doesn't provide transaction IDs, generate synthetic ID:

```typescript
function generateExternalId(transaction: ParsedTransaction): string {
  if (transaction.externalId) {
    return transaction.externalId;
  }

  const data = [
    transaction.date.toISOString(),
    transaction.amount.toString(),
    transaction.description,
  ].join('|');

  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}
```

---

## Import Process

### Main Import Function

**File**: `packages/importer/src/services/transaction-importer.ts`

```typescript
export async function importCSV(
  filePath: string,
  options: ImportOptions
): Promise {
  // 1. Detect bank and get parser
  const parser = getParser(filePath);

  // 2. Parse CSV file
  const parseResult = await parser.parse(filePath);

  // 3. Validate all transactions
  const validatedTransactions =
    parseResult.transactions.map(validateTransaction);

  // 4. Check for duplicates
  const db = getDatabaseClient();
  const newTransactions = await filterDuplicates(db, validatedTransactions);

  // 5. Ensure account exists
  await ensureAccountExists(db, parseResult.accountId, parser.bankCode);

  // 6. Import transactions (if not dry-run)
  if (!options.dryRun) {
    await insertTransactions(db, newTransactions);
  }

  // 7. Return results
  return {
    imported: newTransactions.length,
    skipped: validatedTransactions.length - newTransactions.length,
    errors: [],
  };
}
```

### Batch Insertion

```typescript
import { transactions as transactionsTable } from '@nodm/financier-db';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

async function insertTransactions(
  db: BetterSQLite3Database,
  transactions: ValidatedTransaction[]
) {
  const BATCH_SIZE = 1000;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    await db
      .insert(transactionsTable)
      .values(batch)
      .onConflictDoNothing();
  }
}
```

### Account Creation

```typescript
import { eq } from 'drizzle-orm';
import { accounts } from '@nodm/financier-db';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

async function ensureAccountExists(
  db: BetterSQLite3Database,
  accountId: string,
  bankCode: BankCode
) {
  const [existing] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!existing) {
    await db.insert(accounts).values({
      id: accountId,
      name: `Account ${accountId.slice(-4)}`, // Default name from last 4 digits
      currency: 'EUR', // Default from bank
      bankCode,
      updatedAt: new Date(),
    });
  }
}
```

---

## Output and Reporting

### Success Output

```
✓ Imported 150 transactions
  Skipped 5 duplicates
  Account: LT000000000000000004
  Date range: 2025-10-01 to 2025-11-22
```

### Dry Run Output

```
[DRY RUN] Would import 150 transactions:
  Account: LT000000000000000004
  Date range: 2025-10-01 to 2025-11-22
  Duplicates to skip: 5

Sample transactions:
  2025-11-22  -50.00 EUR  Amazon
  2025-11-21  -15.00 EUR  Starbucks
  2025-11-20 -100.00 EUR  Landlord
  ...
```

### Verbose Output

```
[INFO] Detecting bank format...
[INFO] Detected: Bank1
[INFO] Parsing CSV file...
[INFO] Found 155 transactions
[INFO] Validating transactions...
[INFO] Checking for duplicates...
[INFO] Found 5 duplicates to skip
[INFO] Ensuring account exists...
[INFO] Inserting 150 transactions in batches...
[INFO] Batch 1/1 complete
✓ Import complete
```

### Error Output

```
✗ Import failed: Unsupported bank format

Could not detect bank from CSV headers.
Supported banks:
  - Bank1 (headers: Operacijos data, Suma, ...)
  - Bank2 (headers: Transaction Date, Amount, ...)
  ...

Please check that your CSV file is from a supported bank.
```

---

## Error Handling

### Error Types

```typescript
// @nodm/financier-importer/src/errors/

export class ImportError extends FinancierError {}

export class UnsupportedBankError extends ImportError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedBankError';
  }
}

export class CSVParseError extends ImportError {
  constructor(message: string, public line?: number) {
    super(message);
    this.name = 'CSVParseError';
  }
}

export class DuplicateTransactionError extends ImportError {
  constructor(public transactionId: string) {
    super(`Transaction already exists: ${transactionId}`);
    this.name = 'DuplicateTransactionError';
  }
}
```

### Error Recovery

**Strategy**: Fail fast, don't partially import

If any error occurs during validation:

1. Report the error
2. Exit without importing any transactions
3. User fixes the issue and re-runs

**Rationale**: Better to import nothing than to import corrupted data.

**Exception**: Duplicates are not errors, they're skipped silently.

---

## CLI Implementation

### Using Commander.js

**File**: `packages/importer/src/cli.ts`

```typescript
import { Command } from 'commander';
import { importCSV } from './services/transaction-importer.js';

const program = new Command();

program
  .name('financier')
  .description('Import bank statements into The Financier')
  .version('0.1.0');

program
  .command('import')
  .description('Import transactions from a CSV file')
  .argument('', 'Path to the CSV file')
  .option('--dry-run', 'Preview import without writing to database')
  .option('--account ', 'Override account ID detection')
  .option('--verbose', 'Show detailed processing information')
  .action(async (csvFile, options) => {
    try {
      const result = await importCSV(csvFile, options);
      console.log(`✓ Imported ${result.imported} transactions`);
      if (result.skipped > 0) {
        console.log(`  Skipped ${result.skipped} duplicates`);
      }
      process.exit(0);
    } catch (error) {
      console.error(`✗ Import failed: ${error.message}`);
      if (options.verbose && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
```

### Entry Point

**File**: `packages/importer/src/index.ts`

```typescript
#!/usr/bin/env node

import './cli.js';
```

### Package.json Configuration

```json
{
  "name": "@nodm/financier-importer",
  "bin": {
    "financier": "./dist/index.js"
  },
  "type": "module"
}
```

---

## Testing

### Unit Tests

Test individual components:

```typescript
describe('Bank1Parser', () => {
  it('should detect Bank1 CSV format', () => {
    const headers = ['Operacijos data', 'Suma', 'Gavėjas / Mokėtojas'];
    const parser = new Bank1Parser();
    expect(parser.canParse(headers)).toBe(true);
  });

  it('should map CSV row to transaction', () => {
    const row = {
      'Operacijos data': '2025-11-22',
      Suma: '-50.00',
      'Gavėjas / Mokėtojas': 'Amazon',
    };
    const transaction = parser.mapRow(row, 'LT000000000000000004');
    expect(transaction.amount).toBe(-50);
    expect(transaction.merchant).toBe('Amazon');
  });
});

describe('Duplicate Detection', () => {
  it('should detect duplicate transactions', async () => {
    const db = getTestDatabaseClient();
    await db
      .insert(transactionsTable)
      .values(testTransaction);

    const isDup = await isDuplicate(db, testTransaction);
    expect(isDup).toBe(true);
  });
});
```

### Integration Tests

Test full import workflow:

```typescript
describe('Import Workflow', () => {
  let db: BetterSQLite3Database;

  beforeEach(async () => {
    db = getTestDatabaseClient();
    await db.delete(transactionsTable);
    await db.delete(accounts);
  });

  it('should import CSV file successfully', async () => {
    const result = await importCSV('./tests/fixtures/bank1.csv', {
      dryRun: false,
    });

    expect(result.imported).toBe(10);
    expect(result.skipped).toBe(0);

    const results = await db.select().from(transactionsTable);
    expect(results).toHaveLength(10);
  });

  it('should skip duplicates on re-import', async () => {
    await importCSV('./tests/fixtures/bank1.csv', { dryRun: false });
    const result = await importCSV('./tests/fixtures/bank1.csv', {
      dryRun: false,
    });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(10);
  });
});
```

### Test Fixtures

Create sample CSV files for testing:

**File**: `packages/importer/tests/fixtures/bank1.csv`

```csv
Operacijos data,Suma,Gavėjas / Mokėtojas,Papildoma informacija,Operacijos ID,Valiuta
2025-11-22,-50.00,Amazon,Order #123,TXN001,EUR
2025-11-21,-15.00,Starbucks,Coffee,TXN002,EUR
```

---

## Future Enhancements

### Version 1.1

- Support for additional banks
- CSV format auto-detection improvements
- Progress bar for large files
- Transaction categorization during import

### Version 1.2

- Scheduled imports (watch folder)
- Email integration (import from attachments)
- Multi-currency conversion
- Transaction splitting (shared expenses)

### Version 2.0

- Web UI for import management
- Bank API integration (direct import)
- OCR for paper statements
- Machine learning for categorization
