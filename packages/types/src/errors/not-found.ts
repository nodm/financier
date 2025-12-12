import { FinancierError } from "./base.js";

/**
 * Not found error (resource not found, e.g., account not found)
 */
export class NotFoundError extends FinancierError {
  constructor(
    message: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string
  ) {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
