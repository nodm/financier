#!/usr/bin/env node

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(packageRoot, "../..");

async function bundle() {
  console.log("📦 Bundling MCP server with internal dependencies...");

  try {
    // Create a plugin to resolve workspace packages
    const workspacePlugin = {
      name: "workspace-resolver",
      setup(build) {
        // Resolve @nodm/financier-db to the built dist file
        build.onResolve({ filter: /^@nodm\/financier-db$/ }, () => {
          return {
            path: join(workspaceRoot, "packages/db/dist/index.js"),
          };
        });

        // Resolve @nodm/financier-types to the built dist file
        build.onResolve({ filter: /^@nodm\/financier-types$/ }, () => {
          return {
            path: join(workspaceRoot, "packages/types/dist/index.js"),
          };
        });
      },
    };

    // Bundle the entry point and all its dependencies
    // External dependencies will remain as npm packages
    await build({
      entryPoints: [join(packageRoot, "dist/index.js")],
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node20",
      outfile: join(packageRoot, "dist/index.bundled.js"),
      external: [
        // better-sqlite3 MUST stay external - it has native C++ bindings
        // that are platform-specific and cannot be bundled
        "better-sqlite3",
      ],
      plugins: [workspacePlugin],
      banner: {
        js: "#!/usr/bin/env node",
      },
      minify: false, // Keep readable for debugging
      sourcemap: true,
      logLevel: "info",
    });

    // Replace the original index.js with the bundled version
    const fs = await import("node:fs/promises");
    const bundledContent = await fs.readFile(
      join(packageRoot, "dist/index.bundled.js"),
      "utf-8"
    );
    await fs.writeFile(join(packageRoot, "dist/index.js"), bundledContent);
    await fs.unlink(join(packageRoot, "dist/index.bundled.js"));

    console.log("✅ Bundling complete!");
  } catch (error) {
    console.error("❌ Bundling failed:", error);
    process.exit(1);
  }
}

bundle();

