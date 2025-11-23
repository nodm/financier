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
