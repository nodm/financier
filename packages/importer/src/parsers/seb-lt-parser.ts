import { readFileSync } from "node:fs";
import {
  BankCode,
  type Currency,
  type RawTransactionData,
} from "@nodm/financier-types";
import PapaModule from "papaparse";
import type { ParseResult } from "../services/csv-reader.js";
import { BaseParser, type ParsedData } from "./base-parser.js";

// Handle both default and named exports
const Papa =
  (PapaModule as { default?: typeof PapaModule }).default || PapaModule;

interface AccountChunk {
  accountId: string;
  csvContent: string;
}

// Header mappings for Lithuanian and English formats
const HEADER_MAPPINGS = {
  // Lithuanian -> normalized key
  // Note: "DOK NR." is the batch/clearing ID (e.g., CLR3887432), not unique per transaction
  // "TRANSAKCIJOS KODAS" contains the unique transaction reference (e.g., RO726122757)
  "DOK NR.": "instructionId",
  "TRANSAKCIJOS KODAS": "externalId",
  DATA: "date",
  "SUMA SĄSKAITOS VALIUTA": "amount",
  SUMA: "amountAlt",
  "SĄSKAITOS VALIUTA": "currency",
  "MOKĖTOJO ARBA GAVĖJO PAVADINIMAS": "merchant",
  "TRANSAKCIJOS TIPAS": "category",
  "DEBETAS/KREDITAS": "typeIndicator",
  SĄSKAITA: "counterpartyAccountId",
  "SĄSKAITOS NR": "accountNumber",
  "MOKĖJIMO PASKIRTIS": "description",
  // English -> normalized key
  // Note: "INSTRUCTION ID" is the batch/clearing ID (e.g., CLR3887432), not unique per transaction
  // "TRANSACTION CODE" contains the unique transaction reference (e.g., RO726122757)
  "INSTRUCTION ID": "instructionId",
  "TRANSACTION CODE": "externalId",
  DATE: "date",
  "AMOUNT IN ACCOUNT CURRENCY": "amount",
  AMOUNT: "amountAlt",
  "ACCOUNT CURRENCY": "currency",
  COUNTERPARTY: "merchant",
  "TRANSACTION TYPE": "category",
  "DEBIT/CREDIT": "typeIndicator",
  "ACCOUNT NO": "accountNumber",
  "DETAILS OF PAYMENTS": "description",
} as const;

// Account separator patterns
const ACCOUNT_SEPARATOR_PATTERNS = {
  lithuanian: { account: "SĄSKAITOS", statement: "IŠRAŠAS" },
  english: { account: "ACCOUNT", statement: "STATEMENT" },
};

// Header detection patterns
const HEADER_DETECTION_PATTERNS = {
  lithuanian: { id: "DOK NR.", type: "DEBETAS/KREDITAS" },
  english: { id: "INSTRUCTION ID", type: "DEBIT/CREDIT" },
};

export class SebLtParser extends BaseParser {
  readonly bankCode = BankCode.SEB;
  readonly requiredHeaders = ["DOK NR.", "SĄSKAITOS NR", "DEBETAS/KREDITAS"];

  async parse(filePath: string): Promise<ParsedData> {
    const content = readFileSync(filePath, "utf-8");
    const format = this.detectFormat(content);
    const chunks = this.splitIntoAccountChunks(content);

    if (chunks.length === 0) {
      throw new Error("No account data found in CSV");
    }

    // Aggregate transactions from all chunks
    const allTransactions: Array<RawTransactionData> = [];

    for (const chunk of chunks) {
      const chunkTransactions = this.parseChunk(chunk, format);
      if (chunkTransactions.length > 0) {
        allTransactions.push(...chunkTransactions);
      }
    }

    if (allTransactions.length === 0) {
      throw new Error("No transactions found in CSV");
    }

    return {
      accountId: chunks[0].accountId,
      transactions: allTransactions,
    };
  }

