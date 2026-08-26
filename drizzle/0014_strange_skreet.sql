CREATE TABLE `visitorConversationMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderRole` enum('visitor','owner') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitorConversationMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitorConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` int NOT NULL,
	`subject` varchar(180) NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitorConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `visitorConversationMessages` ADD CONSTRAINT `vcm_conv_fk` FOREIGN KEY (`conversationId`) REFERENCES `visitorConversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visitorConversationMessages` ADD CONSTRAINT `vcm_sender_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visitorConversations` ADD CONSTRAINT `visitorConversations_visitorId_users_id_fk` FOREIGN KEY (`visitorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
