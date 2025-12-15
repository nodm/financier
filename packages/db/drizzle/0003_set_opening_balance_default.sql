-- Migration: Set openingBalance and currentBalance to non-null with default "0"
-- Set existing null values to "0"
UPDATE accounts SET openingBalance = '0' WHERE openingBalance IS NULL;
UPDATE accounts SET currentBalance = '0' WHERE currentBalance IS NULL;

-- Note: SQLite doesn't support ALTER COLUMN to add NOT NULL constraint directly
-- The schema changes (notNull().default("0")) will be enforced by Drizzle ORM for new inserts
