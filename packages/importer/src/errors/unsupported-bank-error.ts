import { ImportError } from "@nodm/financier-types";

export class UnsupportedBankError extends ImportError {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedBankError";
    Object.setPrototypeOf(this, UnsupportedBankError.prototype);
  }
}
