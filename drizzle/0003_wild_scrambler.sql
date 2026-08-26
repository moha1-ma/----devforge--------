CREATE TABLE `aiMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`title` varchar(180) NOT NULL,
	`provider` enum('local','managed','disabled') NOT NULL DEFAULT 'disabled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiThreads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `githubProjectLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ownerId` int NOT NULL,
	`repositoryFullName` varchar(300) NOT NULL,
	`defaultBranch` varchar(120) NOT NULL DEFAULT 'main',
	`syncState` enum('not-connected','connected','attention') NOT NULL DEFAULT 'not-connected',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `githubProjectLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_project_link_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `sourceFileRevisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceFileId` int NOT NULL,
	`authorId` int NOT NULL,
	`revisionNumber` int NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`sizeBytes` int NOT NULL,
	`note` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sourceFileRevisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_file_revision_unique` UNIQUE(`sourceFileId`,`revisionNumber`)
);
--> statement-breakpoint
CREATE TABLE `sourceFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ownerId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`language` varchar(64) NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`sizeBytes` int NOT NULL,
	`revisionCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sourceFiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_file_project_path_unique` UNIQUE(`projectId`,`path`)
);
--> statement-breakpoint
ALTER TABLE `aiMessages` ADD CONSTRAINT `aiMessages_threadId_aiThreads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `aiThreads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiThreads` ADD CONSTRAINT `aiThreads_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiThreads` ADD CONSTRAINT `aiThreads_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `githubProjectLinks` ADD CONSTRAINT `githubProjectLinks_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `githubProjectLinks` ADD CONSTRAINT `githubProjectLinks_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceFileRevisions` ADD CONSTRAINT `sourceFileRevisions_sourceFileId_sourceFiles_id_fk` FOREIGN KEY (`sourceFileId`) REFERENCES `sourceFiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceFileRevisions` ADD CONSTRAINT `sourceFileRevisions_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceFiles` ADD CONSTRAINT `sourceFiles_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceFiles` ADD CONSTRAINT `sourceFiles_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;