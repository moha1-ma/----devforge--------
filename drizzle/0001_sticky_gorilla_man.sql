CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`key` varchar(16) NOT NULL,
	`description` text,
	`repositoryUrl` varchar(500),
	`defaultBranch` varchar(120) NOT NULL DEFAULT 'main',
	`health` enum('on-track','watch','at-risk') NOT NULL DEFAULT 'on-track',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pullRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`number` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`status` enum('open','approved','merged','changes-requested') NOT NULL DEFAULT 'open',
	`authorId` int,
	`reviewerCount` int NOT NULL DEFAULT 0,
	`checksPassed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pullRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`version` varchar(64) NOT NULL,
	`environment` enum('development','staging','production') NOT NULL,
	`status` enum('queued','deploying','success','failed','rolled-back') NOT NULL DEFAULT 'queued',
	`deployedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `releases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`key` varchar(32) NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`status` enum('backlog','in-progress','review','done') NOT NULL DEFAULT 'backlog',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assigneeId` int,
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pullRequests` ADD CONSTRAINT `pullRequests_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pullRequests` ADD CONSTRAINT `pullRequests_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `releases` ADD CONSTRAINT `releases_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workItems` ADD CONSTRAINT `workItems_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workItems` ADD CONSTRAINT `workItems_assigneeId_users_id_fk` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;