import { z } from "zod";

// Input schemas
export const getAccountsInputSchema = {
  includeBalance: z
    .boolean()
    .optional()
    .describe("Include current balance from latest transaction"),
  includeSummary: z
    .boolean()
    .optional()
    .describe("Include transaction count and last transaction date"),
};

// Output schemas
export const getAccountsOutputSchema = {
  accounts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      openDate: z.string().describe("ISO 8601 date string"),
      openingBalance: z.string().nullable(),
      currentBalance: z.number().optional(),
      currency: z.string(),
      bankCode: z.string(),
      isActive: z.boolean(),
      transactionCount: z.number().optional(),
      lastTransactionDate: z
        .string()
        .optional()
        .describe("ISO 8601 date string"),
      createdAt: z.string().describe("ISO 8601 date-time string"),
      updatedAt: z.string().describe("ISO 8601 date-time string"),
    })
  ),
};

// Phase 7: Add schemas for other tools here
