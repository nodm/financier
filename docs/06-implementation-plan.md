# Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for The Financier project. It's designed for coding agents (like Claude Code) to follow systematically.

## Implementation Phases

### Phase 0: Project Initialization ✓ (Complete when setup done)

**Goal**: Set up monorepo structure and configuration

**Tasks**:

1. Create repository and initialize git
2. Set up nx monorepo
3. Create package directories
4. Configure TypeScript, ESLint, Prettier
5. Install base dependencies
6. Create initial package.json files
7. Verify build system works

**Verification**:

```bash
nx run-many --target=build --all
# Should succeed (even with empty packages)
```

---

### Phase 1: Types Package (Foundation)

**Goal**: Define all TypeScript types and Zod validation schemas

**Priority**: HIGH (everything depends on this)

**Tasks**:

1. **Create type definitions**

   - `src/types/bank.ts` - BankCode enum
   - `src/types/currency.ts` - Currency enum
   - `src/types/transaction.ts` - Transaction types
   - `src/types/account.ts` - Account types

2. **Create Zod schemas**

   - `src/schemas/transaction.ts` - Transaction validation schemas
   - `src/schemas/account.ts` - Account validation schemas
   - `src/schemas/import-result.ts` - Import result schema

3. **Create error classes**

   - `src/errors/index.ts` - Base error and derived errors

4. **Create index.ts**

   - Export all public APIs

5. **Write tests**
   - Test Zod schema validation
   - Test type inference

**Files to create**:

```
packages/types/src/
├── index.ts
├── types/
│   ├── bank.ts
│   ├── currency.ts
│   ├── transaction.ts
│   └── account.ts
├── schemas/
│   ├── transaction.ts
│   ├── account.ts
│   └── import-result.ts
└── errors/
    └── index.ts
```

**Verification**:

```bash
nx build types
nx test types
```

**Depends on**: Phase 0

---

### Phase 1.5: Configuration Package

**Goal**: Create centralized configuration management

**Priority**: HIGH

**Tasks**:

1. **Create package structure**
   - `packages/config/`

2. **Implement configuration loader**
   - `src/index.ts`
   - Use `zod` for validation
   - Load from `~/.financier/config.json`
   - Provide default values

3. **Write tests**
   - Test default values
   - Test file loading
   - Test validation

**Files to create**:

```
packages/config/src/
├── index.ts
├── schema.ts
└── defaults.ts
```

**Verification**:

```bash
nx build config
nx test config
```

**Depends on**: Phase 1 (types)

---

### Phase 2: Database Package

**Goal**: Set up Prisma, define schema, create database utilities

**Priority**: HIGH

**Tasks**:

1. **Create Prisma schema**

   - Define `Account` model (UUID id, hash, mask)
   - Define `Transaction` model (UUID id, accountId FK)
   - Add indexes and constraints
   - Configure SQLite datasource

2. **Generate Prisma client**

   ```bash
   cd packages/db
   npx prisma generate
   ```

3. **Create database utilities**

   - `src/client.ts` - getDatabaseClient() function
   - `src/utils.ts` - ensureDatabaseExists(), runMigrations()

4. **Create initial migration**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Write tests**
   - Test database connection
   - Test CRUD operations
   - Test migrations

**Files to create**:

```
packages/db/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts
│   ├── client.ts
│   └── utils.ts
└── .env
```

**Verification**:

```bash
nx build db
nx test db
# Should create ~/.financier/data.db
```

**Depends on**: Phase 1 (types)

---

### Phase 3: Importer - Core Infrastructure ✓ (Complete)

**Goal**: Set up CLI, CSV parsing, and base parser structure

**Priority**: HIGH

**Tasks**:

1. **Set up CLI framework**

   - `src/cli.ts` - Commander.js setup
   - `src/index.ts` - Entry point with shebang

2. **Create CSV reader**

   - `src/services/csv-reader.ts` - Papaparse wrapper

3. **Create base parser**

   - `src/parsers/base-parser.ts` - Abstract parser class

4. **Create parser factory**

   - `src/parsers/parser-factory.ts` - Bank detection logic

5. **Create error classes**

   - `src/errors/import-error.ts`
   - `src/errors/unsupported-bank-error.ts`
   - `src/errors/csv-parse-error.ts`

6. **Write tests**
   - Test CLI argument parsing
   - Test CSV reading
   - Test base parser interface

**Files to create**:

