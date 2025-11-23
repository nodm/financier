# Development Setup Guide

## Prerequisites

### Required Software

- **Node.js**: v20.x LTS or later
- **npm**: v10.x or later (comes with Node.js)
- **Git**: Latest stable version
- **Code Editor**: VSCode recommended (with extensions below)

### VSCode Extensions (Recommended)

- **Biome** - Code linting and formatting
- **Prisma** - Prisma schema support
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
mkdir the-financier
cd the-financier

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

# Prisma
packages/db/prisma/dev.db
packages/db/prisma/dev.db-journal

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
npx create-nx-workspace@latest the-financier \
  --preset=ts \
  --nx-cloud=false

cd the-financier
```

**Configuration prompts:**
- Package manager: npm
- Create applications: No (we'll create packages manually)
- Distributed caching: No (for now)

### 3. Project Structure

```bash
# Create package directories
mkdir -p packages/types/src
mkdir -p packages/db/src packages/db/prisma
mkdir -p packages/importer/src packages/importer/tests
mkdir -p packages/mcp-server/src packages/mcp-server/tests

# Create docs and samples directories
mkdir docs samples

# Create root configuration files
touch .clinerules
touch biome.json
```

---

## Configuration Files

### TypeScript Configuration

**Root `tsconfig.base.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "lib": ["ES2023"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@nodm/financier-types": ["packages/types/src/index.ts"],
      "@nodm/financier-db": ["packages/db/src/index.ts"],
      "@nodm/financier-importer": ["packages/importer/src/index.ts"],
      "@nodm/financier-mcp-server": ["packages/mcp-server/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

### Biome Configuration

**`biome.json`** (root level):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
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
      "trailingCommas": "es5",
      "bracketSameLine": false
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
  }
}
```

### nx Configuration

**`nx.json`**:

```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"]
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "check": {
      "cache": true
    },
    "format": {
      "cache": true
    }
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default"
    }
  }
}
```

### 4. Set Up Biome with nx

```bash
# Install Biome and nx integration
npm install --save-dev @biomejs/biome @nx/biome

# Initialize Biome configuration for nx
npx nx g @nx/biome:configuration
```

This will:
- Create `biome.json` at the root (if not already created)
- Add Biome targets to all packages
- Configure nx caching for Biome operations

**Note**: If you already created `biome.json` manually in step 3, the generator will use it.

---

## Package Setup

### Package 1: @nodm/financier-types

**`packages/types/package.json`**:

```json
{
  "name": "@nodm/financier-types",
  "version": "0.1.0",
  "description": "Shared TypeScript types and Zod schemas for The Financier",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

**`packages/types/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Package 2: @nodm/financier-db

**`packages/db/package.json`**:

```json
{
  "name": "@nodm/financier-db",
  "version": "0.1.0",
  "description": "Database layer for The Financier",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "prisma generate && tsc",
    "test": "jest",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "@nodm/financier-types": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prisma": "^5.7.0",
    "typescript": "^5.3.3"
  }
}
```

**`packages/db/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Package 3: @nodm/financier-importer

**`packages/importer/package.json`**:

```json
{
  "name": "@nodm/financier-importer",
  "version": "0.1.0",
  "description": "CLI tool for importing bank statements",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "financier": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "@nodm/financier-db": "workspace:*",
    "@nodm/financier-types": "workspace:*",
    "commander": "^11.1.0",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/papaparse": "^5.3.14",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**`packages/importer/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

### Package 4: @nodm/financier-mcp-server

**`packages/mcp-server/package.json`**:

```json
{
  "name": "@nodm/financier-mcp-server",
  "version": "0.1.0",
  "description": "MCP server for accessing financial data",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "financier-mcp-server": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "@nodm/financier-db": "workspace:*",
    "@nodm/financier-types": "workspace:*",
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**`packages/mcp-server/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
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

### Initialize Prisma

```bash
cd packages/db

# Create initial schema (manually edit prisma/schema.prisma)
# Then generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init
```

### Database Location

Development database: `~/.financier/data.db`

```bash
# Create directory
mkdir -p ~/.financier

# Set environment variable (in packages/db/.env)
echo 'DATABASE_URL="file:${HOME}/.financier/data.db"' > .env
```

### View Database (Prisma Studio)

```bash
cd packages/db
npx prisma studio
```

Opens web UI at `http://localhost:5555`

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

**Issue**: Prisma client not generated

**Solution**: Run Prisma generate
```bash
cd packages/db
npx prisma generate
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
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

**`.vscode/extensions.json`**:

```json
{
  "recommendations": [
    "biomejs.biome",
    "prisma.prisma",
    "github.copilot"
  ]
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
3. ✅ Create initial Prisma schema
4. ✅ Generate Prisma client
5. ✅ Create sample CSV files for testing
6. ✅ Begin implementation following specifications

**Ready to start coding!**