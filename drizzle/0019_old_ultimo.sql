CREATE TABLE `githubMergePlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`toolName` varchar(120) NOT NULL,
	`brief` text NOT NULL,
	`sourceJson` text NOT NULL,
	`planJson` text NOT NULL,
	`reviewStatus` enum('draft','acknowledged','dismissed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `githubMergePlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `githubMergePlans` ADD CONSTRAINT `gmp_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `gmp_owner_status_idx` ON `githubMergePlans` (`ownerId`,`reviewStatus`);