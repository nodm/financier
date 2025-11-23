import { FinancierError } from "./base.js";

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