```
packages/importer/src/
├── index.ts
├── cli.ts
├── parsers/
│   ├── base-parser.ts
│   └── parser-factory.ts
├── services/
│   └── csv-reader.ts
└── errors/
    ├── import-error.ts
    ├── unsupported-bank-error.ts
    └── csv-parse-error.ts
```

**Verification**:

```bash
nx build importer
nx run importer:start -- --help
# Should show help text
```

**Depends on**: Phase 1 (types), Phase 2 (db)

---

### Phase 4: Importer - Bank Parsers (Partially Complete - SEB ✓)

**Goal**: Implement parsers for all supported banks

**Priority**: HIGH

**Status**: SEB Lithuania parser implemented and tested. Awaiting CSV samples for remaining banks.

**Tasks** (per bank):

1. **Analyze CSV sample**

   - Document header structure
   - Identify unique patterns
   - Map fields to transaction structure

2. **Implement parser**

   - `src/parsers/bank1-parser.ts`
   - Override `canParse()` method
   - Implement `parse()` method
   - Implement `mapRow()` method
   - Implement `extractAccountId()` method

3. **Handle special cases**

   - Multi-account CSVs (account separator detection)
   - Missing fields (externalId, balance, merchant)
   - Date format parsing
   - Amount sign conventions

4. **Add to parser factory**

   - Register parser in PARSERS array

5. **Write tests**
   - Test header detection
   - Test field mapping
   - Test account extraction
   - Test error handling

**Files to create** (x4 banks):

```
packages/importer/src/parsers/
├── bank1-parser.ts
├── bank2-parser.ts
├── bank3-parser.ts
└── bank4-parser.ts

packages/importer/tests/fixtures/
├── bank1.csv
├── bank2.csv
├── bank3.csv
└── bank4.csv
```

**Verification** (per bank):

```bash
nx test importer -- --testPathPattern=bank1-parser
financier import tests/fixtures/bank1.csv --dry-run
```

**Depends on**: Phase 3, CSV samples from user

---

### Phase 5: Importer - Import Logic ✓ (Complete)

**Goal**: Implement transaction validation, duplicate detection, and database insertion

**Priority**: HIGH

**Tasks**:

1. **Create transaction importer service**

   - `src/services/transaction-importer.ts`
   - Main `importCSV()` function
   - Account creation logic
   - Validation pipeline

2. **Create duplicate detector**

   - `src/services/duplicate-detector.ts`
   - Check for existing transactions
   - Generate synthetic externalId when needed

3. **Implement batch insertion**

   - Use Prisma createMany
   - Handle large CSV files efficiently

4. **Add output formatting**

   - Success messages
   - Error messages
   - Dry-run output
   - Verbose output

5. **Integrate with CLI**

   - Connect CLI commands to services
   - Handle options (--dry-run, --verbose, etc.)

6. **Write tests**
   - Test import workflow
   - Test duplicate detection
   - Test account creation
   - Test batch insertion
   - Test error scenarios

**Files to create**:

```
packages/importer/src/services/
├── transaction-importer.ts
└── duplicate-detector.ts
```

**Verification**:

```bash
nx test importer
financier import sample.csv
# Check database: should have transactions
```

**Depends on**: Phase 4 (bank parsers)

---

### Phase 6: MCP Server - Core Infrastructure

**Goal**: Set up MCP server with tool registration

**Priority**: HIGH

**Tasks**:

1. **Create server setup**

   - `src/server.ts` - MCP server initialization
   - `src/index.ts` - Entry point

2. **Create service layer**

   - `src/services/transaction-service.ts` - Query logic
   - `src/services/account-service.ts` - Account logic

3. **Create error classes**

   - `src/errors/database-error.ts`
   - `src/errors/query-error.ts`

4. **Set up tool registration**

   - Register ListTools handler
   - Register CallTool handler
   - Define tool schemas

5. **Write tests**
   - Test server initialization
   - Test service methods
   - Test error handling

**Files to create**:

```
packages/mcp-server/src/
├── index.ts
├── server.ts
├── services/
│   ├── transaction-service.ts
│   └── account-service.ts
└── errors/
    ├── database-error.ts
    └── query-error.ts
```

**Verification**:

```bash
nx build mcp-server
nx run mcp-server:start
# Should start without errors
```

**Depends on**: Phase 2 (db)

---

### Phase 7: MCP Server - Tool Implementations

**Goal**: Implement all MCP tools

**Priority**: HIGH

**Tasks**:

1. **Implement query_transactions tool**

   - `src/tools/query-transactions.ts`
   - Input validation
   - Build dynamic Prisma query
   - Format response

