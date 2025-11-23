/**
 * ISO 4217 currency codes
 */
export enum Currency {
  EUR = "EUR",
  UAH = "UAH",
  USD = "USD",
  GBP = "GBP",
}

/**
 * Currency metadata
 */
export interface CurrencyMetadata {
  code: Currency;
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Currency registry
 */
export const CURRENCIES: Record<Currency, CurrencyMetadata> = {
  [Currency.EUR]: {
    code: Currency.EUR,
    name: "Euro",
    symbol: "€",
    decimals: 2,
  },
  [Currency.UAH]: {
    code: Currency.UAH,
    name: "Ukrainian Hryvnia",
    symbol: "₴",
    decimals: 2,
  },
  [Currency.USD]: {
    code: Currency.USD,
    name: "US Dollar",
    symbol: "$",
    decimals: 2,
  },
  [Currency.GBP]: {
    code: Currency.GBP,
    name: "British Pound",
    symbol: "£",
    decimals: 2,
  },
};
