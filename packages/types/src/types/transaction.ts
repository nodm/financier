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

  /** Associated account ID */
  accountId: string;

  /** External transaction ID from bank (for deduplication) */
  externalId: string;

  /** Transaction date */
  date: Date;

  /** Transaction amount (always positive, type determines direction) */
  amount: number;

  /** Transaction currency */
  currency: Currency;

  /** Account balance after transaction (optional) */
  balance: number | null;

  /** Transaction type (debit/credit) */
  type: TransactionType;

  /** Merchant or transaction description */
  merchant: TransactionMerchant;

  /** Transaction category */
  category: TransactionCategory;

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
