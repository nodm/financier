import { z } from 'zod';
import { Currency } from '../types/currency.js';
import { TransactionType } from '../types/transaction.js';

/**
 * Transaction schema for validation
 */
export const transactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().min(1), // IBAN
  counterpartyAccountId: z.string().min(1).nullable(),
  date: z.date(),
  amount: z.number(),
  currency: z.nativeEnum(Currency),
  originalAmount: z.number().nullable(),
  originalCurrency: z.string().nullable(),
  merchant: z.string().nullable(),
  description: z.string(),
  category: z.string().nullable(),
  type: z.nativeEnum(TransactionType),
  balance: z.number().nullable(),
  externalId: z.string().nullable(),
  source: z.string(),
  importedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Raw transaction data schema (flexible for CSV parsing)
 */
export const rawTransactionDataSchema = z.object({
  date: z.union([z.string(), z.date()]),
  amount: z.union([z.number(), z.string()]),
  currency: z.union([z.nativeEnum(Currency), z.string()]),
  balance: z.union([z.number(), z.string(), z.null()]).optional(),
  merchant: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  externalId: z.string().min(1),
  typeIndicator: z.string().optional(),
  accountNumber: z.string().optional(),
});

/**
 * Transaction creation input schema
 */
export const createTransactionSchema = z.object({
  accountId: z.string().min(1), // IBAN
  counterpartyAccountId: z.string().min(1).nullable(),
  date: z.date(),
  amount: z.number(),
  currency: z.nativeEnum(Currency),
  originalAmount: z.number().nullable(),
  originalCurrency: z.string().nullable(),
  merchant: z.string().nullable(),
  description: z.string(),
  category: z.string().nullable(),
  type: z.nativeEnum(TransactionType),
  balance: z.number().nullable(),
  externalId: z.string().nullable(),
  source: z.string(),
});

/**
 * Transaction query filters schema
 */
export const transactionFiltersSchema = z.object({
  accountId: z.string().min(1).optional(), // IBAN
  counterpartyAccountId: z.string().min(1).optional(), // IBAN
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  merchant: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
});
