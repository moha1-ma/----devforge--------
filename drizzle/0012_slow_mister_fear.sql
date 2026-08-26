CREATE TABLE `visitorSubmissionAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`kind` enum('image','video','code') NOT NULL,
	`safeName` varchar(180) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitorSubmissionAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitorSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorAlias` varchar(80),
	`category` enum('opinion','media','code','project') NOT NULL,
	`title` varchar(180) NOT NULL,
	`content` text NOT NULL,
	`consentAccepted` boolean NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`moderatorId` int,
	`moderationNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitorSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `visitorSubmissions` ADD CONSTRAINT `visitorSubmissions_moderatorId_users_id_fk` FOREIGN KEY (`moderatorId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
