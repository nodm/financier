import type { Currency } from "./currency.js";

/**
 * Account information
 */
export interface Account {
  /** Unique account identifier (UUID) */
  id: string;

  /** SHA-256 hash of account number */
  hash: string;

  /** Masked account number (last 4 digits) */
  mask: string;

  /** Account currency */
  currency: Currency;

  /** Account creation timestamp */
  createdAt: Date;

  /** Account last update timestamp */
  updatedAt: Date;
}

/**
 * Raw account data before processing
 */
export interface RawAccountData {
  /** Raw account number from CSV */
  accountNumber: string;

  /** Account currency */
  currency: Currency;
}
