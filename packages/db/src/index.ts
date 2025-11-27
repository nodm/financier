export { Prisma, PrismaClient } from "@prisma/client";
export {
  disconnectDatabase,
  getDatabaseClient,
  resetDatabaseClient,
} from "./lib/client.js";
export {
  databaseExists,
  ensureDatabaseDirectory,
  getDatabaseDir,
  getDatabasePath,
  initializeDatabase,
} from "./lib/utils.js";
