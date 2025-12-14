PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`openDate` text NOT NULL,
	`openingBalance` numeric,
	`currentBalance` numeric,
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
CREATE INDEX `accounts_bankCode_idx` ON `accounts` (`bankCode`);--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`counterpartyAccountId` text,
	`date` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`originalAmount` text,
	`originalCurrency` text,
	`merchant` text,
	`description` text NOT NULL,
	`category` text,
	`type` text NOT NULL,
	`balance` text,
	`externalId` text,
	`source` text NOT NULL,
	`importedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`counterpartyAccountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "accountId", "counterpartyAccountId", "date", "amount", "currency", "originalAmount", "originalCurrency", "merchant", "description", "category", "type", "balance", "externalId", "source", "importedAt", "createdAt", "updatedAt") SELECT "id", "accountId", "counterpartyAccountId", "date", "amount", "currency", "originalAmount", "originalCurrency", "merchant", "description", "category", "type", "balance", "externalId", "source", "importedAt", "createdAt", "updatedAt" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE INDEX `transactions_accountId_idx` ON `transactions` (`accountId`);--> statement-breakpoint
CREATE INDEX `transactions_counterpartyAccountId_idx` ON `transactions` (`counterpartyAccountId`);--> statement-breakpoint
CREATE INDEX `transactions_accountId_date_idx` ON `transactions` (`accountId`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_merchant_idx` ON `transactions` (`merchant`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_accountId_date_externalId_key` ON `transactions` (`accountId`,`date`,`externalId`);