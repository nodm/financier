# MCP Server Specification

## Overview

The Financier MCP Server provides Large Language Models with structured access to financial transaction data. It implements the Model Context Protocol (MCP) to expose tools that LLMs can use to query and analyze financial information.

**Package**: `@nodm/financier-mcp-server`  
**Published**: Yes (public npm)  
**Installation**: `npm install -g @nodm/financier-mcp-server`

## Purpose

Enable natural language interactions with financial data:
- "What did I spend on groceries last month?"
- "Show my largest transactions this year"
- "What's my current checking account balance?"
- "Compare my spending in October vs November"

## MCP Server Fundamentals

### What is MCP?

Model Context Protocol is a standard for connecting LLMs to external data sources and tools. The MCP server:
1. Registers tools (functions LLMs can call)
2. Validates tool call parameters
3. Executes database queries
4. Returns structured results to the LLM

### Server Lifecycle

```
1. Start server process (long-running daemon)
2. Initialize Drizzle database client
3. Register MCP tools
4. Listen for tool call requests
5. Process requests, query database
6. Return results to LLM client
```

## Tool Specifications

### Tool 1: query_transactions

**Purpose**: Filter and retrieve transactions based on various criteria

**Input Schema**:
```typescript
interface QueryTransactionsInput {
  dateFrom?: string;        // ISO 8601 date (YYYY-MM-DD)
  dateTo?: string;          // ISO 8601 date (YYYY-MM-DD)
  accountId?: string;       // Filter by specific account
  category?: string;        // Filter by category
  type?: 'debit' | 'credit' | 'transfer';
  minAmount?: number;       // Minimum transaction amount
  maxAmount?: number;       // Maximum transaction amount
  merchant?: string;        // Filter by merchant (partial match)
  search?: string;          // Full-text search in description
  limit?: number;           // Max results (default: 100, max: 1000)
  offset?: number;          // Pagination offset (default: 0)
  sortBy?: 'date' | 'amount' | 'merchant';
  sortOrder?: 'asc' | 'desc'; // Default: desc
}
```

**Output Schema**:
```typescript
interface QueryTransactionsOutput {
  success: boolean;
  data?: {
    transactions: Transaction[];
    total: number;          // Total matching records
    hasMore: boolean;       // More results available
  };
  error?: string;
}

interface Transaction {
  id: string;
  accountId: string;
  date: string;             // ISO 8601
  amount: number;
  currency: string;
  merchant?: string;
  description: string;
  category?: string;
  type: string;
  balance?: number;
}
```

**Usage Examples**:
```json
// Get last month's grocery spending
{
  "dateFrom": "2025-10-01",
  "dateTo": "2025-10-31",
  "category": "groceries"
}

// Find large transactions
{
  "minAmount": 500,
  "sortBy": "amount",
  "sortOrder": "desc"
}

// Search for specific merchant
{
  "merchant": "Amazon",
  "limit": 50
}
```

**Validation Rules**:
- `dateFrom` must be before `dateTo`
- `limit` must be between 1 and 1000
- `offset` must be >= 0
- If `minAmount` and `maxAmount` provided, `minAmount` <= `maxAmount`

**Implementation Notes**:
- Use Drizzle `.select().from()` with dynamic `.where()` conditions
- Apply filters incrementally using `and()` helper
- Return empty array if no matches, not error
- Include pagination metadata for large result sets

---

### Tool 2: get_accounts

**Purpose**: List all accounts with summary information

**Input Schema**:
```typescript
interface GetAccountsInput {
  includeBalance?: boolean;    // Calculate current balance (default: true)
  includeSummary?: boolean;    // Include transaction counts (default: true)
}
```

**Output Schema**:
```typescript
interface GetAccountsOutput {
  success: boolean;
  data?: {
    accounts: Account[];
  };
  error?: string;
}

interface Account {
  id: string;
  name?: string;
  type: string;
  currency: string;
  bankCode: string;
  currentBalance?: number;     // From latest transaction
  transactionCount?: number;   // Total transactions
  lastTransactionDate?: string; // ISO 8601
}
```

**Usage Example**:
```json
{
  "includeBalance": true,
  "includeSummary": true
}
```

**Implementation Notes**:
- Query all accounts from database
- If `includeBalance`, get latest transaction per account
- If `includeSummary`, count transactions per account
- Use Drizzle aggregation functions (count, sum) for efficiency

---

### Tool 3: search_transactions

**Purpose**: Full-text search across transaction descriptions and merchants

**Input Schema**:
```typescript
interface SearchTransactionsInput {
  query: string;              // Search query (required)
  accountId?: string;         // Limit to specific account
  limit?: number;             // Max results (default: 50, max: 500)
}
```

