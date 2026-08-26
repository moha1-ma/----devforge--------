CREATE TABLE `domainCatalogItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`domainName` varchar(253) NOT NULL,
	`category` varchar(80) NOT NULL,
	`intendedUse` varchar(180) NOT NULL,
	`status` enum('proposed','verification-needed','shortlisted') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domainCatalogItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_catalog_owner_name_unique` UNIQUE(`ownerId`,`domainName`)
);
--> statement-breakpoint
ALTER TABLE `domainCatalogItems` ADD CONSTRAINT `domainCatalogItems_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;