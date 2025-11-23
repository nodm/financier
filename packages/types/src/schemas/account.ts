import { z } from "zod";
import { Currency } from "../types/currency.js";

/**
 * Account schema for validation
 */
export const accountSchema = z.object({
  id: z.string().uuid(),
  hash: z.string().length(64), // SHA-256 produces 64 hex characters
  mask: z.string().length(4),
  currency: z.nativeEnum(Currency),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Raw account data schema
 */
export const rawAccountDataSchema = z.object({
  accountNumber: z.string().min(1),
  currency: z.nativeEnum(Currency),
});

/**
 * Account creation input schema
 */
export const createAccountSchema = z.object({
  accountNumber: z.string().min(1),
  currency: z.nativeEnum(Currency),
});
