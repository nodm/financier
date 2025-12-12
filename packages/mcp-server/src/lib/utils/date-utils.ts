/**
 * Parse ISO 8601 date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString + "T00:00:00.000Z");
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return date;
}

/**
 * Format Date to ISO 8601 date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

