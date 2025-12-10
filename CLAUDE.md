# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal finance management system with SQLite database, Drizzle ORM, MCP server for LLM integration, and CLI importer for bank statements. Monorepo using Nx.

Tech stack: Node.js, TypeScript (ES2023), Nx, Drizzle ORM, SQLite, Zod

## Common Commands

### Build
```bash
# Build all packages
nx run-many --target=build --all

# Build specific package with dependencies
nx build <package> --with-deps

# Build order: types → config → db → importer/mcp-server
nx build types
nx build config
nx build db
nx build importer
nx build mcp-server
```

### Testing
```bash
# Test all packages
nx run-many --target=test --all

# Test specific package
nx test <package>

# Test specific file
nx test <package> -- --testPathPattern=<filename>

# Run affected tests only
nx affected --target=test
```

### Linting/Formatting
```bash
# Lint and format all packages (using Biome)
nx run-many --target=check --all -- --write

# Lint specific package
nx check <package> -- --write

# Run on affected only
nx affected --target=check
```

### TypeScript
```bash
# Type check all packages
nx run-many --target=typecheck --all

# Type check specific package
tsc --noEmit

# Sync TypeScript project references
npx nx sync
npx nx sync:check  # For CI
```

### Database (Drizzle)
```bash
cd packages/db

# Generate migration
npm run db:generate

# Push schema to database
npm run db:push

# Apply migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio

# Database location: ~/.financier/data.db
```

### Running Tools
```bash
# Run importer CLI
nx run importer:start -- --help
nx run importer:start -- import <file.csv>
nx run importer:start -- import <file.csv> --dry-run

# Run MCP server
nx run mcp-server:start
```

## Architecture

### Package Structure
```
@nodm/financier-types      # Shared types and Zod schemas (no dependencies)
@nodm/financier-config     # Configuration management (depends on types)
@nodm/financier-db         # Drizzle schema and client (depends on types)
@nodm/financier-importer   # CLI tool (depends on db, config, types)
@nodm/financier-mcp-server # MCP server (depends on db, config, types)
```

### Dependency Graph
```
importer ──┐
           ├──> db ──> types
mcp-server─┤     └──> config
           └────────> config
```

### Key Locations
- Database: `~/.financier/data.db`
- Drizzle schema: `packages/db/src/schema/`
- Migrations: `packages/db/drizzle/`
- Documentation: `docs/*.md`
- Test fixtures: `packages/*/tests/fixtures/`
- CSV samples: `samples/*.csv` (to be provided)

### Database Schema
- **Account**: UUID id, hash (SHA-256), mask (last 4 digits)
- **Transaction**: UUID id, accountId FK, externalId, date, amount, balance, type, merchant, category

Account numbers are hashed for privacy, with masked display.

## TypeScript Conventions

1. **Function declarations** over arrow functions:
   ```typescript
   function parseTransaction(data: unknown) { }  // ✅
   const parseTransaction = (data: unknown) => { }  // ❌
   ```

2. **Type inference** - avoid explicit return types:
   ```typescript
   function getAccount(id: string) {  // ✅
     return db.select().from(accounts).where(eq(accounts.id, id));
   }
   ```

3. **Array<T>** over bracket syntax:
   ```typescript
   Array<Transaction>  // ✅
   Transaction[]       // ❌
   ```

4. **Descriptive type names** (no single letters):
   ```typescript
   type TransactionType = 'debit' | 'credit';  // ✅
   type T = 'debit' | 'credit';  // ❌
   ```

5. **Native APIs** over external dependencies:
   ```typescript
   await fetch(url)     // ✅
   await axios.get(url) // ❌
   ```

## Module System

- **ESM only**: All packages have `"type": "module"` in package.json
- **Import extensions**: Use `.js` in imports (TypeScript ESM requirement)
- **Workspace dependencies**: Use `workspace:*` protocol

## Code Style (Biome)

Configuration in `biome.json`:
- Semicolons: always
- Quotes: double
- Trailing commas: ES5
- Indent: 2 spaces
- Line width: 80

## Git Conventions

### Commit Format (Conventional Commits)
```
<type>(<scope>): <description>

Types: feat, fix, docs, refactor, test, chore, perf
Scopes: types, config, db, importer, mcp-server, root

Examples:
feat(importer): add Bank1 CSV parser
fix(db): correct duplicate detection logic
docs(root): update architecture diagrams
test(mcp-server): add query tool integration tests
```

### Branch Naming
```
feature/<feature-name>
fix/<bug-name>
release/v<version>
```

## Implementation Phases

**Current Phase**: 5 (Importer Complete) - Ready for Phase 6 (MCP Core Infrastructure)