2. **Implement get_accounts tool**

   - `src/tools/get-accounts.ts`
   - Fetch accounts
   - Calculate balances
   - Include transaction counts

3. **Implement search_transactions tool**

   - `src/tools/search-transactions.ts`
   - Full-text search implementation
   - Case-insensitive matching

4. **Implement get_statistics tool**

   - `src/tools/get-statistics.ts`
   - Aggregation queries
   - Group by logic
   - Calculate percentages

5. **Register all tools**

   - Update server.ts with tool handlers
   - Add input schema validation
   - Add error handling

6. **Write tests**
   - Test each tool individually
   - Test with various input combinations
   - Test error cases
   - Integration tests with database

**Files to create**:

```
packages/mcp-server/src/tools/
├── query-transactions.ts
├── get-accounts.ts
├── search-transactions.ts
└── get-statistics.ts
```

**Verification**:

```bash
nx test mcp-server
# Test with Claude Desktop integration
```

**Depends on**: Phase 6 (MCP core)

---

### Phase 8: Integration Testing

**Goal**: Test full system end-to-end

**Priority**: MEDIUM

**Tasks**:

1. **Create integration test suite**

   - Test import → query workflow
   - Test multiple CSV imports
   - Test duplicate handling across imports

2. **Create test data**

   - Generate comprehensive test CSVs
   - Cover edge cases

3. **Test MCP tools with real data**

   - Import test data
   - Verify MCP tools return correct results

4. **Performance testing**
   - Test with large CSV files (10k+ transactions)
   - Measure query performance
   - Identify bottlenecks

**Verification**:

```bash
# Run full integration test suite
npm run test:integration
```

**Depends on**: Phase 5 (importer complete), Phase 7 (MCP complete)

---

### Phase 9: Documentation and Examples

**Goal**: Create user-facing documentation

**Priority**: MEDIUM

**Tasks**:

1. **Create README files**

   - Root README.md (project overview)
   - packages/importer/README.md (usage guide)
   - packages/mcp-server/README.md (setup guide)

2. **Create usage examples**

   - Common CLI commands
   - MCP query examples
   - Troubleshooting guide

3. **Create API documentation**

   - Document all MCP tools
   - Document bank CSV formats

4. **Create CHANGELOG.md**
   - Version history
   - Breaking changes
   - Migration guides

**Files to create**:

```
README.md
CHANGELOG.md
packages/importer/README.md
packages/mcp-server/README.md
docs/TROUBLESHOOTING.md
docs/API.md
```

**Depends on**: Phase 8 (everything working)

---

### Phase 10: Publishing Preparation

**Goal**: Prepare packages for npm publication

**Priority**: MEDIUM

**Tasks**:

1. **Add LICENSE file**

   - Choose license (MIT recommended)

2. **Update package.json metadata**

   - Add keywords
   - Add author
   - Add repository URLs
   - Add homepage

3. **Create .npmignore files**

   - Exclude test files
   - Exclude source files (only ship dist/)

4. **Test local installation**

   ```bash
   npm pack
   npm install -g ./nodm-financier-importer-0.1.0.tgz
   ```

5. **Set up npm publishing**
   - Create npm account (if needed)
   - Get npm token
   - Configure CI/CD for automated publishing

**Verification**:

```bash
npm publish --dry-run
```

**Depends on**: Phase 9 (documentation)

---

## Implementation Order

### Critical Path (Must be done in order)

1. Phase 0: Project Setup
2. Phase 1: Types Package
3. Phase 1.5: Configuration Package
4. Phase 2: Database Package
4. Phase 3: Importer Infrastructure
5. Phase 4: Bank Parsers (BLOCKED - awaiting CSV samples)
6. Phase 5: Importer Logic
7. Phase 6: MCP Core
8. Phase 7: MCP Tools

### Parallel Work (Can be done simultaneously)

- Phase 6 & 7 (MCP) can start after Phase 2 (Database)
- Phase 9 (Documentation) can start after Phase 5 & 7 complete
- Phase 8 (Integration tests) can start after Phase 5 & 7 complete

### Blocked Items

- **Phase 4 (Bank Parsers)**: Requires CSV samples from user
  - Can continue with other phases
  - Create placeholder parsers for now
  - Implement real parsers when samples arrive

---

## Development Guidelines

### Code Style

1. **Use function declarations** over arrow functions for top-level functions

   ```typescript
   // Good
   function parseTransaction(data: unknown) {}

   // Avoid
   const parseTransaction = (data: unknown) => {};
   ```

