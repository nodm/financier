import type { BankCode } from "./bank.js";
import type { Currency } from "./currency.js";

/**
 * Account information
 */
export interface Account {
  /** Unique account identifier (IBAN) */
  id: string;

  /** Account name/description */
  name: string;

  /** Account opening date */
  openDate: Date | null;

  /** Opening balance */
  openingBalance: number | null;

  /** Current balance */
  currentBalance: number | null;

  /** Account currency */
  currency: Currency;

  /** Bank code */
  bankCode: BankCode;

  /** Account active status */
  isActive: boolean;

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
