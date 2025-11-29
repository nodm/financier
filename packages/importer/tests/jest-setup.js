// Jest setup to handle papaparse module resolution
// This ensures papaparse works correctly in Jest's test environment

// Mock papaparse to ensure it's properly loaded
jest.mock(
  "papaparse",
  () => {
    const actual = jest.requireActual("papaparse");
    return actual;
  },
  { virtual: false }
);
