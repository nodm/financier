/**
 * Base error class for all Financier errors
 */
export class FinancierError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "FinancierError";
    Object.setPrototypeOf(this, FinancierError.prototype);
  }
}

/**
 * Validation error (schema validation, data format issues)
 */
export class ValidationError extends FinancierError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Import error (CSV parsing, file reading issues)
 */
export class ImportError extends FinancierError {
  constructor(
    message: string,
    public readonly row?: number,
    public readonly rawData?: unknown
  ) {
    super(message, "IMPORT_ERROR");
    this.name = "ImportError";
    Object.setPrototypeOf(this, ImportError.prototype);
  }
}

/**
 * Database error (connection, query execution issues)
 */
export class DatabaseError extends FinancierError {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message, "DATABASE_ERROR");
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Query error (invalid query parameters, filters)
 */
export class QueryError extends FinancierError {
  constructor(
    message: string,
    public readonly filters?: Record<string, unknown>
  ) {
    super(message, "QUERY_ERROR");
    this.name = "QueryError";
    Object.setPrototypeOf(this, QueryError.prototype);
  }
}

/**
 * Configuration error (invalid config, missing required values)
 */
export class ConfigurationError extends FinancierError {
  constructor(
    message: string,
    public readonly key?: string
  ) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
