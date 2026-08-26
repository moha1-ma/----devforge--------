CREATE TABLE `developerReviewTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`proposalId` int,
	`taskKey` varchar(80) NOT NULL,
	`category` enum('analysis','security','testing','ai','architecture') NOT NULL,
	`title` varchar(180) NOT NULL,
	`objective` text NOT NULL,
	`requiresOwnerApproval` boolean NOT NULL DEFAULT true,
	`status` enum('proposed','reviewed','archived') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developerReviewTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `developer_review_task_owner_key_unique` UNIQUE(`ownerId`,`taskKey`)
);
--> statement-breakpoint
ALTER TABLE `developerCenterProposals` MODIFY COLUMN `mode` enum('software','website','titles','security','ai','self-improvement') NOT NULL;--> statement-breakpoint
ALTER TABLE `developerCenterProposals` ADD `languageKey` varchar(48) DEFAULT 'python' NOT NULL;--> statement-breakpoint
ALTER TABLE `developerCenterProposals` ADD `focus` enum('general','security','ai','self-improvement') DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `developerReviewTasks` ADD CONSTRAINT `developerReviewTasks_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `developerReviewTasks` ADD CONSTRAINT `developerReviewTasks_proposalId_developerCenterProposals_id_fk` FOREIGN KEY (`proposalId`) REFERENCES `developerCenterProposals`(`id`) ON DELETE cascade ON UPDATE no action;