# Development Setup Guide

## Prerequisites

### Required Software

- **Node.js**: v20.x LTS or later
- **npm**: v10.x or later (comes with Node.js)
- **Git**: Latest stable version
- **Code Editor**: VSCode recommended (with extensions below)

### VSCode Extensions (Recommended)

- **Biome** - Code linting and formatting
- **GitHub Copilot** - AI pair programming
- **TypeScript and JavaScript Language Features** (built-in)

### System Requirements

- **OS**: macOS, Linux, or Windows 11
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB for dependencies

---

## Initial Setup

### 1. Create Repository

```bash
# Create project directory
mkdir financier
cd financier

# Initialize git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Testing
coverage/
.nyc_output/
test.db
test.db-journal

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Drizzle
packages/db/drizzle/
packages/db/dev.db
packages/db/dev.db-journal

# User data
.financier/
*.db
*.db-journal
EOF
```

### 2. Initialize nx Monorepo

```bash
# Install nx globally (optional but recommended)
npm install -g nx

# Create nx workspace
cd financier

npx create-nx-workspace@latest financier \
  --preset=ts \
  --nx-cloud=false
  --directory=.
```

**Configuration prompts:**

- Package manager: npm
- Create applications: No (we'll create packages manually)
- Distributed caching: No (for now)

### 3. Generate Packages

```bash
# Generate packages using nx
nx g @nx/js:library types --directory=packages/types --buildable --publishable --importPath=@nodm/financier-types
nx g @nx/js:library config --directory=packages/config --buildable --publishable --importPath=@nodm/financier-config
nx g @nx/js:library db --directory=packages/db --buildable --publishable --importPath=@nodm/financier-db
nx g @nx/js:library importer --directory=packages/importer --buildable --publishable --importPath=@nodm/financier-importer
nx g @nx/js:library mcp-server --directory=packages/mcp-server --buildable --publishable --importPath=@nodm/financier-mcp-server

# Create additional directories
mkdir -p packages/db/drizzle
mkdir docs samples
```

---

## Configuration Files

### Note on Configuration

After running `nx g @nx/js:library`, nx automatically configures:
- `tsconfig.base.json` with strict TypeScript settings
- `tsconfig.json` with project references
- `nx.json` with TypeScript plugin and release configuration

The generated configuration uses modern defaults:
- **TypeScript**: ES2022 target, nodenext module resolution, composite builds
- **Strict mode**: All strict checks enabled plus additional safety checks
- **Project references**: Automatic dependency tracking via TypeScript composite mode

No manual configuration changes needed unless you have specific requirements.

### Set Up Biome (Linting/Formatting)

Biome is used instead of ESLint/Prettier for faster, unified linting and formatting.

**Install and initialize:**

```bash
# Install Biome
npm install --save-dev @biomejs/biome

# Initialize Biome configuration
npx @biomejs/biome init
```

This creates a basic `biome.json` at the repository root.

**Customize `biome.json`:**

Modify the generated configuration (keep the schema version that was generated):

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.7/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "double",
      "trailingCommas": "es5"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

**Note:** The schema version will match your installed Biome version. The example shows 2.3.7, but use whatever version `biome init` generates.

**Add npm scripts to root `package.json`:**

```json
{
  "scripts": {
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  }
}
```

**Add caching to `nx.json`:**

Update `targetDefaults` section:

```json
{
  "targetDefaults": {
    "lint": {
      "cache": true,
      "inputs": [
        "default",
        "^default",
        "{workspaceRoot}/biome.json",
        { "externalDependencies": ["@biomejs/biome"] }
      ]
    },
    "format": {
      "cache": true,
      "inputs": [
        "default",
        "^default",
        "{workspaceRoot}/biome.json",
        { "externalDependencies": ["@biomejs/biome"] }
      ]
    },
    "check": {
      "cache": true,
      "inputs": [
        "default",
        "^default",
        "{workspaceRoot}/biome.json",
        { "externalDependencies": ["@biomejs/biome"] }
      ]
    }
  }
}
```

Now you can run:
```bash
npm run lint       # Lint all files
npm run format     # Format all files
npm run check      # Lint and format (combined)
nx run-many -t lint  # Lint with nx caching
```

---

## Package Configuration

### Note on Package Structure

Nx generates base package files automatically. The generated `package.json` files:
- Are minimal with only `tslib` dependency
- Have version 0.0.1
- Include proper ESM configuration (`"type": "module"`)
- Have correct exports and build configuration

**Additional dependencies** (zod, drizzle-orm, commander, etc.) will be added during Phase 1-7 implementation as each package is developed.

### Package-Specific Dependencies

When implementing each phase, add these dependencies:

**@nodm/financier-types** (Phase 1):
```bash
cd packages/types
npm install zod
```

**@nodm/financier-config** (Phase 1.5):
```bash
cd packages/config
npm install zod
npm install --workspace=@nodm/financier-types
```

**@nodm/financier-db** (Phase 2):
```bash
cd packages/db
npm install drizzle-orm better-sqlite3
npm install --save-dev drizzle-kit @types/better-sqlite3
npm install --workspace=@nodm/financier-types
```

**@nodm/financier-importer** (Phase 3-5):
```bash
cd packages/importer
npm install commander papaparse
npm install --save-dev @types/papaparse tsx
npm install --workspace=@nodm/financier-db --workspace=@nodm/financier-config --workspace=@nodm/financier-types
```

**@nodm/financier-mcp-server** (Phase 6-7):
```bash
cd packages/mcp-server
npm install @modelcontextprotocol/sdk
npm install --save-dev tsx
npm install --workspace=@nodm/financier-db --workspace=@nodm/financier-config --workspace=@nodm/financier-types
```

---

## Testing Setup

### Jest Configuration

**Root `jest.config.js`**:

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@nodm/financier-types$': '/packages/types/src/index.ts',
    '^@nodm/financier-db$': '/packages/db/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['packages/*/src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};
```

**Install Jest dependencies**:

```bash
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  @jest/globals
```

---

## Development Workflow

### Install Dependencies

```bash
# Install all dependencies for all packages
npm install
```

### Build Packages

```bash
# Build all packages
nx run-many --target=build --all

# Build specific package
nx build types
nx build db
nx build importer
nx build mcp-server

# Build with dependencies
nx build importer --with-deps
```

### Run Tests

```bash
# Run all tests
nx run-many --target=test --all

# Run specific package tests
nx test types
nx test importer

# Watch mode
nx test importer --watch

# Coverage
nx test --coverage
```

### Development Mode

```bash
# Run importer in dev mode (with hot reload)
nx dev importer

# Run MCP server in dev mode
nx dev mcp-server
```

### Linting and Formatting

```bash
# Check (lint + format) all packages
nx run-many --target=check --all

# Check specific package
nx check importer

# Fix all issues automatically
nx run-many --target=check --all -- --write

# Just format (no linting)
nx run-many --target=format --all

# Just lint (no formatting)
nx run-many --target=lint --all

# Check only affected packages
nx affected --target=check
```

### Type Checking

```bash
# Type check all packages
nx run-many --target=type-check --all
```

---

## Database Setup

### Initialize Drizzle

```bash
cd packages/db

# Create schema files in src/schema/
# accounts.ts, transactions.ts, index.ts

# Generate migration from schema
npm run db:generate

# Apply migration
npm run db:migrate
```

### Database Location

Development database: `~/.financier/data.db`

```bash
# Create directory
mkdir -p ~/.financier

# Set environment variable (in packages/db/.env)
echo 'DATABASE_URL="file:${HOME}/.financier/data.db"' > .env
```

### View Database (Drizzle Studio)

```bash
cd packages/db
npm run db:studio
```

Opens web UI for browsing database

---

## Local Testing

### Test Importer Locally

```bash
# Build importer
nx build importer

# Link globally for testing
cd packages/importer
npm link

# Test command
financier import ~/Downloads/sample.csv --dry-run
```

### Test MCP Server Locally

```bash
# Build MCP server
nx build mcp-server

# Link globally
cd packages/mcp-server
npm link

# Test via Claude Desktop config
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "financier": {
      "command": "financier-mcp-server"
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@nodm/financier-types'`

**Solution**: Build dependencies first

```bash
nx build types
nx build db
```

**Issue**: Database schema not found

**Solution**: Ensure schema files exist and build package

```bash
cd packages/db
nx build db
```

**Issue**: TypeScript errors in imports

**Solution**: Check tsconfig.json paths and rebuild

```bash
nx run-many --target=build --all
```

**Issue**: Jest can't resolve ESM imports

**Solution**: Verify jest.config.js has correct ESM configuration

---

## IDE Configuration

### VSCode Settings

**`.vscode/settings.json`**:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**`.vscode/extensions.json`**:

```json
{
  "recommendations": ["biomejs.biome", "github.copilot"]
}
```

---

## Git Workflow

### Commit Convention

Use Conventional Commits:

```bash
# Feature
git commit -m "feat(importer): add Bank1 parser"

# Fix
git commit -m "fix(db): correct duplicate detection query"

# Documentation
git commit -m "docs: update architecture diagrams"

# Refactor
git commit -m "refactor(types): simplify transaction schema"

# Test
git commit -m "test(importer): add parser integration tests"

# Chore
git commit -m "chore: update dependencies"
```

### Branch Strategy

```bash
# Main branch
main

# Feature branches
feature/bank1-parser
feature/mcp-statistics-tool

# Fix branches
fix/duplicate-detection

# Release branches
release/v0.1.0
```

---

## Scripts

### Useful Package Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "build:all": "nx run-many --target=build --all",
    "test:all": "nx run-many --target=test --all",
    "check:all": "nx run-many --target=check --all",
    "format:all": "nx run-many --target=format --all",
    "clean": "nx reset && rm -rf dist packages/*/dist",
    "prepare": "nx run-many --target=build --all"
  }
}
```

### Pre-commit Hooks (Optional)

Install husky for pre-commit hooks:

```bash
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

**`.lintstagedrc`**:

```json
{
  "*.{ts,js,json}": ["biome check --write --no-errors-on-unmatched"]
}
```

---

## Next Steps

After setup is complete:

1. ✅ Verify all packages build successfully
2. ✅ Run test suite (should pass with no tests initially)
3. ✅ Create Drizzle schema files
4. ✅ Generate and apply database migrations
5. ✅ Create sample CSV files for testing
6. ✅ Begin implementation following specifications

**Ready to start coding!**
