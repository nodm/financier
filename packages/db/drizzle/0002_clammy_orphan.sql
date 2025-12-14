PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`openDate` text NOT NULL,
	`openingBalance` text,
	`currentBalance` text,
	`currency` text NOT NULL,
	`bankCode` text NOT NULL,
	`isActive` text DEFAULT 'true' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "name", "openDate", "openingBalance", "currentBalance", "currency", "bankCode", "isActive", "createdAt", "updatedAt") SELECT "id", "name", "openDate", "openingBalance", "currentBalance", "currency", "bankCode", "isActive", "createdAt", "updatedAt" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `accounts_bankCode_idx` ON `accounts` (`bankCode`);