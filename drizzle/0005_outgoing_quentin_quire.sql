CREATE TABLE `aiImageAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`prompt` text NOT NULL,
	`imageUrl` varchar(1000) NOT NULL,
	`model` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiImageAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiImageAssets` ADD CONSTRAINT `aiImageAssets_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiImageAssets` ADD CONSTRAINT `aiImageAssets_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;