2. **Leverage type inference**

   ```typescript
   // Good
   function getAccount(id: string) {
     return db.account.findUnique({ where: { id } });
   }

   // Avoid unnecessary return types
   function getAccount(id: string): Promise<Account | null> {}
   ```

3. **Use descriptive type names**

   ```typescript
   // Good
   type TransactionType = 'debit' | 'credit';

   // Avoid
   type T = 'debit' | 'credit';
   ```

4. **Prefer native APIs**

   ```typescript
   // Good
   await fetch(url);

   // Avoid
   await axios.get(url);
   ```

### Testing Guidelines

1. **Test file naming**: `*.test.ts`
2. **Test structure**: Arrange-Act-Assert
3. **Use descriptive test names**

   ```typescript
   describe('Bank1Parser', () => {
     it('should detect Bank1 format from headers', () => {
       // test
     });
   });
   ```

4. **Mock external dependencies**
5. **Clean up in afterEach/afterAll**

### Commit Guidelines

Follow Conventional Commits:

```
feat(importer): add Bank1 parser
fix(db): correct duplicate detection
docs: update architecture
test(mcp): add query tool tests
```

---

## Verification Checklist

After each phase, verify:

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] Linting passes
- [ ] TypeScript type checking passes
- [ ] Package can be imported by dependent packages
- [ ] Documentation is updated

---

## Troubleshooting Common Issues

### Build Errors

**Issue**: Cannot find module '@nodm/financier-types'

**Solution**: Build dependencies first

```bash
nx build types
nx build db
```

### Test Failures

**Issue**: Database locked error in tests

**Solution**: Use separate test database

```typescript
process.env.DATABASE_URL = 'file:./test.db';
```

### Import Errors

**Issue**: ESM import issues

**Solution**: Verify package.json has `"type": "module"`

---

## Next Steps After Implementation

1. **Version 0.1.0 Release**

   - Tag release in git
   - Publish to npm
   - Create GitHub release with notes

2. **Gather User Feedback**

   - Test with real bank CSVs
   - Identify common issues
   - Plan improvements

3. **Version 0.2.0 Planning**
   - Additional bank support
   - Write operations in MCP
   - UI improvements

---

## Success Criteria

### Phase 1-3 Complete When:

- [ ] Types package exports all necessary types and schemas
- [ ] Database package successfully creates SQLite database
- [ ] Importer CLI accepts commands and shows help

### Phase 4-5 Complete When:

- [ ] Can import CSV from all 4 banks
- [ ] Duplicates are correctly detected and skipped
- [ ] Transactions appear in database with correct data

### Phase 6-7 Complete When:

- [ ] MCP server starts without errors
- [ ] All 4 tools are implemented and tested
- [ ] Claude can query financial data successfully

### Project Complete When:

- [ ] All phases 0-7 complete
- [ ] Integration tests pass
- [ ] Documentation complete
- [ ] Ready for npm publication

---

## Current Status

**Phase**: 5 (Importer Complete)
**Status**: SEB Lithuania Importer Fully Functional
**Next Action**: Implement MCP Server (Phase 6-7) or add more bank parsers

**Completed Phases**:

- ✅ Phase 0: Project Initialization
- ✅ Phase 1: Types Package
- ✅ Phase 1.5: Configuration Package
- ✅ Phase 2: Database Package
- ✅ Phase 3: Importer Infrastructure
- 🟡 Phase 4: Bank Parsers (SEB Lithuania complete, 3 more banks pending CSV samples)
- ✅ Phase 5: Importer Logic

**Implementation Details (SEB Lithuania)**:

- **CLI**: Commander.js with `import` command, `--dry-run`, `--account`, `--verbose` flags
- **Parser**: Custom chunk-based parser for SEB's multi-account CSV format + papaparse for CSV parsing
- **Features**:
  - Automatic bank detection from CSV headers
  - Multi-account CSV support (splits by account separator rows)
  - Duplicate detection via (accountId, date, externalId)
  - Batch database insertion
  - Comprehensive error handling
- **Tests**: 20 passing tests across errors, parsers, and services
- **Dependencies**: commander ^14.0.2, papaparse ^5.5.3

**Blocked Items**:

- Phase 4 (Remaining Bank Parsers) - Awaiting CSV samples for 3 additional banks

**Next Steps**:

1. **Option A**: Implement MCP Server (Phases 6-7) - Can proceed immediately
2. **Option B**: Add more bank parsers - Requires CSV samples from user
3. **Option C**: Integration testing (Phase 8) - Can test SEB importer end-to-end
