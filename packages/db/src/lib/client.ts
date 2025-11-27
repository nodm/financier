import { DatabaseError } from "@nodm/financier-types";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { getDatabasePath } from "./utils.js";

let prismaClient: PrismaClient | null = null;

/**
 * Get or create Prisma client singleton
 */
export function getDatabaseClient(): PrismaClient {
  if (!prismaClient) {
    try {
      const databaseUrl =
        process.env.DATABASE_URL || `file:${getDatabasePath()}`;

      // Parse file: or file:// URLs correctly
      const dbPath = databaseUrl.startsWith("file://")
        ? databaseUrl.slice(7)
        : databaseUrl.startsWith("file:")
          ? databaseUrl.slice(5)
          : databaseUrl;

      const adapter = new PrismaBetterSqlite3({
        url: dbPath,
        verbose:
          process.env.NODE_ENV === "development" ? console.log : undefined,
        timeout: 5000,
      });

      prismaClient = new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    } catch (error) {
      throw new DatabaseError(
        "Failed to initialize database client",
        error instanceof Error ? error : undefined
      );
    }
  }
  return prismaClient;
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

/**
 * Reset database client (useful for testing)
 */
export async function resetDatabaseClient(): Promise<void> {
  await disconnectDatabase();
}
