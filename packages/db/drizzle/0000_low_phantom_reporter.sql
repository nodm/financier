CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`openDate` integer,
	`openingBalance` text,
	`currentBalance` text,
	`currency` text NOT NULL,
	`bankCode` text NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `accounts_bankCode_idx` ON `accounts` (`bankCode`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`counterpartyAccountId` text,
	`date` integer NOT NULL,
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
	`importedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`counterpartyAccountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transactions_accountId_idx` ON `transactions` (`accountId`);--> statement-breakpoint
CREATE INDEX `transactions_counterpartyAccountId_idx` ON `transactions` (`counterpartyAccountId`);--> statement-breakpoint
CREATE INDEX `transactions_accountId_date_idx` ON `transactions` (`accountId`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_merchant_idx` ON `transactions` (`merchant`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_accountId_date_externalId_key` ON `transactions` (`accountId`,`date`,`externalId`);