  private detectFormat(content: string): "lithuanian" | "english" {
    const firstLines = content.split("\n").slice(0, 10).join("\n");
    if (
      firstLines.includes(ACCOUNT_SEPARATOR_PATTERNS.english.account) &&
      firstLines.includes(ACCOUNT_SEPARATOR_PATTERNS.english.statement)
    ) {
      return "english";
    }
    return "lithuanian";
  }

  private splitIntoAccountChunks(content: string): Array<AccountChunk> {
    const format = this.detectFormat(content);
    const separatorPattern = ACCOUNT_SEPARATOR_PATTERNS[format];
    const headerPattern = HEADER_DETECTION_PATTERNS[format];

    const lines = content.split("\n");
    const chunks: Array<AccountChunk> = [];
    let currentAccountId: string | null = null;
    let currentLines: Array<string> = [];
    let headerLineSeen = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      // Check if this is an account separator row (works for both formats)
      if (
        trimmed.includes(separatorPattern.account) &&
        trimmed.includes(separatorPattern.statement)
      ) {
        // Save previous chunk if exists
        if (currentAccountId && currentLines.length > 0) {
          chunks.push({
            accountId: currentAccountId,
            csvContent: currentLines.join("\n"),
          });
        }

        // Extract new account ID
        const match = trimmed.match(/\(([A-Z]{2}[0-9]+)\)/);
        currentAccountId = match ? match[1] : null;
        currentLines = [];
        headerLineSeen = false;
        continue;
      }

      // Check if this is the header line (works for both formats)
      if (
        currentAccountId &&
        !headerLineSeen &&
        trimmed.includes(headerPattern.id) &&
        trimmed.includes(headerPattern.type)
      ) {
        headerLineSeen = true;
        currentLines.push(lines[i]);
        continue;
      }

      // Add data lines to current chunk
      if (currentAccountId && headerLineSeen) {
        currentLines.push(lines[i]);
      }
    }

    // Save last chunk
    if (currentAccountId && currentLines.length > 0) {
      chunks.push({
        accountId: currentAccountId,
        csvContent: currentLines.join("\n"),
      });
    }

