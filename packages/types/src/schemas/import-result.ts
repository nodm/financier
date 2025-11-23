import { z } from "zod";

/**
 * Import error record schema
 */
export const importErrorRecordSchema = z.object({
  row: z.number().int().positive(),
  message: z.string().min(1),
  data: z.unknown().optional(),
});

/**
 * Import statistics schema
 */
export const importStatisticsSchema = z.object({
  totalRows: z.number().int().nonnegative(),
  imported: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  accounts: z.array(z.string()),
});

/**
 * Import result schema
 */
export const importResultSchema = z.object({
  success: z.boolean(),
  statistics: importStatisticsSchema,
  errors: z.array(importErrorRecordSchema),
});
