CREATE TABLE `periodicDevelopmentDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`ownerId` int NOT NULL,
	`kind` enum('architecture','code','tests','conflicts') NOT NULL,
	`status` enum('proposed','acknowledged','dismissed') NOT NULL DEFAULT 'proposed',
	`title` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`proposedChanges` text NOT NULL,
	`codeDraft` text NOT NULL,
	`testPlan` text NOT NULL,
	`risks` text NOT NULL,
	`approvalsRequired` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `periodicDevelopmentDrafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `periodicDevelopmentJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`cadence` enum('hourly','every-6-hours') NOT NULL DEFAULT 'every-6-hours',
	`status` enum('active','paused','error') NOT NULL DEFAULT 'active',
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`lastError` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `periodicDevelopmentJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdj_owner_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
ALTER TABLE `periodicDevelopmentDrafts` ADD CONSTRAINT `pdd_job_fk` FOREIGN KEY (`jobId`) REFERENCES `periodicDevelopmentJobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `periodicDevelopmentDrafts` ADD CONSTRAINT `pdd_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `periodicDevelopmentJobs` ADD CONSTRAINT `pdj_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pdd_job_idx` ON `periodicDevelopmentDrafts` (`jobId`);--> statement-breakpoint
CREATE INDEX `pdd_owner_status_idx` ON `periodicDevelopmentDrafts` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `pdj_cron_uid_idx` ON `periodicDevelopmentJobs` (`scheduleCronTaskUid`);