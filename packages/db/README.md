# @nodm/financier-db

Database package for Financier application using Drizzle ORM with SQLite.

## Overview

Provides database schema, client, and utilities for managing financial accounts and transactions.

**Database**: SQLite (local file: `~/.financier/data.db`)  
**ORM**: Drizzle ORM  
**Schema**: Accounts and Transactions tables

## Schema

- **accounts**: Financial accounts (bank accounts, credit cards)
- **transactions**: Individual financial transactions

See [../../docs/02-database-schema.md](../../docs/02-database-schema.md) for detailed schema documentation.

## Key Features

- **Type-safe queries** with full TypeScript inference
- **Text-based storage** for dates (ISO 8601) and decimals
- **Foreign key constraints** for data integrity
- **Composite unique constraints** for duplicate prevention
- **Indexed queries** for performance

## Building

Run `nx build @nodm/financier-db` to build the library.

## Database Operations

### Generate Migration

After schema changes:

```bash
npm run db:generate
```

### Apply Migrations

```bash
DATABASE_URL="file:/Users/$USER/.financier/data.db" npm run db:migrate
```

### Push Schema (Development)

Skip migrations and push schema directly:

```bash
DATABASE_URL="file:/Users/$USER/.financier/data.db" npm run db:push
```

### Database Studio

Explore database with Drizzle Studio:

```bash
npm run db:studio
```

## Usage

```typescript
import { getDatabaseClient, accounts, transactions } from '@nodm/financier-db';
import { eq } from 'drizzle-orm';

const db = getDatabaseClient();

// Query accounts
const allAccounts = await db.select().from(accounts);

// Query transactions for an account
const accountTransactions = await db
  .select()
  .from(transactions)
  .where(eq(transactions.accountId, 'LT000000000000000004'));
```

## Testing

Run `nx test @nodm/financier-db` to execute the unit tests.
