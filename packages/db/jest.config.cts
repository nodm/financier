module.exports = {
  displayName: "@nodm/financier-db",
  preset: "../../jest.preset.js",
  coverageDirectory: "test-output/jest/coverage",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  transformIgnorePatterns: ["node_modules/(?!(better-sqlite3)/)"],
};
