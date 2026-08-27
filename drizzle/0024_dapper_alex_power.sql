CREATE TABLE `siteNotificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`workspaceEnabled` boolean NOT NULL DEFAULT true,
	`communityEnabled` boolean NOT NULL DEFAULT true,
	`reviewEnabled` boolean NOT NULL DEFAULT true,
	`systemEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteNotificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_notification_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `siteNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('workspace','community','review','system') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` varchar(900) NOT NULL,
	`link` varchar(160),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `siteNotificationPreferences` ADD CONSTRAINT `siteNotificationPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `siteNotifications` ADD CONSTRAINT `siteNotifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `site_notification_user_read_idx` ON `siteNotifications` (`userId`,`readAt`);--> statement-breakpoint
CREATE INDEX `site_notification_user_created_idx` ON `siteNotifications` (`userId`,`createdAt`);