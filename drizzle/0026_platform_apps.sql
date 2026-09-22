CREATE TABLE `githubAggregationJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`destinationName` varchar(100) NOT NULL,
	`status` enum('preview','needs-review','publishing','published','sources-deleted','failed') NOT NULL DEFAULT 'preview',
	`sourcesJson` text NOT NULL,
	`filesJson` text NOT NULL,
	`conflictsJson` text NOT NULL,
	`destinationFullName` varchar(300),
	`destinationUrl` varchar(500),
	`deletionJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `githubAggregationJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `githubConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`githubLogin` varchar(100) NOT NULL,
	`encryptedToken` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `githubConnections_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_connection_owner_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE TABLE `userAppPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appKey` varchar(80) NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`lastOpenedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userAppPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_app_preference_user_app_unique` UNIQUE(`userId`,`appKey`)
);
--> statement-breakpoint
ALTER TABLE `githubAggregationJobs` ADD CONSTRAINT `githubAggregationJobs_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `githubConnections` ADD CONSTRAINT `githubConnections_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAppPreferences` ADD CONSTRAINT `userAppPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `github_aggregation_owner_updated_idx` ON `githubAggregationJobs` (`ownerId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `user_app_preference_user_order_idx` ON `userAppPreferences` (`userId`,`isPinned`,`displayOrder`);