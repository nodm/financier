import { disconnectDatabase, resetDatabaseClient } from "../src/lib/client.js";

beforeEach(async () => {
  await resetDatabaseClient();
});

afterAll(async () => {
  await disconnectDatabase();
});
