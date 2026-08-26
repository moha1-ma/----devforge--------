CREATE TABLE `buildPlanSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`stepKey` varchar(64) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`deliverable` varchar(240) NOT NULL,
	`stepOrder` int NOT NULL,
	`status` enum('not-started','in-progress','done') NOT NULL DEFAULT 'not-started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buildPlanSteps_id` PRIMARY KEY(`id`),
	CONSTRAINT `build_plan_step_unique` UNIQUE(`planId`,`stepKey`)
);
--> statement-breakpoint
CREATE TABLE `buildPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`blueprint` enum('web','mobile','api','product') NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` enum('active','complete','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buildPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `buildPlanSteps` ADD CONSTRAINT `buildPlanSteps_planId_buildPlans_id_fk` FOREIGN KEY (`planId`) REFERENCES `buildPlans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buildPlans` ADD CONSTRAINT `buildPlans_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buildPlans` ADD CONSTRAINT `buildPlans_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;