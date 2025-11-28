import { CSVParseError, UnsupportedBankError } from "../../src/errors/index.js";

describe("CSVParseError", () => {
  it("should create error with message", () => {
    const error = new CSVParseError("Test error");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("CSVParseError");
    expect(error.message).toBe("Test error");
    expect(error.line).toBeUndefined();
  });

  it("should create error with line number", () => {
    const error = new CSVParseError("Parse error at line 5", 5);

    expect(error.message).toBe("Parse error at line 5");
    expect(error.line).toBe(5);
  });

  it("should maintain prototype chain", () => {
    const error = new CSVParseError("Test");

    expect(error instanceof CSVParseError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe("UnsupportedBankError", () => {
  it("should create error with message", () => {
    const error = new UnsupportedBankError("Unsupported bank format");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnsupportedBankError");
    expect(error.message).toBe("Unsupported bank format");
  });

  it("should maintain prototype chain", () => {
    const error = new UnsupportedBankError("Test");

    expect(error instanceof UnsupportedBankError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});