**Completed Phases**:
- ✅ Phase 0: Project Initialization
- ✅ Phase 1: Types Package
- ✅ Phase 1.5: Configuration Package
- ✅ Phase 2: Database Package
- ✅ Phase 3: Importer Infrastructure
- 🟡 Phase 4: Bank Parsers (SEB Lithuania complete, 3 more banks pending CSV samples)
- ✅ Phase 5: Importer Logic

**Next Phase**: Phase 6 - MCP Server Core Infrastructure

**Phase Order**:
1. Phase 1: Types Package (foundation) ✅
2. Phase 1.5: Configuration Package ✅
3. Phase 2: Database Package ✅
4. Phase 3: Importer Infrastructure ✅
5. Phase 4: Bank Parsers (SEB Lithuania ✅, 3 more pending CSV samples)
6. Phase 5: Importer Logic ✅
7. Phase 6: MCP Core (Next)
8. Phase 7: MCP Tools
9. Phase 8: Integration Testing

**Note**: Phase 4 (remaining bank parsers) can be completed in parallel with Phase 6-7 once CSV samples are provided.

See `docs/06-implementation-plan.md` for detailed tasks per phase.

## Testing Strategy

### Framework
- Jest for all testing
- Test files: `*.test.ts`
- Coverage target: >80% for critical paths

### Test Structure (Arrange-Act-Assert)
```typescript
describe('Bank1Parser', () => {
  it('should detect Bank1 format from headers', () => {
    // Arrange
    const headers = ['Date', 'Amount'];
    const parser = new Bank1Parser();

    // Act
    const result = parser.canParse(headers);

    // Assert
    expect(result).toBe(true);
  });
});
```

### Test Database
- Use separate test database: `test.db`
- Clean up in `afterEach` or `afterAll`
- Never use production database in tests

## Error Handling

### Custom Error Hierarchy
```
FinancierError (base in @nodm/financier-types)
├── ValidationError
├── ImportError
├── DatabaseError
└── QueryError
```

### Error Messages
Be specific and actionable:
```typescript
// ✅ Good
throw new ValidationError(
  'Invalid transaction amount: must be non-zero. Got: 0'
);

// ❌ Bad
throw new Error('Invalid amount');
```

## Security Considerations

- Never log sensitive data (account numbers, amounts, personal info)
- Database at `~/.financier/data.db` - relies on OS permissions
- No encryption in v1 (local-only)
- MCP server is read-only in v1
- Account numbers hashed with SHA-256

## Performance

- Batch database operations (1000 records per batch)
- Use Drizzle indexes for common queries
- Paginate large result sets with `.limit()` and `.offset()`
- Use `db.insert().values([...])` for bulk inserts

## Documentation

All technical docs in `/docs`:
- `00-project-overview.md` - High-level vision
- `01-architecture.md` - Technical architecture
- `02-database-schema.md` - Database design
- `03-mcp-server-specification.md` - MCP tools specification
- `04-importer-specification.md` - Importer CLI specification
- `05-development-setup.md` - Setup guide
- `06-implementation-plan.md` - Step-by-step implementation
- `07-drizzle-migration-plan.md` - Prisma to Drizzle migration
- `08-drizzle-guide.md` - Drizzle ORM usage guide

Update docs when architecture, schema, or APIs change.

## Pre-commit Checklist

- [ ] Code builds: `nx build <package>`
- [ ] Tests pass: `nx test <package>`
- [ ] Linting passes: `nx check <package> -- --write`
- [ ] TypeScript compiles with no errors
- [ ] Documentation updated if needed
- [ ] Conventional commit message prepared

## Special Notes

### Bank Parsers (Phase 4)
**Status**: SEB Lithuania parser complete ✅. 3 more banks pending CSV samples.

For remaining banks, each needs:
1. Anonymized CSV sample in `samples/`
2. Header pattern analysis
3. Custom parser implementation
4. Field mapping logic
5. Tests with fixtures

Remaining bank parsers can be implemented in parallel with Phase 6-7 once CSV samples are provided.

### MCP Server
- v1 is read-only (query operations only)
- 4 tools: query_transactions, get_accounts, search_transactions, get_statistics
- Configured in Claude Desktop
- Long-running process

### Importer CLI
- Detects bank format from CSV headers
- Handles multi-account CSVs (SEB Lithuania format supported)
- Duplicate detection via (externalId, accountId, date)
- Validates using Zod schemas
- Currently supports: SEB Lithuania (3 more banks pending CSV samples)

## Troubleshooting

### Build Errors
**Issue**: Cannot find module '@nodm/financier-types'
**Solution**: Build dependencies first:
```bash
nx build types
nx build config
nx build db
```

### Database Locked
**Issue**: Database locked in tests
**Solution**: Use separate test database:
```typescript
process.env.DATABASE_URL = 'file:./test.db';
```

### ESM Import Issues
**Issue**: Import/require errors
**Solution**: Verify `package.json` has `"type": "module"`


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# Rules

- Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.
