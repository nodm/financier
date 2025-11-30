/**
 * Normalize date to Date object
 * Handles both Date objects and date strings
 */
export function normalizeDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

/**
 * Normalize date to ISO string
 * Handles both Date objects and date strings
 */
export function normalizeDateToISO(date: Date | string): string {
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
}
