CREATE TABLE `marketplaceStores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`slug` varchar(72) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(700) NOT NULL,
	`category` varchar(80) NOT NULL,
	`status` enum('draft','pending','approved','rejected','archived') NOT NULL DEFAULT 'draft',
	`reviewerId` int,
	`moderationNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceStores_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_store_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `marketplaceStores` ADD CONSTRAINT `marketplace_store_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplaceStores` ADD CONSTRAINT `marketplace_store_reviewer_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `marketplace_store_status_idx` ON `marketplaceStores` (`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `marketplace_store_owner_idx` ON `marketplaceStores` (`ownerId`,`updatedAt`);