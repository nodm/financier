# Financier MCP Server

The Financier MCP Server provides Large Language Models with structured access to financial transaction data through the Model Context Protocol (MCP). It enables natural language interactions with your financial data.

## Overview

This MCP server exposes tools that LLMs can use to:
- Query transactions with advanced filtering
- Search transaction descriptions and merchants
- Retrieve account information with balances
- Calculate statistics and aggregations

**Package**: `@nodm/financier-mcp-server`  
**Version**: 0.1.0

## Installation

### Global Installation

```bash
npm install -g @nodm/financier-mcp-server
```

### Local Installation (Development)

```bash
# From workspace root
npm install
nx build mcp-server
```

## Configuration

### Database Setup

The MCP server requires access to a Financier database. By default, it uses the database at `~/.financier/data.db`.

To use a custom database location, set the `FINANCIER_DATABASE_PATH` environment variable:

```bash
export FINANCIER_DATABASE_PATH=/path/to/your/database.db
financier-mcp-server
```

### Claude Desktop Configuration

Add the MCP server to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

After updating the configuration, restart Claude Desktop.

## Usage

### Starting the Server

The server runs as a long-running process, communicating via stdio:

```bash
financier-mcp-server
```

The server will:
1. Initialize the database connection
2. Register all available tools
3. Listen for MCP requests on stdin
4. Send responses on stdout

### Available Tools

#### 1. `query_transactions`

Filter and retrieve transactions based on various criteria.

**Example Queries**:

```json
// Get last month's transactions
{
  "dateFrom": "2025-10-01",
  "dateTo": "2025-10-31"
}

// Find large expenses
{
  "minAmount": 500,
  "type": "debit",
  "sortBy": "amount",
  "sortOrder": "desc",
  "limit": 10
}

// Get grocery spending
{
  "category": "groceries",
  "dateFrom": "2025-11-01",
  "dateTo": "2025-11-30"
}

// Search by merchant
{
  "merchant": "Amazon",
  "limit": 50
}

// Full-text search
{
  "search": "restaurant",
  "dateFrom": "2025-11-01"
}
```

**Input Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `dateFrom` | string | ISO 8601 date (YYYY-MM-DD) - start of date range |
| `dateTo` | string | ISO 8601 date (YYYY-MM-DD) - end of date range |
| `accountId` | string | Filter by specific account ID (IBAN) |
| `category` | string | Filter by category |
| `type` | "debit" \| "credit" | Filter by transaction type |
| `minAmount` | number | Minimum transaction amount |
| `maxAmount` | number | Maximum transaction amount |
| `merchant` | string | Filter by merchant (partial match) |
| `search` | string | Full-text search in description and merchant |
| `limit` | number | Max results (default: 100, max: 1000) |
| `offset` | number | Pagination offset (default: 0) |
| `sortBy` | "date" \| "amount" \| "merchant" | Sort field (default: "date") |
| `sortOrder` | "asc" \| "desc" | Sort order (default: "desc") |

**Response**:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "accountId": "LT000000000000000004",
        "date": "2025-11-15T00:00:00.000Z",
        "amount": -45.99,
        "currency": "EUR",
        "merchant": "Grocery Store",
        "description": "Purchase at Grocery Store",
        "category": "groceries",
        "type": "DEBIT",
        "balance": 1234.56
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

#### 2. `get_accounts`

List all accounts with optional balance and summary information.

**Example**:

```json
{
  "includeBalance": true,
  "includeSummary": true
}
```

**Input Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `includeBalance` | boolean | Calculate current balance from latest transaction (default: true) |
| `includeSummary` | boolean | Include transaction counts and last transaction date (default: true) |

**Response**:

```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "LT000000000000000004",
        "name": "Checking Account",
        "currency": "EUR",
        "bankCode": "SEB",
        "currentBalance": 1234.56,
        "transactionCount": 150,
        "lastTransactionDate": "2025-11-15T00:00:00.000Z"
      }
    ]
  }
}
```

#### 3. `search_transactions`

Full-text search across transaction descriptions and merchants.

**Example Queries**:

```json
// Find all Netflix transactions
{
  "query": "Netflix"
}

// Search in specific account
{
  "query": "grocery",
  "accountId": "LT000000000000000004",
  "limit": 20
}
```

**Input Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query (required, min length: 1) |
| `accountId` | string | Limit search to specific account |
| `limit` | number | Max results (default: 50, max: 500) |

**Response**:

```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 25
  }
}
```

#### 4. `get_statistics`

Aggregate and analyze transaction data with optional grouping.

**Example Queries**:

