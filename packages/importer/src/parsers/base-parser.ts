import type { BankCode, RawTransactionData } from "@nodm/financier-types";
import type { ParseResult } from "../services/csv-reader.js";

export interface ParsedData {
  accountId: string;
  transactions: Array<RawTransactionData>;
}

export abstract class BaseParser {
  abstract readonly bankCode: BankCode;
  abstract readonly requiredHeaders: Array<string>;

  canParse(headers: Array<string>): boolean {
    return this.requiredHeaders.every((h) => headers.includes(h));
  }

  abstract parse(filePath: string): Promise<ParsedData>;

  protected abstract mapRow(
    row: Record<string, string>,
    accountId: string
  ): RawTransactionData;

  protected abstract extractAccountId(data: ParseResult): string;
}
