import { FinancierError } from "./base.js";

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
