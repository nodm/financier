import { describe, expect, it } from "@jest/globals";
import {
  DatabaseError,
  FinancierError,
  ImportError,
  QueryError,
  ValidationError,
} from "../../src/errors/index.js";

describe("FinancierError", () => {
  it("should create error with message", () => {
    // Arrange & Act
    const error = new FinancierError("Test error");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FinancierError);
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("FinancierError");
    expect(error.code).toBeUndefined();
  });

  it("should create error with message and code", () => {
    // Arrange & Act
    const error = new FinancierError("Test error", "TEST_CODE");

    // Assert
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
  });

  it("should have stack trace", () => {
    // Arrange & Act
    const error = new FinancierError("Test error");

    // Assert
    expect(error.stack).toBeDefined();
  });
});

describe("ValidationError", () => {
  it("should create error with message only", () => {
    // Arrange & Act
    const error = new ValidationError("Invalid data");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FinancierError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Invalid data");
    expect(error.name).toBe("ValidationError");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.field).toBeUndefined();
    expect(error.value).toBeUndefined();
  });

  it("should create error with field name", () => {
    // Arrange & Act
    const error = new ValidationError("Invalid amount", "amount");

    // Assert
    expect(error.message).toBe("Invalid amount");
    expect(error.field).toBe("amount");
    expect(error.value).toBeUndefined();
  });

  it("should create error with field and value", () => {
    // Arrange & Act
    const error = new ValidationError("Amount must be positive", "amount", -50);

    // Assert
    expect(error.message).toBe("Amount must be positive");
    expect(error.field).toBe("amount");
    expect(error.value).toBe(-50);
  });

  it("should preserve value types", () => {
    // Arrange & Act
    const stringError = new ValidationError("Invalid", "field", "test");
    const numberError = new ValidationError("Invalid", "field", 123);
    const objectError = new ValidationError("Invalid", "field", {
      key: "value",
    });
    const nullError = new ValidationError("Invalid", "field", null);

    // Assert
    expect(stringError.value).toBe("test");
    expect(numberError.value).toBe(123);
    expect(objectError.value).toEqual({ key: "value" });
    expect(nullError.value).toBeNull();
  });
});

describe("ImportError", () => {
  it("should create error with message only", () => {
    // Arrange & Act
    const error = new ImportError("Failed to parse CSV");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FinancierError);
    expect(error).toBeInstanceOf(ImportError);
    expect(error.message).toBe("Failed to parse CSV");
    expect(error.name).toBe("ImportError");
    expect(error.code).toBe("IMPORT_ERROR");
    expect(error.row).toBeUndefined();
    expect(error.rawData).toBeUndefined();
  });

  it("should create error with row number", () => {
    // Arrange & Act
    const error = new ImportError("Invalid data format", 42);

    // Assert
    expect(error.message).toBe("Invalid data format");
    expect(error.row).toBe(42);
    expect(error.rawData).toBeUndefined();
  });

  it("should create error with row and raw data", () => {
    // Arrange
    const rawData = { date: "invalid", amount: "N/A" };

    // Act
    const error = new ImportError("Cannot parse transaction", 10, rawData);

    // Assert
    expect(error.message).toBe("Cannot parse transaction");
    expect(error.row).toBe(10);
    expect(error.rawData).toEqual(rawData);
  });

  it("should preserve raw data types", () => {
    // Arrange & Act
    const arrayError = new ImportError("Error", 1, ["col1", "col2"]);
    const objectError = new ImportError("Error", 2, { field: "value" });
    const stringError = new ImportError("Error", 3, "raw string");

    // Assert
    expect(arrayError.rawData).toEqual(["col1", "col2"]);
    expect(objectError.rawData).toEqual({ field: "value" });
    expect(stringError.rawData).toBe("raw string");
  });
});

describe("DatabaseError", () => {
  it("should create error with message only", () => {
    // Arrange & Act
    const error = new DatabaseError("Connection failed");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FinancierError);
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe("Connection failed");
    expect(error.name).toBe("DatabaseError");
    expect(error.code).toBe("DATABASE_ERROR");
    expect(error.originalError).toBeUndefined();
  });

  it("should create error with original error", () => {
    // Arrange
    const originalError = new Error("SQLITE_CANTOPEN");

    // Act
    const error = new DatabaseError("Cannot open database", originalError);

    // Assert
    expect(error.message).toBe("Cannot open database");
    expect(error.originalError).toBe(originalError);
    expect(error.originalError?.message).toBe("SQLITE_CANTOPEN");
  });

  it("should preserve original error stack", () => {
    // Arrange
    const originalError = new Error("Original error");

    // Act
    const error = new DatabaseError("Database error", originalError);

    // Assert
    expect(error.originalError?.stack).toBeDefined();
  });
});

