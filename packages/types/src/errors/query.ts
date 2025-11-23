import { FinancierError } from "./base.js";

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