**Output Schema**:
```typescript
interface SearchTransactionsOutput {
  success: boolean;
  data?: {
    transactions: Transaction[];
    total: number;
  };
  error?: string;
}
```

**Usage Examples**:
```json
// Find all Netflix transactions
{
  "query": "Netflix"
}

// Search in specific account
{
  "query": "grocery",
  "accountId": "LT000000000000000004"
}
```

**Implementation Notes**:
- Search in `description` and `merchant` fields
- Use `like()` with `%pattern%` for case-insensitive matching
- Order by date descending (most recent first)
- Consider SQLite FTS (Full-Text Search) extension for better performance (future)

---

### Tool 4: get_statistics

**Purpose**: Aggregate and analyze transaction data

**Input Schema**:
```typescript
interface GetStatisticsInput {
  dateFrom: string;           // ISO 8601 (required)
  dateTo: string;             // ISO 8601 (required)
  accountId?: string;         // Specific account or all accounts
  groupBy?: 'category' | 'merchant' | 'month' | 'type';
}
```

**Output Schema**:
```typescript
interface GetStatisticsOutput {
  success: boolean;
  data?: {
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netChange: number;
      transactionCount: number;
    };
    groupedData?: GroupedData[];
  };
  error?: string;
}

interface GroupedData {
  key: string;                // Category, merchant, or month
  totalAmount: number;
  transactionCount: number;
  percentage: number;         // Of total expenses/income
}
```

**Usage Examples**:
```json
// Monthly spending breakdown
{
  "dateFrom": "2025-01-01",
  "dateTo": "2025-12-31",
  "groupBy": "month"
}

// Spending by category this month
{
  "dateFrom": "2025-11-01",
  "dateTo": "2025-11-30",
  "groupBy": "category"
}
```

**Implementation Notes**:
- Use Drizzle `.groupBy()` with aggregation functions
- Separate income (credit) and expenses (debit)
- Calculate percentages client-side
- Format month as "YYYY-MM" for groupBy: month

---

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;              // Human-readable error message
  code?: string;              // Error code for programmatic handling
}
```

### Error Types

**ValidationError** (400):
```json
{
  "success": false,
  "error": "Invalid date range: dateFrom must be before dateTo",
  "code": "VALIDATION_ERROR"
}
```

**DatabaseError** (500):
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "DATABASE_ERROR"
}
```

**NotFoundError** (404):
```json
{
  "success": false,
  "error": "Account not found: LT000000000000000004",
  "code": "NOT_FOUND"
}
```

### Error Handling Strategy

1. **Validation errors**: Caught early, return descriptive messages
2. **Database errors**: Log full error, return generic message to LLM
3. **Unexpected errors**: Log stack trace, return generic error
4. **Empty results**: Not an error, return empty array with success: true

---

## Server Configuration

### Entry Point

**File**: `packages/mcp-server/src/index.ts`

```typescript
#!/usr/bin/env node

import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
```

### Server Setup

**File**: `packages/mcp-server/src/server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getDatabaseClient } from '@nodm/financier-db';

export async function startServer() {
  const db = getDatabaseClient();
  
  const server = new Server({
    name: 'financier-mcp-server',
    version: '0.1.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'query_transactions',
        description: 'Query transactions with filters',
        inputSchema: { /* Zod schema as JSON Schema */ },
      },
      // ... other tools
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Route to appropriate handler based on request.params.name
    // Return tool results
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('MCP Server running on stdio');
}
```

### Database Connection

```typescript
import { getDatabaseClient } from '@nodm/financier-db';

// Get singleton client instance
const db = getDatabaseClient();

// Client stays connected for server lifetime
// better-sqlite3 maintains single connection
```

---

## Integration with LLM Clients

### Claude Desktop Configuration

**File**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "financier": {
      "command": "financier-mcp-server",
      "args": []
    }
  }
}
```

### Usage in Claude

User prompt:
```
What did I spend on groceries last month?
```

Claude's tool usage:
```json
{
  "tool": "query_transactions",
  "parameters": {
    "dateFrom": "2025-10-01",
    "dateTo": "2025-10-31",
    "category": "groceries"
  }
}
```

MCP server returns:
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 15
  }
}
```

Claude's response:
```
You spent €342.67 on groceries last month across 15 transactions. 
The largest was €78.50 at Whole Foods on October 15th.
```

---

## Service Layer

### Transaction Service

**File**: `packages/mcp-server/src/services/transaction-service.ts`

