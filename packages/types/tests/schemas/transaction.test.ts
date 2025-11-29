import { describe, expect, it } from "@jest/globals";
import {
  createTransactionSchema,
  rawTransactionDataSchema,
  transactionFiltersSchema,
  transactionSchema,
} from "../../src/schemas/transaction.js";
import { Currency } from "../../src/types/currency.js";
import { TransactionType } from "../../src/types/transaction.js";

describe("transactionSchema", () => {
  it("should validate a valid transaction", () => {
    // Arrange
    const validTransaction = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "LT123456789012345678",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: 100.5,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: "Test Merchant",
      description: "Test transaction",
      category: "Shopping",
      type: TransactionType.DEBIT,
      balance: 500.0,
      externalId: "EXT123",
      source: "REVOLUT",
      importedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = transactionSchema.safeParse(validTransaction);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate transaction with negative amount", () => {
    // Arrange
    const transaction = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "LT123456789012345678",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: -50.25,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: null,
      description: "Fee",
      category: null,
      type: TransactionType.DEBIT,
      balance: 449.75,
      externalId: null,
      source: "BANK",
      importedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = transactionSchema.safeParse(transaction);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate internal transfer with counterpartyAccountId", () => {
    // Arrange
    const transaction = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "LT123456789012345678",
      counterpartyAccountId: "LT987654321098765432",
      date: new Date("2024-01-15"),
      amount: 200.0,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: null,
      description: "Internal transfer",
      category: "Transfer",
      type: TransactionType.CREDIT,
      balance: 700.0,
      externalId: "TRANS123",
      source: "SEB",
      importedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = transactionSchema.safeParse(transaction);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate multi-currency transaction", () => {
    // Arrange
    const transaction = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "LT123456789012345678",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: 92.5,
      currency: Currency.EUR,
      originalAmount: 100.0,
      originalCurrency: "USD",
      merchant: "Amazon",
      description: "Online purchase",
      category: "Shopping",
      type: TransactionType.DEBIT,
      balance: 407.5,
      externalId: "AMZ123",
      source: "REVOLUT",
      importedAt: new Date("2024-01-16"),
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    };

    // Act
    const result = transactionSchema.safeParse(transaction);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should fail validation with invalid UUID", () => {
    // Arrange
    const invalidTransaction = {
      id: "not-a-uuid",
      accountId: "LT123456789012345678",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: 100.5,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: "Test",
      description: "Test",
      category: null,
      type: TransactionType.DEBIT,
      balance: 500.0,
      externalId: "EXT123",
      source: "BANK",
      importedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Act
    const result = transactionSchema.safeParse(invalidTransaction);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with empty accountId", () => {
    // Arrange
    const invalidTransaction = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: 100.5,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: "Test",
      description: "Test",
      category: null,
      type: TransactionType.DEBIT,
      balance: 500.0,
      externalId: "EXT123",
      source: "BANK",
      importedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Act
    const result = transactionSchema.safeParse(invalidTransaction);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with missing required fields", () => {
    // Arrange
    const invalidTransaction = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "LT123456789012345678",
    };

    // Act
    const result = transactionSchema.safeParse(invalidTransaction);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  it("should validate valid creation data", () => {
    // Arrange
    const validData = {
      accountId: "LT123456789012345678",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: 100.5,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: "Test Merchant",
      description: "Test transaction",
      category: "Shopping",
      type: TransactionType.DEBIT,
      balance: 500.0,
      externalId: "EXT123",
      source: "REVOLUT",
    };

    // Act
    const result = createTransactionSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should fail validation with missing description", () => {
    // Arrange
    const invalidData = {
      accountId: "LT123456789012345678",
      counterpartyAccountId: null,
      date: new Date("2024-01-15"),
      amount: 100.5,
      currency: Currency.EUR,
      originalAmount: null,
      originalCurrency: null,
      merchant: "Test",
      category: null,
      type: TransactionType.DEBIT,
      balance: 500.0,
      externalId: "EXT123",
      source: "BANK",
    };

    // Act
    const result = createTransactionSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("rawTransactionDataSchema", () => {
  it("should validate raw data with string values", () => {
    // Arrange
    const rawData = {
      date: "2024-01-15",
      amount: "100.50",
      currency: "EUR",
      balance: "500.00",
      merchant: "Test Merchant",
      category: "Shopping",
      externalId: "EXT123",
      typeIndicator: "D",
      accountNumber: "LT123456789012345678",
    };

    // Act
    const result = rawTransactionDataSchema.safeParse(rawData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate raw data with numeric values", () => {
    // Arrange
    const rawData = {
      date: new Date("2024-01-15"),
      amount: 100.5,
      currency: Currency.EUR,
      balance: 500.0,
      merchant: null,
      category: null,
      externalId: "EXT123",
    };

    // Act
    const result = rawTransactionDataSchema.safeParse(rawData);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate minimal raw data", () => {
    // Arrange
    const rawData = {
      date: "2024-01-15",
      amount: "100.50",
      currency: "EUR",
      externalId: "EXT123",
    };

    // Act
    const result = rawTransactionDataSchema.safeParse(rawData);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("transactionFiltersSchema", () => {
  it("should validate with all filter options", () => {
    // Arrange
    const filters = {
      accountId: "LT123456789012345678",
      counterpartyAccountId: "LT987654321098765432",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      minAmount: 10.0,
      maxAmount: 1000.0,
      type: TransactionType.DEBIT,
      merchant: "Amazon",
      category: "Shopping",
      source: "REVOLUT",
      limit: 50,
      offset: 0,
    };

    // Act
    const result = transactionFiltersSchema.safeParse(filters);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    }
  });

  it("should apply default values for limit and offset", () => {
    // Arrange
    const filters = {
      accountId: "LT123456789012345678",
    };

    // Act
    const result = transactionFiltersSchema.safeParse(filters);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(0);
    }
  });

  it("should validate empty filters", () => {
    // Arrange
    const filters = {};

    // Act
    const result = transactionFiltersSchema.safeParse(filters);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(0);
    }
  });

  it("should fail validation with limit over 1000", () => {
    // Arrange
    const filters = {
      limit: 1500,
    };

    // Act
    const result = transactionFiltersSchema.safeParse(filters);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should fail validation with negative offset", () => {
    // Arrange
    const filters = {
      offset: -10,
    };

    // Act
    const result = transactionFiltersSchema.safeParse(filters);

    // Assert
    expect(result.success).toBe(false);
  });
});
