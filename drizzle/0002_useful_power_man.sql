CREATE TABLE `activityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`actorId` int,
	`eventType` varchar(64) NOT NULL,
	`subjectType` varchar(64) NOT NULL,
	`subjectId` int,
	`summary` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`releaseId` int,
	`environment` enum('development','staging','production') NOT NULL,
	`status` enum('queued','running','success','failed','rolled-back') NOT NULL DEFAULT 'queued',
	`commitSha` varchar(64),
	`triggeredById` int,
	`startedAt` timestamp,
	`finishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deployments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_releaseId_releases_id_fk` FOREIGN KEY (`releaseId`) REFERENCES `releases`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_triggeredById_users_id_fk` FOREIGN KEY (`triggeredById`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;