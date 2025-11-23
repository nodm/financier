import { z } from "zod";
import { Currency } from "../types/currency.js";
import { TransactionType } from "../types/transaction.js";

/**
 * Transaction schema for validation
 */
export const transactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  externalId: z.string().min(1),
  date: z.date(),
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency),
  balance: z.number().nullable(),
  type: z.nativeEnum(TransactionType),
  merchant: z.string().nullable(),
  category: z.string().nullable(),
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
  category: z.string().nullable().optional(),
  externalId: z.string().min(1),
  typeIndicator: z.string().optional(),
  accountNumber: z.string().optional(),
});

/**
 * Transaction creation input schema
 */
export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  externalId: z.string().min(1),
  date: z.date(),
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency),
  balance: z.number().nullable(),
  type: z.nativeEnum(TransactionType),
  merchant: z.string().nullable(),
  category: z.string().nullable(),
});

/**
 * Transaction query filters schema
 */
export const transactionFiltersSchema = z.object({
  accountId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  merchant: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
});
