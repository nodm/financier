import { FinancierError } from "./base.js";

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