describe("QueryError", () => {
  it("should create error with message only", () => {
    // Arrange & Act
    const error = new QueryError("Invalid query");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FinancierError);
    expect(error).toBeInstanceOf(QueryError);
    expect(error.message).toBe("Invalid query");
    expect(error.name).toBe("QueryError");
    expect(error.code).toBe("QUERY_ERROR");
    expect(error.filters).toBeUndefined();
  });

  it("should create error with filters", () => {
    // Arrange
    const filters = {
      accountId: "LT123456789012345678",
      startDate: new Date("2024-01-01"),
      minAmount: -100,
    };

    // Act
    const error = new QueryError("Invalid filter combination", filters);

    // Assert
    expect(error.message).toBe("Invalid filter combination");
    expect(error.filters).toEqual(filters);
  });

  it("should preserve complex filter objects", () => {
    // Arrange
    const filters = {
      nested: {
        field: "value",
      },
      array: [1, 2, 3],
      date: new Date("2024-01-01"),
    };

    // Act
    const error = new QueryError("Query failed", filters);

    // Assert
    expect(error.filters).toEqual(filters);
    expect(error.filters?.nested).toEqual({ field: "value" });
    expect(error.filters?.array).toEqual([1, 2, 3]);
  });
});

describe("Error inheritance chain", () => {
  it("should maintain proper inheritance for ValidationError", () => {
    // Arrange & Act
    const error = new ValidationError("Test");

    // Assert
    expect(error instanceof Error).toBe(true);
    expect(error instanceof FinancierError).toBe(true);
    expect(error instanceof ValidationError).toBe(true);
  });

  it("should maintain proper inheritance for ImportError", () => {
    // Arrange & Act
    const error = new ImportError("Test");

    // Assert
    expect(error instanceof Error).toBe(true);
    expect(error instanceof FinancierError).toBe(true);
    expect(error instanceof ImportError).toBe(true);
  });

  it("should maintain proper inheritance for DatabaseError", () => {
    // Arrange & Act
    const error = new DatabaseError("Test");

    // Assert
    expect(error instanceof Error).toBe(true);
    expect(error instanceof FinancierError).toBe(true);
    expect(error instanceof DatabaseError).toBe(true);
  });

  it("should maintain proper inheritance for QueryError", () => {
    // Arrange & Act
    const error = new QueryError("Test");

    // Assert
    expect(error instanceof Error).toBe(true);
    expect(error instanceof FinancierError).toBe(true);
    expect(error instanceof QueryError).toBe(true);
  });

  it("should distinguish between error types", () => {
    // Arrange
    const validationError = new ValidationError("Test");
    const importError = new ImportError("Test");

    // Assert
    expect(validationError instanceof ValidationError).toBe(true);
    expect(validationError instanceof ImportError).toBe(false);
    expect(importError instanceof ImportError).toBe(true);
    expect(importError instanceof ValidationError).toBe(false);
  });
});

describe("Error catching patterns", () => {
  it("should catch as FinancierError base class", () => {
    // Arrange
    function throwValidationError() {
      throw new ValidationError("Test error");
    }

    // Act & Assert
    expect(() => throwValidationError()).toThrow(FinancierError);
    expect(() => throwValidationError()).toThrow(ValidationError);
    expect(() => throwValidationError()).toThrow(Error);
  });

  it("should allow type-specific error handling", () => {
    // Arrange
    function processError(error: unknown) {
      if (error instanceof ValidationError) {
        return `Validation failed: ${error.field}`;
      }
      if (error instanceof ImportError) {
        return `Import failed at row: ${error.row}`;
      }
      if (error instanceof FinancierError) {
        return `Financier error: ${error.code}`;
      }
      return "Unknown error";
    }

    // Act & Assert
    expect(processError(new ValidationError("Test", "amount"))).toBe(
      "Validation failed: amount"
    );
    expect(processError(new ImportError("Test", 42))).toBe(
      "Import failed at row: 42"
    );
    expect(processError(new DatabaseError("Test"))).toBe(
      "Financier error: DATABASE_ERROR"
    );
  });
});
