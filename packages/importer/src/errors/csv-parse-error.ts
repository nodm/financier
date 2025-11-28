import { ImportError } from "@nodm/financier-types";

export class CSVParseError extends ImportError {
  constructor(
    message: string,
    public readonly line?: number
  ) {
    super(message, undefined, line);
    this.name = "CSVParseError";
    Object.setPrototypeOf(this, CSVParseError.prototype);
  }
}