```typescript
import { getDatabaseClient, transactions } from '@nodm/financier-db';
import type { QueryTransactionsInput } from '@nodm/financier-types';
import { and, count, desc, asc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export class TransactionService {
  constructor(private db: BetterSQLite3Database) {}

  async queryTransactions(input: QueryTransactionsInput) {
    const conditions = this.buildWhereConditions(input);

    const [results, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .limit(input.limit || 100)
        .offset(input.offset || 0)
        .orderBy(this.buildOrderBy(input)),
      this.db
        .select({ total: count() })
        .from(transactions)
        .where(and(...conditions)),
    ]);

    return {
      transactions: results,
      total,
      hasMore: total > (input.offset || 0) + results.length,
    };
  }

  private buildWhereConditions(input: QueryTransactionsInput) {
    // Build Drizzle where conditions array from input filters
  }

  private buildOrderBy(input: QueryTransactionsInput) {
    // Return desc()/asc() based on sortBy/sortOrder
  }
}
```

### Account Service

**File**: `packages/mcp-server/src/services/account-service.ts`

```typescript
export class AccountService {
  constructor(private db: BetterSQLite3Database) {}

  async getAccounts(input: GetAccountsInput) {
    const accounts = await this.db.account.findMany();
    
    return Promise.all(
      accounts.map(async (account) => ({
        ...account,
        currentBalance: input.includeBalance 
          ? await this.getCurrentBalance(account.id)
          : undefined,
        transactionCount: input.includeSummary
          ? await this.getTransactionCount(account.id)
          : undefined,
      }))
    );
  }

  private async getCurrentBalance(accountId: string) {
    const latest = await this.db.transaction.findFirst({
      where: { accountId },
      orderBy: { date: 'desc' },
      select: { balance: true },
    });
    return latest?.balance;
  }
}
```

---

## Testing

### Unit Tests

Test individual tool handlers:

```typescript
describe('query_transactions', () => {
  it('should filter by date range', async () => {
    const result = await queryTransactions({
      dateFrom: '2025-11-01',
      dateTo: '2025-11-30',
    });
    
    expect(result.success).toBe(true);
    expect(result.data.transactions).toHaveLength(10);
  });

  it('should validate date range', async () => {
    const result = await queryTransactions({
      dateFrom: '2025-11-30',
      dateTo: '2025-11-01',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('dateFrom must be before dateTo');
  });
});
```

### Integration Tests

Test full MCP server workflow:

```typescript
describe('MCP Server', () => {
  let server: Server;
  let db: BetterSQLite3Database;

  beforeAll(async () => {
    db = getTestDatabaseClient();
    server = await startServer();
  });

  it('should handle tool call request', async () => {
    const request = {
      method: 'tools/call',
      params: {
        name: 'query_transactions',
        arguments: { limit: 10 },
      },
    };

    const response = await server.handleRequest(request);
    expect(response.content[0].type).toBe('text');
  });
});
```

---

## Logging

### Log Levels

- **ERROR**: Database failures, unexpected errors
- **WARN**: Validation failures, empty results
- **INFO**: Tool calls, query execution
- **DEBUG**: Detailed query parameters, results

### Log Format (Current)

```typescript
console.error('[ERROR] Database connection failed:', error);
console.warn('[WARN] No transactions found for query');
console.log('[INFO] Tool call: query_transactions');
console.debug('[DEBUG] Query params:', params);
```

### Future: Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({ tool: 'query_transactions', params }, 'Tool called');
logger.error({ error: err.message }, 'Database error');
```

---

## Performance Optimization

### Query Optimization

1. **Use indexes**: Database queries leverage existing indexes
2. **Pagination**: Always limit results, use offset for pagination
3. **Selective fields**: Only select needed fields (use Drizzle `.select({ field1, field2 })`)
4. **Aggregations**: Use database-level groupBy instead of application-level

### Caching Strategy (Future)

```typescript
// Cache expensive queries (statistics)
const cache = new Map();

async function getStatistics(params) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  
  const data = await fetchStatistics(params);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

---

## Security Considerations

### Current (Local-Only)

- No authentication required
- No network exposure (stdio transport)
- Access control via OS file permissions
- Read-only operations only

### Future (Cloud Deployment)

- JWT authentication
- Rate limiting per user
- API key for MCP server access
- Audit logging of all queries
- Row-level security in database

---

## Deployment

### Local Installation

```bash
npm install -g @nodm/financier-mcp-server
```

### Configuration

User configures in Claude Desktop settings (or other MCP client):
```json
{
  "mcpServers": {
    "financier": {
      "command": "financier-mcp-server"
    }
  }
}
```

### Verify Installation

```bash
financier-mcp-server --version
```

---

## Future Enhancements

### Version 1.1
- Write operations (update category, add notes)
- Transaction tagging
- Custom date range presets (this month, last quarter, etc.)

### Version 1.2
- Budget tracking tools
- Recurring transaction detection
- Export tools (CSV, PDF)

### Version 2.0
- Cloud deployment
- Multi-user support
- Real-time updates (webhooks)
- Advanced analytics (trends, predictions)
