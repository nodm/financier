# The Financier - Project Overview

## Purpose

The Financier is a personal finance management system designed to provide AI-powered access to bank transaction data. Named after Theodore Dreiser's novel, this project enables users to import bank statements and query their financial data through Large Language Models (LLMs) via the Model Context Protocol (MCP).

## Project Goals

### Primary Objectives

1. **Secure Local Data Storage**: Keep sensitive financial data on the user's machine using SQLite
2. **AI Integration**: Provide LLMs with structured access to financial data through MCP
3. **Multi-Bank Support**: Import and normalize transactions from multiple bank CSV formats
4. **Extensibility**: Design for future cloud migration and additional features

### Non-Goals (Initial Release)

- Cloud synchronization
- Mobile applications
- Real-time bank API integration
- Automated categorization (future consideration)
- Multi-user support

## Architecture Overview

### Monorepo Structure

```
financier/
├── packages/
│   ├── types/           # @nodm/financier-types
│   ├── config/          # @nodm/financier-config
│   ├── db/              # @nodm/financier-db
│   ├── importer/        # @nodm/financier-importer
│   └── mcp-server/      # @nodm/financier-mcp-server
├── docs/
├── samples/             # Anonymized CSV examples
└── nx.json
```

### Package Responsibilities

#### @nodm/financier-types

- TypeScript type definitions
- Zod validation schemas
- Shared constants and enums
- **Published**: Yes (public npm)
- **Dependencies**: zod

#### @nodm/financier-db

- Drizzle schema and client
- Database migrations via Drizzle Kit
- Database utility functions
- **Published**: Yes (public npm)
- **Dependencies**: drizzle-orm, better-sqlite3, @nodm/financier-types

#### @nodm/financier-importer

- CLI tool for importing bank CSVs
- Bank format detection and parsing
- Transaction validation and insertion
- **Published**: Yes (public npm, globally installable)
- **Dependencies**: @nodm/financier-db, @nodm/financier-types, papaparse, commander

#### @nodm/financier-mcp-server

- MCP server implementation
- Transaction query tools
- Statistics and analytics tools
- **Published**: Yes (public npm, globally installable)
- **Dependencies**: @nodm/financier-db, @nodm/financier-types, @modelcontextprotocol/sdk

## Technology Stack

### Core Technologies

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript (ES2023)
- **Monorepo**: nx
- **Database**: SQLite (local file at `~/.financier/data.db`)
- **ORM**: Drizzle ORM
- **Validation**: Zod

### Libraries

- **CSV Parsing**: papaparse
- **CLI Framework**: commander (for importer)
- **MCP SDK**: @modelcontextprotocol/sdk
- **Testing**: Jest
- **Logging**: console-based (initial), structured logging (future)

### Development Tools

- **Package Manager**: npm
- **Version Control**: git
- **Code Style**: Prettier (per user preferences)
- **TypeScript Config**: Strict mode, ES2023 target

## User Workflow

### Initial Setup

1. Install MCP server: `npm install -g @nodm/financier-mcp-server`
2. Install importer: `npm install -g @nodm/financier-importer`
3. Configure MCP server in Claude Desktop or other MCP client

### Daily Usage

1. Download bank statement as CSV
2. Run: `financier import statement.csv`
   - Automatically detects bank from headers
   - Extracts account information
   - Validates and imports transactions
3. Query data through Claude using natural language
   - "What did I spend on groceries last month?"
   - "Show my account balances"
   - "Compare my spending this month vs last month"

## Data Flow

```
CSV File
  ↓
Importer (auto-detects bank, parses, validates)
  ↓
SQLite Database (~/.financier/data.db)
  ↓
MCP Server (exposes query tools)
  ↓
LLM (Claude, etc.)
  ↓
User (natural language queries and responses)
```

## Supported Banks (Initial Release)

Four banks will be supported initially:

1. Bank 1 (TBD - awaiting CSV samples)
2. Bank 2 (TBD - awaiting CSV samples)
3. Bank 3 (TBD - awaiting CSV samples)
4. Bank 4 (TBD - awaiting CSV samples)

Bank detection is automatic based on CSV header patterns.

## Security Considerations

### Data Protection

- All data stored locally in user's home directory
- No network transmission of financial data
- SQLite database not encrypted (relies on OS-level protection)
- Future: Consider database encryption at rest

### Access Control

- MCP server only exposes read operations (v1)
- No authentication required (local-only access)
- Future: Add authentication for cloud deployment

## Future Roadmap

### Version 1.x

- Additional bank formats
- Manual categorization via MCP
- Transaction notes and tags
- Budget tracking tools

### Version 2.x

- Cloud deployment option (PostgreSQL)
- Multi-user support
- Automated categorization (ML-based)
- Web UI for configuration

### Version 3.x

- Real-time bank API integration
- Mobile applications
- Shared household finances
- Investment tracking

## Project Metadata

- **Author**: Dima
- **License**: TBD
- **Repository**: TBD
- **NPM Scope**: @nodm
- **Project Name**: The Financier
- **Initial Version**: 0.1.0
