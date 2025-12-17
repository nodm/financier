# @nodm/financier-mcp-server

MCP (Model Context Protocol) server for Financier - a personal finance management system with SQLite database.

This MCP server provides tools for Claude Desktop to interact with your Financier database, allowing you to query accounts, transactions, and financial statistics.

## Installation

This package includes a native dependency (`better-sqlite3`) that requires compilation during installation. The first installation may take a minute or two as it compiles the native bindings for your platform.

### Prerequisites

- **Node.js** >= 20.0.0
- **Build tools** for native compilation:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `build-essential` or equivalent (gcc, g++, make, python3)
  - **Windows**: Visual Studio Build Tools or Windows Build Tools

### Global Installation (Recommended)

This is the recommended method as it compiles the native dependencies once:

```bash
npm install -g @nodm/financier-mcp-server
```

**Note**: The first installation will compile `better-sqlite3` native bindings, which may take 1-2 minutes.

### Using npx (Alternative)

You can also use `npx` without global installation, but the first run will be slower as it downloads and compiles:

```bash
# First run will install and compile (takes 1-2 minutes)
npx -y @nodm/financier-mcp-server
```

## Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### Using Global Installation (Recommended)

```json
{
  "mcpServers": {
    "financier": {
      "command": "financier-mcp-server"
    }
  }
}
```

### Using npx (Alternative)

```json
{
  "mcpServers": {
    "financier": {
      "command": "npx",
      "args": ["-y", "@nodm/financier-mcp-server"]
    }
  }
}
```

**Note**: The first time Claude Desktop runs this, `npx` will download and compile the package (including native bindings), which may take 1-2 minutes. Subsequent runs will be faster.

## Database Setup

The MCP server uses a SQLite database located at:

- **Default**: `~/.financier/data.db`

You can override the database location by setting the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="file:/path/to/your/database.db"
```

### Initializing the Database

The database will be automatically created when first used. To set up your database schema, you'll need to use the [Financier importer](https://github.com/nodm/financier) or manually create the schema.

## Available Tools

The MCP server provides the following tools:

- **get_accounts** - Retrieve all accounts with optional balance and summary information
- **query_transactions** - Query transactions with filters (date range, account, type, etc.)
- **search_transactions** - Search transactions by description or merchant
- **get_statistics** - Get financial statistics (totals, averages, etc.)

## Requirements

- **Node.js** >= 20.0.0
- **Build tools** for native dependency compilation (see Prerequisites above)
- **SQLite database** (created automatically at `~/.financier/data.db`)

## Troubleshooting

### Native Compilation Errors

If you encounter errors during installation related to `better-sqlite3`:

1. **macOS**: Ensure Xcode Command Line Tools are installed:
   ```bash
   xcode-select --install
   ```

2. **Linux**: Install build essentials:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential python3
   
   # Fedora/RHEL
   sudo dnf install gcc gcc-c++ make python3
   ```

3. **Windows**: Install Windows Build Tools:
   ```bash
   npm install -g windows-build-tools
   ```

### Slow First Run with npx

If using `npx` in Claude Desktop, the first run will be slow (1-2 minutes) as it downloads and compiles the package. Consider using global installation for faster startup times.

## Development

This package is part of the [Financier monorepo](https://github.com/nodm/financier). For development setup, see the main repository README.

## License

MIT
