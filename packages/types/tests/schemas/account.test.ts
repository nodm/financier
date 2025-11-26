import { describe, expect, it } from "@jest/globals";
import { BankCode } from "../../src/types/bank.js";
import { Currency } from "../../src/types/currency.js";
import {
  accountSchema,
  createAccountSchema,
  updateAccountSchema,
} from "../../src/schemas/account.js";

describe("accountSchema", () => {
  it("should validate a valid account", () => {
    // Arrange
    const validAccount = {
      id: "LT123456789012345678",
      name: "Main Checking Account",
      openDate: new Date("2020-01-15"),
      openingBalance: 1000.0,
      currentBalance: 5000.0,
      currency: Currency.EUR,
      bankCode: BankCode.REVOLUT,
      isActive: true,
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = accountSchema.safeParse(validAccount);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate account with null optional fields", () => {
    // Arrange
    const account = {
      id: "LT987654321098765432",
      name: "Savings Account",
      openDate: null,
      openingBalance: null,
      currentBalance: null,
      currency: Currency.USD,
      bankCode: BankCode.SEB,
      isActive: true,
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = accountSchema.safeParse(account);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate inactive account", () => {
    // Arrange
    const account = {
      id: "UA123456789012345678",
      name: "Closed Account",
      openDate: new Date("2019-03-01"),
      openingBalance: 0.0,
      currentBalance: 0.0,
      currency: Currency.UAH,
      bankCode: BankCode.MONOBANK,
      isActive: false,
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = accountSchema.safeParse(account);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should fail validation with empty id", () => {
    // Arrange
    const invalidAccount = {
      id: "",
      name: "Test Account",
      openDate: null,
      openingBalance: null,
      currentBalance: null,
      currency: Currency.EUR,
      bankCode: BankCode.REVOLUT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Act
    const result = accountSchema.safeParse(invalidAccount);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with empty name", () => {
    // Arrange
    const invalidAccount = {
      id: "LT123456789012345678",
      name: "",
      openDate: null,
      openingBalance: null,
      currentBalance: null,
      currency: Currency.EUR,
      bankCode: BankCode.REVOLUT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Act
    const result = accountSchema.safeParse(invalidAccount);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with invalid currency", () => {
    // Arrange
    const invalidAccount = {
      id: "LT123456789012345678",
      name: "Test Account",
      openDate: null,
      openingBalance: null,
      currentBalance: null,
      currency: "INVALID" as Currency,
      bankCode: BankCode.REVOLUT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Act
    const result = accountSchema.safeParse(invalidAccount);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with invalid bankCode", () => {
    // Arrange
    const invalidAccount = {
      id: "LT123456789012345678",
      name: "Test Account",
      openDate: null,
      openingBalance: null,
      currentBalance: null,
      currency: Currency.EUR,
      bankCode: "INVALID" as BankCode,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Act
    const result = accountSchema.safeParse(invalidAccount);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with missing required fields", () => {
    // Arrange
    const invalidAccount = {
      id: "LT123456789012345678",
      name: "Test Account",
    };

    // Act
    const result = accountSchema.safeParse(invalidAccount);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("createAccountSchema", () => {
  it("should validate valid creation data", () => {
    // Arrange
    const validData = {
      id: "LT123456789012345678",
      name: "New Account",
      openDate: new Date("2024-01-15"),
      openingBalance: 1000.0,
      currentBalance: 1000.0,
      currency: Currency.EUR,
      bankCode: BankCode.SWEDBANK,
    };

    // Act
    const result = createAccountSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate creation data with null optional fields", () => {
    // Arrange
    const validData = {
      id: "LT987654321098765432",
      name: "Basic Account",
      openDate: null,
      openingBalance: null,
      currentBalance: null,
      currency: Currency.USD,
      bankCode: BankCode.REVOLUT,
    };

    // Act
    const result = createAccountSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should fail validation with missing required fields", () => {
    // Arrange
    const invalidData = {
      id: "LT123456789012345678",
      name: "Incomplete Account",
    };

    // Act
    const result = createAccountSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("updateAccountSchema", () => {
  it("should validate update with all fields", () => {
    // Arrange
    const validData = {
      name: "Updated Account Name",
      openDate: new Date("2024-02-01"),
      openingBalance: 2000.0,
      currentBalance: 3000.0,
      isActive: false,
    };

    // Act
    const result = updateAccountSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate update with single field", () => {
    // Arrange
    const validData = {
      name: "New Name Only",
    };

    // Act
    const result = updateAccountSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate update with null values", () => {
    // Arrange
    const validData = {
      openDate: null,
      openingBalance: null,
    };

    // Act
    const result = updateAccountSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate empty update object", () => {
    // Arrange
    const validData = {};

    // Act
    const result = updateAccountSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should fail validation with empty name", () => {
    // Arrange
    const invalidData = {
      name: "",
    };

    // Act
    const result = updateAccountSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });
});
