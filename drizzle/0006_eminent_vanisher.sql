CREATE TABLE `websiteBuilds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`businessType` varchar(120) NOT NULL,
	`brief` text NOT NULL,
	`visualPreset` enum('studio','commerce','portfolio','launch') NOT NULL,
	`palette` varchar(64) NOT NULL,
	`primaryCta` varchar(120) NOT NULL,
	`domainCandidate` varchar(253),
	`domainStatus` enum('not-requested','verification-ready','connected') NOT NULL DEFAULT 'not-requested',
	`generationStatus` enum('generated','updated') NOT NULL DEFAULT 'generated',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `websiteBuilds_id` PRIMARY KEY(`id`),
	CONSTRAINT `website_build_project_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
ALTER TABLE `websiteBuilds` ADD CONSTRAINT `websiteBuilds_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `websiteBuilds` ADD CONSTRAINT `websiteBuilds_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;