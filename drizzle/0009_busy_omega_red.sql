CREATE TABLE `integrationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`providerKey` varchar(80) NOT NULL,
	`status` enum('not-connected','request-recorded') NOT NULL DEFAULT 'not-connected',
	`requestedScope` varchar(120) NOT NULL DEFAULT 'metadata-only',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_preference_owner_provider_unique` UNIQUE(`ownerId`,`providerKey`)
);
--> statement-breakpoint
ALTER TABLE `integrationPreferences` ADD CONSTRAINT `integrationPreferences_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;