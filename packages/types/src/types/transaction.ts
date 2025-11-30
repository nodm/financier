import type { Currency } from "./currency.js";

/**
 * Transaction type
 */
export enum TransactionType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

/**
 * Transaction category (user-defined or auto-categorized)
 */
export type TransactionCategory = string | null;

/**
 * Transaction merchant/description
 */
export type TransactionMerchant = string | null;

/**
 * Transaction record
 */
export interface Transaction {
  /** Unique transaction identifier (UUID) */
  id: string;

  /** Associated account ID (IBAN) */
  accountId: string;

  /** Counterparty account ID for internal transfers (IBAN) */
  counterpartyAccountId: string | null;

  /** Transaction date */
  date: Date;

  /** Transaction amount (can be positive or negative) */
  amount: number;

  /** Transaction currency */
  currency: Currency;

  /** Original amount before currency conversion */
  originalAmount: number | null;

  /** Original currency before conversion */
  originalCurrency: string | null;

  /** Merchant or payee name */
  merchant: TransactionMerchant;

  /** Transaction description */
  description: string;

  /** Transaction category */
  category: TransactionCategory;

  /** Transaction type (debit/credit) */
  type: TransactionType;

  /** Account balance after transaction (optional) */
  balance: number | null;

  /** External transaction ID from bank (for deduplication) */
  externalId: string | null;

  /** Transaction source (bank code or import source) */
  source: string;

  /** Import timestamp */
  importedAt: Date;

  /** Transaction creation timestamp */
  createdAt: Date;

  /** Transaction last update timestamp */
  updatedAt: Date;
}

/**
 * Raw transaction data from CSV before processing
 */
export interface RawTransactionData {
  /** Transaction date (string or Date) */
  date: string | Date;

  /** Transaction amount (may be signed or unsigned) */
  amount: number | string;

  /** Transaction currency */
  currency: Currency | string;

  /** Balance after transaction (optional) */
  balance?: number | string | null;

  /** Merchant/description */
  merchant?: string | null;

  /** Transaction description/payment purpose */
  description?: string | null;

  /** Category (optional) */
  category?: string | null;

  /** External ID for deduplication */
  externalId: string;

  /** Transaction type indicator (varies by bank) */
  typeIndicator?: string;

  /** Account number (for multi-account CSVs) */
  accountNumber?: string;
}

/**
 * Import statistics
 */
export interface ImportStatistics {
  /** Total rows processed */
  totalRows: number;

  /** Successfully imported transactions */
  imported: number;

  /** Skipped duplicates */
  duplicates: number;

  /** Failed validations */
  failed: number;

  /** Accounts affected */
  accounts: Array<string>;
}

/**
 * Import result
 */
export interface ImportResult {
  /** Import success status */
  success: boolean;

  /** Import statistics */
  statistics: ImportStatistics;

  /** Validation errors (if any) */
  errors: Array<ImportErrorRecord>;

  /** Duplicate transactions that were skipped (for review) */
  duplicateTransactions?: Array<RawTransactionData>;
}

/**
 * Import error record (data structure, not an Error class)
 */
export interface ImportErrorRecord {
  /** Row number in CSV */
  row: number;

  /** Error message */
  message: string;

  /** Raw row data (optional) */
  data?: unknown;
}
