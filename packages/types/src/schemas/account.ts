import { z } from "zod";
import { BankCode } from "../types/bank.js";
import { Currency } from "../types/currency.js";

/**
 * Account schema for validation
 */
export const accountSchema = z.object({
  id: z.string().min(1), // IBAN
  name: z.string().min(1),
  openDate: z.date().nullable(),
  openingBalance: z.number().nullable(),
  currentBalance: z.number().nullable(),
  currency: z.nativeEnum(Currency),
  bankCode: z.nativeEnum(BankCode),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Account creation input schema
 */
export const createAccountSchema = z.object({
  id: z.string().min(1), // IBAN (user-provided)
  name: z.string().min(1),
  openDate: z.date().nullable().optional(),
  openingBalance: z.number().nullable().optional(),
  currentBalance: z.number().nullable().optional(),
  currency: z.nativeEnum(Currency),
  bankCode: z.nativeEnum(BankCode),
  isActive: z.boolean().default(true),
});

/**
 * Account update input schema
 */
export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  openDate: z.date().nullable().optional(),
  openingBalance: z.number().nullable().optional(),
  currentBalance: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});
