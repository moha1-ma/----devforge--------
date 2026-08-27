CREATE TABLE `azizDesignAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`collectionKey` enum('aziz-1','aziz-2','aziz-3') NOT NULL,
	`assetType` enum('website-template','business-card','book-cover') NOT NULL,
	`title` varchar(160) NOT NULL,
	`brief` text NOT NULL,
	`outputJson` text NOT NULL,
	`sourceType` enum('ai-draft','owner-upload','licensed-reference') NOT NULL DEFAULT 'ai-draft',
	`mediaUrl` varchar(1000),
	`status` enum('draft','pending','approved','rejected','archived') NOT NULL DEFAULT 'draft',
	`reviewerId` int,
	`moderationNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `azizDesignAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `azizDesignAssets` ADD CONSTRAINT `aziz_asset_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `azizDesignAssets` ADD CONSTRAINT `aziz_asset_reviewer_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `aziz_asset_collection_status_idx` ON `azizDesignAssets` (`collectionKey`,`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `aziz_asset_owner_idx` ON `azizDesignAssets` (`ownerId`,`updatedAt`);