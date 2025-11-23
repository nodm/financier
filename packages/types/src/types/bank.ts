/**
 * Bank codes for supported financial institutions
 */
export enum BankCode {
  REVOLUT = "REVOLUT",
  SEB = "SEB",
  SWEDBANK = "SWEDBANK",
  MONOBANK = "MONOBANK",
  PRIVATBANK = "PRIVATBANK",
}

/**
 * Bank metadata
 */
export interface BankMetadata {
  code: BankCode;
  name: string;
  country: string;
}

/**
 * Supported banks registry
 */
export const SUPPORTED_BANKS: Record<BankCode, BankMetadata> = {
  [BankCode.REVOLUT]: {
    code: BankCode.REVOLUT,
    name: "Revolut",
    country: "LT",
  },
  [BankCode.SEB]: {
    code: BankCode.SEB,
    name: "SEB Bank",
    country: "LT",
  },
  [BankCode.SWEDBANK]: {
    code: BankCode.SWEDBANK,
    name: "Swedbank",
    country: "LT",
  },
  [BankCode.MONOBANK]: {
    code: BankCode.MONOBANK,
    name: "Monobank",
    country: "UA",
  },
  [BankCode.PRIVATBANK]: {
    code: BankCode.PRIVATBANK,
    name: "PrivatBank",
    country: "UA",
  },
};