```json
// Monthly spending breakdown for the year
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

// Top merchants this year
{
  "dateFrom": "2025-01-01",
  "dateTo": "2025-12-31",
  "groupBy": "merchant"
}

// Statistics for specific account
{
  "dateFrom": "2025-11-01",
  "dateTo": "2025-11-30",
  "accountId": "LT000000000000000004",
  "groupBy": "type"
}
```

**Input Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `dateFrom` | string | ISO 8601 date (required) - start of date range |
| `dateTo` | string | ISO 8601 date (required) - end of date range |
| `accountId` | string | Filter by specific account (optional) |
| `groupBy` | "category" \| "merchant" \| "month" \| "type" | Grouping option (optional) |

**Response**:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 5000.00,
      "totalExpenses": 3200.50,
      "netChange": 1799.50,
      "transactionCount": 150
    },
    "groupedData": [
      {
        "key": "groceries",
        "totalAmount": 450.00,
        "transactionCount": 12,
        "percentage": 14.06
      },
      {
        "key": "restaurants",
        "totalAmount": 320.00,
        "transactionCount": 8,
        "percentage": 10.00
      }
    ]
  }
}
```

## Error Handling

The server returns structured error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Error Codes**:

- `VALIDATION_ERROR` - Input validation failed (e.g., invalid date format, dateFrom > dateTo)
- `DATABASE_ERROR` - Database operation failed
- `NOT_FOUND` - Requested resource not found
- `INTERNAL_ERROR` - Unexpected server error
- `UNKNOWN_TOOL` - Tool name not recognized

**Example Error Response**:

```json
{
  "success": false,
  "error": "dateFrom must be before or equal to dateTo",
  "code": "VALIDATION_ERROR"
}
```

## Validation Rules

### Date Range Validation

- `dateFrom` must be before or equal to `dateTo`
- Dates must be in ISO 8601 format (YYYY-MM-DD)
- Both `dateFrom` and `dateTo` are required for `get_statistics`

### Amount Range Validation

- If both `minAmount` and `maxAmount` are provided, `minAmount` must be <= `maxAmount`

### Limit Validation

- `limit` for `query_transactions`: 1-1000 (default: 100)
- `limit` for `search_transactions`: 1-500 (default: 50)
- `offset` must be >= 0 (default: 0)

## Development

### Building

```bash
# Build the package
nx build mcp-server

# Build with dependencies
nx build mcp-server --with-deps
```

### Running Locally

```bash
# From workspace root
nx build mcp-server
node packages/mcp-server/dist/index.js
```

### Testing

```bash
# Run tests
nx test mcp-server

# Run tests in watch mode
nx test mcp-server --watch

# Run tests with coverage
nx test mcp-server --coverage
```

### Project Structure

```
packages/mcp-server/
├── src/
│   ├── index.ts                 # CLI entry point
│   └── lib/
│       ├── server.ts            # MCP server setup
│       ├── errors.ts            # Error formatting utilities
│       ├── handlers/            # Tool handlers
│       │   ├── query-transactions-handler.ts
│       │   ├── get-accounts-handler.ts
│       │   ├── search-transactions-handler.ts
│       │   └── get-statistics-handler.ts
│       ├── services/            # Business logic
│       │   ├── transaction-service.ts
│       │   ├── account-service.ts
│       │   ├── statistics-service.ts
│       │   └── query-builders.ts
│       ├── types/               # TypeScript types and schemas
│       │   ├── mcp.ts
│       │   └── mcp-schemas.ts
│       └── utils/
│           └── date-utils.ts
└── package.json
```

## Troubleshooting

### Server Won't Start

**Issue**: "Failed to start MCP server"

**Solutions**:
1. Check database exists: `ls ~/.financier/data.db`
2. Verify database permissions
3. Check environment variables: `echo $FINANCIER_DATABASE_PATH`

### Database Connection Errors

**Issue**: "Database operation failed"

**Solutions**:
1. Ensure database file is not locked by another process
2. Verify database schema is up to date
3. Check database file permissions

### Tool Call Errors

**Issue**: "Unknown tool" or validation errors

**Solutions**:
1. Verify tool name spelling (case-sensitive)
2. Check input parameter types match schema
3. Review validation rules above

### Claude Desktop Not Connecting

**Issue**: MCP server not appearing in Claude Desktop

**Solutions**:
1. Verify `financier-mcp-server` is in PATH: `which financier-mcp-server`
2. Check Claude Desktop configuration file syntax (valid JSON)
3. Restart Claude Desktop after configuration changes
4. Check Claude Desktop logs for errors

## License

See root LICENSE file.

## Related Documentation

- [MCP Server Specification](../../docs/03-mcp-server-specification.md) - Detailed tool specifications
- [Architecture Overview](../../docs/01-architecture.md) - System architecture
- [Database Schema](../../docs/02-database-schema.md) - Database structure