    return chunks;
  }

  private normalizeRow(row: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const trimmedKey = key.trim();
      const mappedKey =
        HEADER_MAPPINGS[trimmedKey as keyof typeof HEADER_MAPPINGS];
      if (mappedKey) {
        // Don't overwrite if already set (handles duplicate mappings like ACCOUNT NO)
        if (!normalized[mappedKey]) {
          normalized[mappedKey] = value;
        }
      }
      // Also keep original key for backward compatibility
      normalized[trimmedKey] = value;
    }
    return normalized;
  }

  private parseChunk(
    chunk: AccountChunk,
    format: "lithuanian" | "english"
  ): Array<RawTransactionData> {
    // Use index-based parsing for English format to handle duplicate ACCOUNT NO columns
    if (format === "english") {
      return this.parseChunkWithDuplicateHeaders(chunk);
    }

    // Lithuanian format - use standard header-based parsing
    const result = Papa.parse(chunk.csvContent, {
      delimiter: ";",
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (result.errors.length > 0) {
      throw new Error(
        `CSV parse error: ${result.errors
          .map((e: { message: string }) => e.message)
          .join(", ")}`
      );
    }

    return result.data
      .filter((row: unknown) => {
        const r = row as Record<string, string>;
        // Check for both Lithuanian and English transaction code columns (unique per transaction)
        const transactionCode =
          r["TRANSAKCIJOS KODAS"] || r["TRANSACTION CODE"];
        return transactionCode && transactionCode.trim() !== "";
      })
      .map((row: unknown) =>
        this.mapRow(
          this.normalizeRow(row as Record<string, string>),
          chunk.accountId
        )
      );
  }

  private parseChunkWithDuplicateHeaders(
    chunk: AccountChunk
  ): Array<RawTransactionData> {
    // Parse CSV as arrays to preserve duplicate column headers
    const result = Papa.parse(chunk.csvContent, {
      delimiter: ";",
      header: false,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new Error(
        `CSV parse error: ${result.errors
          .map((e: { message: string }) => e.message)
          .join(", ")}`
      );
    }

    const data = result.data as Array<Array<string>>;
    if (data.length < 2) {
      return [];
    }

    // Extract and trim headers
    const headers = data[0].map((h) => h.trim());

    // Build column index map
    const columnMap = new Map<string, number>();
    const accountNoIndices: Array<number> = [];

    for (const [index, header] of headers.entries()) {
      if (header === "ACCOUNT NO") {
        accountNoIndices.push(index);
      } else {
        columnMap.set(header, index);
      }
    }

    // First ACCOUNT NO column = counterparty account
    // Second ACCOUNT NO column = my account (not extracted, uses chunk.accountId)
    const counterpartyAccountIdx =
      accountNoIndices.length > 0 ? accountNoIndices[0] : -1;

    // Process data rows
    const transactions: Array<RawTransactionData> = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Check for transaction code (required)
      const transactionCodeIdx = columnMap.get("TRANSACTION CODE");
      if (
        transactionCodeIdx === undefined ||
        !row[transactionCodeIdx] ||
        row[transactionCodeIdx].trim() === ""
      ) {
        continue;
      }

      // Build normalized record using index-based access
      const normalized: Record<string, string> = {};

      for (const [header, idx] of columnMap.entries()) {
        const mappedKey =
          HEADER_MAPPINGS[header as keyof typeof HEADER_MAPPINGS];
        if (mappedKey) {
          normalized[mappedKey] = row[idx] || "";
        }
        // Keep original header for backward compatibility
        normalized[header] = row[idx] || "";
      }

      // Handle duplicate ACCOUNT NO columns
      if (counterpartyAccountIdx >= 0) {
        normalized.counterpartyAccountId = row[counterpartyAccountIdx] || "";
      }
      // Note: myAccountIdx not stored as mapRow uses chunk.accountId instead

      transactions.push(this.mapRow(normalized, chunk.accountId));
    }

    return transactions;
  }

  // biome-ignore lint/correctness/noUnusedFunctionParameters: Not used in this implementation
  protected extractAccountId(data: ParseResult): string {
    return "";
  }

  protected mapRow(
    row: Record<string, string>,
    accountId: string
  ): RawTransactionData {
    // Parse date (format: YYYY-MM-DD) - use normalized key
    const date = new Date(row.date || row.DATA);

    // Parse amount - comma decimal separator, use normalized keys
    const amountStr = row.amount || row.amountAlt || "0";
    const amount = Number.parseFloat(amountStr.replace(",", "."));

    // Determine transaction type - use normalized key
    const typeIndicator = row.typeIndicator || row["DEBETAS/KREDITAS"];

    // Use transaction code as externalId (unique per transaction)
    // Falls back to instruction ID if transaction code is not available
    const externalId =
      row.externalId ||
      row["TRANSAKCIJOS KODAS"] ||
      row["TRANSACTION CODE"] ||
      row.instructionId ||
      row["DOK NR."];

    // Extract counterparty account ID
    const counterpartyAccountId =
      row.counterpartyAccountId || row.SĄSKAITA || null;

    return {
      externalId,
      date,
      amount: typeIndicator === "D" ? -Math.abs(amount) : Math.abs(amount),
      currency: (row.currency || row["SĄSKAITOS VALIUTA"] || "EUR") as Currency,
      merchant: row.merchant || row["MOKĖTOJO ARBA GAVĖJO PAVADINIMAS"] || null,
      description:
        row.description ||
        row["MOKĖJIMO PASKIRTIS"] ||
        row["DETAILS OF PAYMENTS"] ||
        null,
      category: row.category || row["TRANSAKCIJOS TIPAS"] || null,
      typeIndicator,
      accountNumber: accountId,
      counterpartyAccountId:
        counterpartyAccountId && counterpartyAccountId.trim() !== ""
          ? counterpartyAccountId.trim()
          : null,
    };
  }
}
