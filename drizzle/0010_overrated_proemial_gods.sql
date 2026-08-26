CREATE TABLE `developerCenterProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`mode` enum('software','website','titles') NOT NULL,
	`brief` text NOT NULL,
	`headline` varchar(240) NOT NULL,
	`proposalJson` text NOT NULL,
	`model` varchar(120) NOT NULL,
	`reviewStatus` enum('draft','reviewed','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developerCenterProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `developerCenterProposals` ADD CONSTRAINT `developerCenterProposals_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;