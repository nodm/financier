import { defineConfig } from "@prisma/client";
import { join } from "node:path";
import { homedir } from "node:os";

export default defineConfig({
  adapter: {
    connectionString: `file:${join(homedir(), ".financier", "data.db")}`,
  },
});
